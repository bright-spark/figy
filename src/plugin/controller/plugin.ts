import OpenAIService from '../../services/openai-service';
import { FigmaGenerator } from '../figma-generator';
import type { PluginMessageEvent, PluginMessage } from '../../types/plugin';
import { MessageType } from '../../types/plugin';
import { ImageAnalysisError, OpenAIServiceError } from '../../types/plugin';
import { AnalysisResult } from '../../types/plugin';

// Logging utility
const log = (message: string, type: 'info' | 'error' | 'warn' = 'info') => {
  const emoji = {
    'info': '✅',
    'error': '❌',
    'warn': '⚠️'
  }[type];
  console.log(`[Plugin Controller ${emoji}] ${message}`);
};

export class PluginController {
  private _openAIService!: OpenAIService;
  private _figmaGenerator!: FigmaGenerator;
  private _isReady: boolean = false;

  constructor(apiKey: string) {
    try {
      this._openAIService = new OpenAIService({ apiKey });
      this._figmaGenerator = new FigmaGenerator(
        this._openAIService,
        () => figma.createRectangle(),
        () => figma.createText(),
        message => figma.notify(message)
      );

      // Send initial ready message
      this.sendMessage({
        type: MessageType.INIT,
        payload: {
          message: 'Plugin initialized',
          version: '1.0.0',
          timestamp: Date.now()
        }
      });
    } catch (error) {
      log(`Constructor initialization failed: ${error}`, 'error');
      this.sendErrorMessage('Plugin initialization failed');
    }
  }

  private sendMessage(message: PluginMessage): void {
    try {
      figma.ui.postMessage(message);
      log(`Sent message: ${message.type}`);
    } catch (error) {
      log(`Failed to send message: ${error}`, 'error');
    }
  }

  private sendErrorMessage(errorMessage: string): void {
    this.sendMessage({
      type: MessageType.ERROR,
      payload: { 
        message: errorMessage,
        timestamp: Date.now()
      }
    });
  }

  private async handleAnalyzeImage(imageData: string): Promise<AnalysisResult> {
    try {
      log('Starting image analysis');
      const result = await this._openAIService.analyzeImage(imageData);
      await this._figmaGenerator.generateUI(result);
      log('Image analysis completed');
      return result;
    } catch (error) {
      if (error instanceof ImageAnalysisError || error instanceof OpenAIServiceError) {
        figma.notify(error.message);
        this.sendErrorMessage(error.message);
      } else {
        const errorMessage = 'Unexpected error during image analysis';
        figma.notify(errorMessage);
        this.sendErrorMessage(errorMessage);
      }
      throw error;
    }
  }

  public async handleMessage(event: PluginMessageEvent): Promise<void> {
    const message = event.data.pluginMessage;
    log(`Handling message: ${message.type}`);

    try {
      switch (message.type) {
        case MessageType.ANALYZE_IMAGE:
          if (!message.payload?.imageData) {
            const error = 'No image data provided';
            log(error, 'error');
            this.sendErrorMessage(error);
            return;
          }
          await this.handleAnalyzeImage(message.payload.imageData);
          break;

        case MessageType.UI_READY:
          log('UI ready signal received');
          this._isReady = true;
          this.sendMessage({
            type: MessageType.READY,
            payload: {
              message: 'Plugin is fully initialized',
              version: '1.0.0',
              timestamp: Date.now()
            }
          });
          break;

        default:
          log(`Unknown message type: ${message.type}`, 'error');
          this.sendErrorMessage(`Unhandled message type: ${message.type}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      log(errorMessage, 'error');
      this.sendErrorMessage(errorMessage);
    }
  }

  // Getter for ready state
  public get ready(): boolean {
    return this._isReady;
  }
}
export { MessageType };

