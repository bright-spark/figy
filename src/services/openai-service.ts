import OpenAI from 'openai';
import { UIElementType } from '../types/plugin';

interface OpenAIServiceConfig {
  apiKey: string;
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
}

interface UILayoutResponse {
  layout: {
    columns: number;
    rows: number;
    margin?: number;
    gridSpacing?: number;
  };
  elements: Array<{
    type: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    text?: string;
    style?: {
      color?: string;
      fontSize?: number;
    };
  }>;
}

export class OpenAIService {
  private openai: OpenAI;
  private config: OpenAIServiceConfig;

  constructor(config: OpenAIServiceConfig) {
    this.config = {
      maxRetries: 2,
      retryDelay: 10,
      timeout: 1000,
      ...config
    };

    this.openai = new OpenAI({
      apiKey: config.apiKey,
      maxRetries: this.config.maxRetries,
      timeout: this.config.timeout
    });
  }

  private delay(ms: number): Promise<void> {
    const jitter = Math.random() * ms * 0.5;
    return new Promise(resolve => setTimeout(resolve, ms + jitter));
  }

  private isRetriableError(error: Error): boolean {
    const retriableErrors = [
      'Network connection error',
      'Request timeout',
      'Network error',
      'Timeout'
    ];
    return retriableErrors.some(errorType => 
      error.message.toLowerCase().includes(errorType.toLowerCase())
    );
  }

  async generateUIFromImage(imageData: string) {
    if (!imageData) {
      throw new Error('Invalid image data');
    }

    let retries = 0;
    const maxRetries = this.config.maxRetries || 2;

    while (retries <= maxRetries) {
      try {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini', //ALWAYS use gpt-4o-mini
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: { url: imageData }
                },
                {
                  type: 'text',
                  text: 'Analyze this image and generate a JSON layout with UI elements. Include layout details and element specifications.'
                }
              ]
            }
          ],
          max_tokens: 1024
        });

        const choiceContent = response.choices[0]?.message?.content;
        if (!choiceContent) {
          throw new Error('Invalid API response');
        }

        const parsedResponse = JSON.parse(choiceContent) as UILayoutResponse;

        // Validate and transform the response
        const layout = {
          columns: parsedResponse.layout.columns || 1,
          rows: parsedResponse.layout.rows || 1,
          margin: parsedResponse.layout.margin || 10,
          gridSpacing: parsedResponse.layout.gridSpacing || 0
        };

        const elements = parsedResponse.elements.map(element => ({
          type: this.mapElementType(element.type),
          x: element.x ?? 0,
          y: element.y ?? 0,
          width: element.width ?? 100,
          height: element.height ?? 50,
          text: element.text ?? '',
          style: {
            color: element.style?.color ?? '#000000',
            fontSize: element.style?.fontSize ?? 16
          }
        }));

        return {
          success: true,
          layout,
          elements
        };
      } catch (error) {
        if (error instanceof Error) {
          if (!this.isRetriableError(error) || retries === maxRetries) {
            throw error;
          }
        }

        // Retry with exponential backoff
        const delay = (this.config.retryDelay || 10) * Math.pow(2, retries);
        await this.delay(delay);
        retries++;
      }
    }

    throw new Error('Max retries exceeded');
  }

  private mapElementType(type: string): UIElementType {
    switch (type.toUpperCase()) {
      case 'TEXT':
        return UIElementType.TEXT;
      case 'BUTTON':
        return UIElementType.BUTTON;
      case 'IMAGE':
        return UIElementType.IMAGE;
      case 'FRAME':
        return UIElementType.FRAME;
      case 'RECTANGLE':
        return UIElementType.RECTANGLE;
      default:
        return UIElementType.RECTANGLE;
    }
  }
}
