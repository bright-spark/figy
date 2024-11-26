import { OpenAIService } from '../services/openai-service';
import { UIElement, UIElementType, AnalysisResult } from '../types/plugin';

export class FigmaGenerator {
  private openAIService: OpenAIService;
  private createRectangle: () => RectangleNode;
  private createText: () => TextNode;
  private notify: (message: string) => void;

  constructor(
    openAIService: OpenAIService,
    createRectangle: () => RectangleNode,
    createText: () => TextNode,
    notify: (message: string) => void
  ) {
    this.openAIService = openAIService;
    this.createRectangle = createRectangle;
    this.createText = createText;
    this.notify = notify;
  }

  async generateUIFromImage(imageData: string): Promise<void> {
    try {
      const analysisResult = await this.openAIService.analyzeImage(imageData);
      await this.generateUI(analysisResult);
      this.notify('UI elements generated successfully!');
    } catch (error) {
      console.error('Error generating UI:', error);
      this.notify('Failed to generate UI');
      throw error;
    }
  }

  async generateUI(analysis: AnalysisResult): Promise<void> {
    try {
      // Create main frame with analyzed dimensions
      const frame = figma.createFrame() as FrameNode;
      frame.resize(analysis.layout.width || 800, analysis.layout.height || 600);
      frame.name = 'Generated UI';

      // Generate UI elements
      for (const element of analysis.elements) {
        await this.createUIElement(element, frame);
      }

      // Center the frame in viewport
      const viewport = figma.viewport.center;
      frame.x = viewport.x - frame.width / 2;
      frame.y = viewport.y - frame.height / 2;

      figma.viewport.scrollAndZoomIntoView([frame]);
    } catch (error) {
      console.error('Error generating UI:', error);
      throw new Error('Failed to generate UI elements');
    }
  }

  private async createUIElement(element: UIElement, parent: FrameNode): Promise<void> {
    const { type, properties, content } = element;
    try {
      switch (type) {
        case UIElementType.TEXT:
          await this.createTextElement({...properties, text: content}, parent);
          break;
        case UIElementType.RECTANGLE:
          this.createRectangleElement(properties, parent);
          break;
        case UIElementType.BUTTON:
          await this.createButtonElement({...properties, text: content}, parent);
          break;
        default:
          console.warn(`Unsupported element type: ${type}`);
      }
    } catch (error) {
      console.error(`Failed to create ${type} element:`, error);
      throw error;
    }
  }

  private async createTextElement(
    props: UIElement['properties'] & { text?: string }, 
    parent: FrameNode
  ): Promise<void> {
    try {
      const text = this.createText();
      await figma.loadFontAsync({ family: "Inter", style: "Regular" });
      
      text.characters = props.text || "";
      text.x = props.x || 0;
      text.y = props.y || 0;
      
      if (props.width) text.resize(props.width, props.height || 0);
      if (props.color) {
        const { r, g, b } = this.hexToRGB(props.color);
        text.fills = [{ type: 'SOLID', color: { r, g, b } }];
      }
      if (props.opacity !== undefined) text.opacity = props.opacity;
      
      parent.appendChild(text);
    } catch (error) {
      console.error('Failed to create text element:', error);
      throw error;
    }
  }

  private createRectangleElement(props: UIElement['properties'], parent: FrameNode): void {
    const rect = this.createRectangle();
    rect.x = props.x || 0;
    rect.y = props.y || 0;
    rect.resize(props.width || 100, props.height || 100);
    
    if (props.backgroundColor) {
      const { r, g, b } = this.hexToRGB(props.backgroundColor);
      rect.fills = [{ type: 'SOLID', color: { r, g, b } }];
    }
    if (props.cornerRadius) rect.cornerRadius = props.cornerRadius;
    if (props.opacity !== undefined) rect.opacity = props.opacity;
    
    parent.appendChild(rect);
  }

  private async createButtonElement(
    props: UIElement['properties'] & { text?: string }, 
    parent: FrameNode
  ): Promise<void> {
    const button = figma.createFrame() as FrameNode;
    button.name = "Button";
    button.x = props.x || 0;
    button.y = props.y || 0;
    button.resize(props.width || 120, props.height || 40);
    
    if (props.backgroundColor) {
      const { r, g, b } = this.hexToRGB(props.backgroundColor);
      button.fills = [{ type: 'SOLID', color: { r, g, b } }];
    }
    if (props.cornerRadius) button.cornerRadius = props.cornerRadius;
    if (props.opacity !== undefined) button.opacity = props.opacity;

    if (props.text) {
      const text = this.createText();
      await figma.loadFontAsync({ family: "Inter", style: "Regular" });
      text.characters = props.text;
      text.textAlignHorizontal = "CENTER";
      text.textAlignVertical = "CENTER";
      
      if (props.color) {
        const { r, g, b } = this.hexToRGB(props.color);
        text.fills = [{ type: 'SOLID', color: { r, g, b } }];
      }
      
      button.appendChild(text);
      text.x = (button.width - text.width) / 2;
      text.y = (button.height - text.height) / 2;
    }
    
    parent.appendChild(button);
  }

  private hexToRGB(hex: string): { r: number; g: number; b: number } {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
    const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
    const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
    return { r, g, b };
  }
}