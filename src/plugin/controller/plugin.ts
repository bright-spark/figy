import OpenAIService from '../../services/openai-service';
import { FigmaGenerator } from '../figma-generator';
import type { PluginMessageEvent } from '../../types/plugin';
import { ImageAnalysisError, OpenAIServiceError } from '../../types/errors';
import { AnalysisResult } from '../../types/plugin';

// Placeholder for plugin-level configuration and initialization
export const initializePlugin = (apiKey: string) => {
  const openAIService = new OpenAIService(apiKey);
  const figmaGenerator = new FigmaGenerator(
    openAIService,
    () => figma.createRectangle(),
    () => figma.createText(),
    (message) => figma.notify(message)
  );
  
  return { openAIService, figmaGenerator };
};

export interface UIElementProperties {
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  color?: string;
  backgroundColor?: string;
  opacity?: number;
  cornerRadius?: number;
}

export class PluginController {
  private openAIService: OpenAIService;
  private figmaGenerator: FigmaGenerator;

  constructor(apiKey: string) {
    const { openAIService, figmaGenerator } = initializePlugin(apiKey);
    this.openAIService = openAIService;
    this.figmaGenerator = figmaGenerator;
  }

  private async handleAnalyzeImage(imageData: string): Promise<AnalysisResult> {
    try {
      const result = await this.openAIService.analyzeImage(imageData);
      await this.figmaGenerator.generateUI(result);
      return result;
    } catch (error) {
      if (error instanceof ImageAnalysisError || error instanceof OpenAIServiceError) {
        figma.notify(error.message);
      } else {
        figma.notify('Unexpected error during image analysis');
      }
      throw error;
    }
  }

  public async handleMessage(event: PluginMessageEvent): Promise<void> {
    const message = event.data;

    switch (message.type) {
      case 'analyze-image':
        await this.handleAnalyzeImage(message.payload.imageData);
        break;

      default:
        console.warn('Unknown message type:', message.type);
    }
  }
}
