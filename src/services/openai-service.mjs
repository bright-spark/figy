import axios from 'axios';

export class OpenAIServiceError extends Error {
  constructor(message, details = null, type = 'generic') {
    super(message);
    this.name = 'OpenAIServiceError';
    this.details = details;
    this.type = type;
  }
}

export class ImageAnalysisError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = 'ImageAnalysisError';
    this.details = details;
  }
}

export class RateLimitError extends OpenAIServiceError {
  constructor(message, retryAfter = 3600) {
    super(message, null, 'rate_limit');
    this.retryAfter = retryAfter;
  }
}

export class OpenAIService {
  constructor(apiKey, options = {}) {
    if (!apiKey) {
      throw new OpenAIServiceError('API key is required', null, 'configuration');
    }
    if (!apiKey.startsWith('sk-')) {
      throw new OpenAIServiceError('Invalid API key format. Must start with sk-', null, 'validation');
    }

    this.apiKey = apiKey;
    this.baseUrl = apiKey.startsWith('sk-proj-') 
      ? 'https://api.codeium.com/v1/chat/completions'
      : 'https://api.openai.com/v1/chat/completions';
    
    // Configuration options with defaults
    this.options = {
      maxRetries: options.maxRetries || 3,
      baseRetryDelay: options.baseRetryDelay || 1000, // 1 second
      maxRetryDelay: options.maxRetryDelay || 5000,   // 5 seconds
      ...options
    };

    // Request tracking
    this.requestCount = 0;
    this.lastResetTime = Date.now();
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  calculateBackoffDelay(retryCount) {
    // Exponential backoff with jitter
    const baseDelay = this.options.baseRetryDelay * Math.pow(2, retryCount);
    const jitter = Math.random() * 0.5 * baseDelay;
    return Math.min(
      Math.max(baseDelay + jitter, this.options.baseRetryDelay), 
      this.options.maxRetryDelay
    );
  }

  async callOpenAIChatAPI(prompt, imageBase64, retryCount = 0) {
    try {
      // Check if we've exceeded max retries
      if (retryCount >= this.options.maxRetries) {
        throw new OpenAIServiceError(
          'Max retry attempts exceeded', 
          null, 
          'retry_exhausted'
        );
      }

      const response = await axios.post(
        this.baseUrl,
        {
          model: 'gpt-4-vision-preview',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                {
                  type: 'image_url',
                  image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
                },
              ],
            },
          ],
          max_tokens: 4096,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      const content = response.data?.choices[0]?.message?.content;
      if (typeof content !== 'string') {
        throw new OpenAIServiceError('Invalid response from OpenAI', null, 'response_format');
      }
      return content;
    } catch (error) {
      console.error('OpenAI API Error:', error);

      // Handle specific error types
      if (error.response) {
        switch (error.response.status) {
          case 401:
            throw new OpenAIServiceError(
              'Invalid API key or unauthorized access', 
              error, 
              'authorization'
            );
          
          case 404:
            throw new OpenAIServiceError(
              'API endpoint not found. Check if the model is available for your account', 
              error, 
              'endpoint_not_found'
            );
          
          case 429:
            // Rate limit error with potential retry-after header
            const retryAfter = error.response.headers['retry-after'] 
              ? parseInt(error.response.headers['retry-after'], 10) 
              : 3600; // Default to 1 hour
            
            throw new RateLimitError(
              'Rate limit exceeded. Please try again later.', 
              retryAfter
            );
          
          case 500:
          case 502:
          case 503:
          case 504:
            // Retry for server errors with exponential backoff
            const delay = this.calculateBackoffDelay(retryCount);
            await this.delay(delay);
            return this.callOpenAIChatAPI(prompt, imageBase64, retryCount + 1);
        }
      }

      // Generic error handling
      throw new OpenAIServiceError('Failed to analyze image', error, 'network');
    }
  }

  parseAIResponse(response) {
    try {
      const parsedResponse = JSON.parse(response);

      // Validate the parsed response
      if (!parsedResponse.layout || !parsedResponse.elements) {
        throw new ImageAnalysisError('Invalid AI response format');
      }

      return {
        layout: parsedResponse.layout,
        elements: parsedResponse.elements,
        components: parsedResponse.components || {},
      };
    } catch (error) {
      console.error('Parsing Error:', error);
      throw new ImageAnalysisError('Failed to parse AI response', error);
    }
  }

  async analyzeImage(imageBase64) {
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
              "type": "rectangle|text|button|input",
              "x": number,
              "y": number,
              "width": number,
              "height": number,
              "style": {
                "backgroundColor": string,
                "borderRadius": number,
                "textAlign": string,
                ...
              },
              "content": string (optional)
            }
          ],
          "components": {
            // Optional reusable components
          }
        }
      `;

      const response = await this.callOpenAIChatAPI(prompt, imageBase64);
      return this.parseAIResponse(response);
    } catch (error) {
      console.error('Analysis Error:', error);
      throw error;
    }
  }
}

export default OpenAIService;
