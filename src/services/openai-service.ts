import OpenAI from 'openai';
import { UIElementType, UIElement as PluginUIElement, LayoutInfo } from '../types/plugin';

interface OpenAIServiceConfig {
  apiKey: string;
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
}

type UIElement = PluginUIElement;

interface UILayout extends LayoutInfo {}

interface GenerateUIResponse {
  success: boolean;
  layout: UILayout;
  elements: UIElement[];
}

interface ParsedElementResponse {
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
}

interface ParsedLayoutResponse {
  columns?: number;
  rows?: number;
  margin?: number;
  gridSpacing?: number;
}

interface ParsedResponse {
  layout: ParsedLayoutResponse;
  elements: ParsedElementResponse[];
}

export class OpenAIService {
  private client: OpenAI;
  private maxRetries: number;
  private retryDelay: number;

  constructor(config: OpenAIServiceConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      timeout: config.timeout,
    });
    this.maxRetries = config.maxRetries || 3;
    this.retryDelay = config.retryDelay || 1000;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async retry<T>(fn: () => Promise<T>, retries = this.maxRetries): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries <= 0) throw error;
      await this.sleep(this.retryDelay);
      return this.retry(fn, retries - 1);
    }
  }

  async generateUIFromImage(base64Image: string): Promise<GenerateUIResponse> {
    const systemPrompt = `You are an expert UI designer and developer. Analyze the provided image and generate a detailed UI layout description. Focus on:
1. Layout structure and hierarchy
2. Component placement and relationships
3. Visual styling (colors, typography, spacing)
4. Interactive elements and their behavior
5. Responsive design considerations`;

    const userPrompt =
      'Please analyze this UI design image and provide a detailed description of the layout and components.';

    return this.retry(async () => {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini', // ALWAYS USE gpt-4o-mini
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: userPrompt },
              {
                type: 'image_url',
                image_url: {
                  url: base64Image,
                },
              },
            ],
          },
        ],
        max_tokens: 4096,
      });

      const choiceContent = response.choices[0]?.message?.content;
      if (!choiceContent) {
        throw new Error('Invalid API response');
      }

      const parsedResponse = JSON.parse(choiceContent) as ParsedResponse;

      // Validate and transform the response
      const layout: UILayout = {
        columns: parsedResponse.layout.columns || 1,
        rows: parsedResponse.layout.rows || 1,
        margin: parsedResponse.layout.margin || 10,
        gridSpacing: parsedResponse.layout.gridSpacing || 0,
      };

      const elements: UIElement[] = parsedResponse.elements.map(
        (element: ParsedElementResponse) => ({
          type: this.mapElementType(element.type),
          x: element.x ?? 0,
          y: element.y ?? 0,
          width: element.width ?? 100,
          height: element.height ?? 50,
          text: element.text ?? '',
          style: {
            color: element.style?.color ?? '#000000',
            fontSize: element.style?.fontSize ?? 16,
          },
        })
      );

      return {
        success: true,
        layout,
        elements,
      };
    });
  }

  private mapElementType(type: string): UIElementType {
    const typeMap: { [key: string]: UIElementType } = {
      button: UIElementType.BUTTON,
      text: UIElementType.TEXT,
      image: UIElementType.IMAGE,
      container: UIElementType.FRAME,
      input: UIElementType.RECTANGLE,
    };

    return typeMap[type.toLowerCase()] || UIElementType.RECTANGLE;
  }
}

export default OpenAIService;
