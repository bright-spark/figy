import { OpenAIService } from '../services/openai-service';
import { ImageAnalysisError, OpenAIServiceError } from '../types/errors';
import { UIElement, UIElementType } from '../types/plugin';

export class FigmaGenerator {
  private openAIService: OpenAIService;
  private createRectangle: () => any;
  private createText: () => any;
  private notify: (message: string) => void;

  constructor(
    openAIService: OpenAIService,
    createRectangle: () => any,
    createText: () => any,
    notify: (message: string) => void
  ) {
    this.openAIService = openAIService;
    this.createRectangle = createRectangle;
    this.createText = createText;
    this.notify = notify;
  }

  async generateUIFromImage(imageData: string) {
    try {
      const analysisResult = await this.openAIService.analyzeImage(imageData);

      // Generate UI elements based on analysis
      const generatedElements = analysisResult.elements.map((element: UIElement) => {
        let node;
        switch (element.type) {
          case UIElementType.TEXT:
            node = this.createText();
            node.characters = element.content || '';
            break;
          case UIElementType.RECTANGLE:
            node = this.createRectangle();
            break;
          default:
            return null;
        }

        if (node) {
          node.x = element.properties.x;
          node.y = element.properties.y;
          node.resize(element.properties.width, element.properties.height);
        }

        return node;
      }).filter(Boolean);

      // Notify about generated elements
      this.notify(`Generated ${generatedElements.length} UI elements`);

      return generatedElements;
    } catch (error) {
      if (error instanceof ImageAnalysisError || error instanceof OpenAIServiceError) {
        throw error;
      }
      throw error;
    }
  }
}
