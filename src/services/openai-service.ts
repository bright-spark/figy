import OpenAI from 'openai';
import { 
  UIElementType, 
  AnalysisResult,
  ImageAnalysisError,
  OpenAIServiceError
} from '../types/plugin';

export class OpenAIService {
  private client: OpenAI;
  private ANALYSIS_PROMPT = "Analyze UI elements in image. Provide JSON with layout and elements. Ensure response is a valid JSON with these keys: layout (width, height), uiElements (type, position, style, content).";

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
        model: 'gpt-4-0125-vision-preview',
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
        max_tokens: 300,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new OpenAIServiceError('Failed to retrieve analysis content');
      }

      try {
        return this.parseResponse(content);
      } catch (error) {
        throw new OpenAIServiceError('Failed to parse analysis response', { originalError: error });
      }
    } catch (error) {
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
            height: element.style?.height || 50,
            color: element.style?.color,
            backgroundColor: element.style?.backgroundColor
          },
          content: element.content || ''
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