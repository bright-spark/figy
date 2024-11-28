import axios, { AxiosResponse } from 'axios';
import {
  UIElementType,
  AnalysisResult,
  ImageAnalysisError,
  OpenAIServiceError
} from '../types/plugin';

export class RateLimitError extends OpenAIServiceError {
  retryAfter: number;

  constructor(message: string, retryAfter: number = 3600) {
    super(message);
    this.retryAfter = retryAfter;
  }
}

interface OpenAIServiceOptions {
  maxRetries?: number;
  baseRetryDelay?: number;
  maxRetryDelay?: number;
  apiKey?: string;
}

export class OpenAIService {
  private apiKey: string;
  private baseUrl: string;
  private options: Required<Omit<OpenAIServiceOptions, 'apiKey'>>;

  constructor(options: OpenAIServiceOptions = {}) {
    const apiKey = options.apiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new OpenAIServiceError('API key is required');
    }
    if (!apiKey.startsWith('sk-')) {
      throw new OpenAIServiceError('Invalid API key format. Must start with sk-');
    }

    this.apiKey = apiKey;
    this.baseUrl = apiKey.startsWith('sk-proj-') 
      ? 'https://api.codeium.com/v1/chat/completions'
      : 'https://api.openai.com/v1/chat/completions';
    
    // Configuration options with defaults
    this.options = {
      maxRetries: options.maxRetries ?? 3,
      baseRetryDelay: options.baseRetryDelay ?? 1000, // 1 second
      maxRetryDelay: options.maxRetryDelay ?? 5000,   // 5 seconds
    };
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private calculateBackoffDelay(retryCount: number): number {
    // Exponential backoff with jitter
    const baseDelay = this.options.baseRetryDelay * Math.pow(2, retryCount);
    const jitter = Math.random() * 0.5 * baseDelay;
    return Math.min(
      Math.max(baseDelay + jitter, this.options.baseRetryDelay), 
      this.options.maxRetryDelay
    );
  }

  private async callOpenAIChatAPI(prompt: string, imageBase64: string, retryCount: number = 0): Promise<string> {
    try {
      const response: AxiosResponse = await axios.post(
        this.baseUrl,
        {
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/png;base64,${imageBase64}`
                  }
                }
              ]
            }
          ],
          max_tokens: 2048,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );

      const content = response.data?.choices?.[0]?.message?.content;
      if (typeof content !== 'string') {
        throw new OpenAIServiceError('Invalid response from OpenAI');
      }
      return content;
    } catch (error: any) {
      console.error('OpenAI API Error:', error);

      // Handle specific error types
      if (error.response) {
        switch (error.response.status) {
          case 401:
            throw new OpenAIServiceError('Invalid API key or unauthorized access');
          
          case 404:
            throw new OpenAIServiceError('API endpoint not found. Check if the model is available for your account');
          
          case 429:
            // Rate limit error with potential retry-after header
            const retryAfter = error.response.headers['retry-after'] 
              ? parseInt(error.response.headers['retry-after'], 10) 
              : 3600; // Default to 1 hour
            
            throw new RateLimitError('Rate limit exceeded. Please try again later.', retryAfter);
          
          case 500:
          case 502:
          case 503:
          case 504:
            // For server errors, retry with exponential backoff
            if (retryCount >= this.options.maxRetries) {
              throw new OpenAIServiceError('Max retry attempts exceeded');
            }
            const delay = this.calculateBackoffDelay(retryCount);
            await this.delay(delay);
            return this.callOpenAIChatAPI(prompt, imageBase64, retryCount + 1);
        }
      }

      // Re-throw OpenAIServiceError as is
      if (error instanceof OpenAIServiceError) {
        throw error;
      }

      // Generic error handling
      throw new OpenAIServiceError('Failed to analyze image');
    }
  }

  private parseAIResponse(response: string): AnalysisResult {
    try {
      const parsed = JSON.parse(response);
      
      if (!parsed || typeof parsed !== 'object') {
        throw new ImageAnalysisError('Failed to parse AI response: invalid JSON');
      }

      if (!parsed.layout || !parsed.elements) {
        throw new ImageAnalysisError('Failed to parse AI response: missing required fields');
      }

      return {
        layout: {
          columns: parsed.layout.columns ?? 0,
          rows: parsed.layout.rows ?? 0,
          gridSpacing: parsed.layout.gridSpacing ?? 0,
          margin: parsed.layout.margin ?? 0,
        },
        elements: parsed.elements.map((elem: any) => ({
          type: Object.values(UIElementType).includes(elem.type) 
            ? elem.type 
            : UIElementType.RECTANGLE,
          x: elem.x ?? 0,
          y: elem.y ?? 0,
          width: elem.width ?? 100,
          height: elem.height ?? 50,
          text: elem.text ?? elem.content ?? '',
          color: elem.style?.color,
          backgroundColor: elem.style?.backgroundColor,
          opacity: elem.style?.opacity,
          cornerRadius: elem.style?.cornerRadius,
        })),
        components: parsed.components || {}
      };
    } catch (error: any) {
      console.error('Parsing Error:', error);
      if (error instanceof ImageAnalysisError) {
        throw error;
      }
      throw new ImageAnalysisError('Failed to parse AI response');
    }
  }

  async analyzeImage(imageBase64: string): Promise<AnalysisResult> {
    // Validate input
    if (!imageBase64) {
      throw new OpenAIServiceError('Image data cannot be empty');
    }

    if (typeof imageBase64 !== 'string') {
      throw new OpenAIServiceError('Image data must be a string');
    }

    try {
      const prompt = `
        Analyze this UI design image and generate a comprehensive JSON representation. 
        Include a layout object with grid specifications and an array of UI elements. 
        Each element should have type, position, dimensions, and styling properties.
        
        JSON Schema:
        {
          "layout": {
            "columns": number,
            "rows": number,
            "gridSpacing": number,
            "margin": number
          },
          "elements": [
            {
              "type": string,
              "x": number,
              "y": number,
              "width": number,
              "height": number,
              "content": string,
              "style": {
                "color": string,
                "backgroundColor": string,
                "opacity": number,
                "cornerRadius": number
              }
            }
          ]
        }`;

      const aiResponse = await this.callOpenAIChatAPI(prompt, imageBase64);
      return this.parseAIResponse(aiResponse);
    } catch (error) {
      if (error instanceof OpenAIServiceError || error instanceof ImageAnalysisError) {
        throw error;
      }
      throw new ImageAnalysisError('Failed to analyze image');
    }
  }
}

export default OpenAIService;
