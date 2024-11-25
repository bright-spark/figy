import { OpenAIService } from '../../services/openai-service';
import { FigmaGenerator } from '../figma-generator';
import type { PluginMessageEvent } from '../../types/plugin';
import { ImageAnalysisError, OpenAIServiceError } from '../../types/errors';
import type { AnalysisResult } from '../../types/plugin';

export class PluginController {
  private openAIService: OpenAIService;
  private figmaGenerator: FigmaGenerator;

  constructor(apiKey: string) {
    this.openAIService = new OpenAIService(apiKey);
    this.figmaGenerator = new FigmaGenerator(
      this.openAIService,
      () => figma.createRectangle(),
      () => figma.createText(),
      (message: string) => this.notify(message, 'info')
    );
  }

  private async handleAnalyzeImage(imageData: string): Promise<void> {
    try {
      const result = await this.openAIService.analyzeImage(imageData);
      await this.figmaGenerator.generateUIFromImage(JSON.stringify(result));
      this.notify('Successfully generated UI elements!', 'success');
    } catch (error) {
      if (error instanceof ImageAnalysisError || error instanceof OpenAIServiceError) {
        this.notify(error.message, 'error');
      } else {
        this.notify('An unexpected error occurred', 'error');
        console.error('Unexpected error:', error);
      }
    }
  }

  private notify(message: string, type: 'info' | 'success' | 'error' = 'info'): void {
    figma.ui.postMessage({
      type: 'notify',
      payload: { message, type }
    });
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
