import { OpenAIService } from '../../services/openai-service';
import { FigmaGenerator } from '../figma-generator';
import { 
  MessageType, 
  PluginMessageEvent, 
  AnalysisResult, 
  FigmaPluginAPI,
  PluginConfig,
  NotifyCallback
} from '../../types/plugin';

export class PluginController {
  private readonly figmaGenerator: FigmaGenerator;
  private readonly openAIService: OpenAIService;
  private readonly figmaAPI: FigmaPluginAPI;
  private readonly notifyCallback: NotifyCallback;
  private isReady: boolean = false;

  get pluginReady(): boolean {
    return this.isReady;
  }

  constructor(figmaAPI: FigmaPluginAPI, openAIService: OpenAIService, notifyCallback: NotifyCallback) {
    this.figmaAPI = figmaAPI;
    this.openAIService = openAIService;
    this.notifyCallback = notifyCallback;

    const config: PluginConfig = {
      apiKey: process.env.OPENAI_API_KEY || '',
      maxRetries: 2,
      retryDelay: 1000,
      timeout: 30000
    };

    if (!config.apiKey) {
      this.logError('OpenAI API Key is missing', new Error('No API Key'));
      this.figmaAPI.notify('OpenAI API Key is missing. Please configure in settings.', { error: true });
    }

    this.figmaGenerator = new FigmaGenerator(this.openAIService);

    try {
      this.sendMessage({
        type: MessageType.INIT,
        payload: {
          version: '1.0.0',
          timestamp: Date.now()
        }
      });
    } catch (error) {
      this.logError('Failed to initialize plugin', error);
      this.sendErrorMessage('Failed to initialize plugin');
    }
  }

  private logError(message: string, error: Error | unknown): void {
    console.error(`[Figy Error] ${message}:`, error);
  }

  private sendMessage(message: { type: MessageType; payload: any }): void {
    try {
      this.figmaAPI.ui.postMessage(message);
    } catch (error) {
      this.logError('Failed to send message', error);
    }
  }

  private sendErrorMessage(message: string): void {
    this.sendMessage({
      type: MessageType.ERROR,
      payload: {
        message,
        timestamp: Date.now()
      }
    });
  }

  async handleMessage(event: PluginMessageEvent): Promise<void> {
    const message = event.data.pluginMessage;

    switch (message.type) {
      case MessageType.INIT:
        this.handleInit();
        break;
      case MessageType.ANALYZE_IMAGE:
        await this.handleAnalyzeImage(message.payload);
        break;
      default:
        this.logError('Unknown message type', new Error(`Unknown message type: ${message.type}`));
        break;
    }
  }

  private handleInit(): void {
    console.log('[Figy] UI ready signal received');
    this.isReady = true;
    this.sendMessage({
      type: MessageType.READY,
      payload: {
        version: '1.0.0',
        timestamp: Date.now()
      }
    });
  }

  private async handleAnalyzeImage(imageData: string): Promise<void> {
    try {
      const result: AnalysisResult = await this.figmaGenerator.generateUIFromImage(imageData);
      
      if (result.success) {
        this.notifyCallback('UI generated successfully');
      } else {
        this.notifyCallback(`Failed to generate UI: ${result.error}`);
      }
      
      this.sendMessage({
        type: MessageType.ANALYSIS_RESULT,
        payload: result
      });
    } catch (error) {
      this.notifyCallback(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      this.logError('Image analysis failed', error);
      this.sendErrorMessage('Failed to analyze image');
    }
  }
}
