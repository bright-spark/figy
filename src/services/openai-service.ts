import OpenAI from 'openai';
import { 
  UIElementType, 
  AnalysisResult as ImportedAnalysisResult,
  ImageAnalysisError as ImportedImageAnalysisError,
  OpenAIServiceError as ImportedOpenAIServiceError
} from '../plugin/code';

// Robust type definitions
export interface ColorRGB {
  r: number;
  g: number;
  b: number;
}

export interface UIElementProperties {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface UIElement {
  type: UIElementType;
  properties: UIElementProperties;
  content?: string;
}

export interface LayoutInfo {
  width: number;
  height: number;
  elements: any[];
}

export interface AnalysisResult {
  layout: LayoutInfo;
  elements: UIElement[];
}

// Custom Errors
export class ImageAnalysisError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageAnalysisError';
  }
}

export class OpenAIServiceError extends Error {
  details?: Record<string, unknown>;
  constructor(message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'OpenAIServiceError';
    this.details = details;
  }
}

export class OpenAIService {
  private client: OpenAI;
  private ANALYSIS_PROMPT = "Analyze UI elements in image. Provide JSON with layout and elements.";

  constructor(apiKey: string) {
    this.client = new OpenAI({ 
      apiKey,
      dangerouslyAllowBrowser: true 
    });
  }

  async analyzeImage(imageData: string): Promise<AnalysisResult> {
    if (!imageData) {
      throw new ImageAnalysisError('Invalid image data');
    }

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: this.ANALYSIS_PROMPT
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageData
                }
              }
            ]
          }
        ],
        max_tokens: 300
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new OpenAIServiceError('Failed to retrieve analysis content');
      }

      try {
        return this.parseResponse(content);
      } catch (error) {
        if (error instanceof OpenAIServiceError) {
          throw error;
        }
        throw new OpenAIServiceError('Failed to parse analysis response', { originalError: error });
      }
    } catch (error) {
      if (error instanceof OpenAIServiceError) {
        throw error;
      }
      throw new OpenAIServiceError('Image analysis failed', { originalError: error });
    }
  }

  private parseResponse(rawContent: string): AnalysisResult {
    try {
      const data = JSON.parse(rawContent);
      return {
        layout: {
          width: data.layout?.width || 800,
          height: data.layout?.height || 600,
          elements: []
        },
        elements: (data.uiElements || []).map((element: any) => ({
          type: this.mapElementType(element.type),
          properties: {
            x: element.position?.x || 0,
            y: element.position?.y || 0,
            width: element.style?.width || 100,
            height: element.style?.height || 50
          },
          content: element.content
        }))
      };
    } catch (error) {
      throw new OpenAIServiceError('Failed to parse analysis response', { originalError: error });
    }
  }

  private mapElementType(type: string): UIElementType {
    const typeMap: Record<string, UIElementType> = {
      'TEXT': UIElementType.TEXT,
      'BUTTON': UIElementType.BUTTON,
      'RECTANGLE': UIElementType.RECTANGLE,
      'IMAGE': UIElementType.IMAGE,
      'CONTAINER': UIElementType.CONTAINER
    };
    return typeMap[type.toUpperCase()] || UIElementType.UNKNOWN;
  }
}

export default OpenAIService;
