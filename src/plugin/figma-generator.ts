import OpenAIService from '../services/openai-service';
import { UIElement, LayoutInfo, UIElementType, AnalysisResult } from '../types/plugin';

export class FigmaGenerator {
  private openAIService: OpenAIService;
  private createRectangle: () => RectangleNode;
  private createText: () => TextNode;
  private notifyUser: (message: string) => void;

  constructor(
    openAIService: OpenAIService,
    createRectangle: () => RectangleNode,
    createText: () => TextNode,
    notifyUser: (message: string) => void
  ) {
    this.openAIService = openAIService;
    this.createRectangle = createRectangle;
    this.createText = createText;
    this.notifyUser = notifyUser;
  }

  private calculateGridLayout(
    layout: LayoutInfo,
    totalElements: number
  ): { columns: number; rows: number } {
    const columns = layout.columns || Math.ceil(Math.sqrt(totalElements));
    const rows = layout.rows || Math.ceil(totalElements / columns);
    return { columns, rows };
  }

  private createUIElement(element: UIElement, parentFrame: FrameNode): RectangleNode | TextNode {
    let node: RectangleNode | TextNode;

    switch (element.type) {
      case UIElementType.TEXT:
        node = this.createText();
        (node as TextNode).characters = element.text || '';
        break;
      case UIElementType.BUTTON:
      case UIElementType.RECTANGLE:
      case UIElementType.INPUT:
      default:
        node = this.createRectangle();
        break;
    }

    node.resize(element.width, element.height);
    node.x = element.x;
    node.y = element.y;

    // Apply styling
    if (node.type === 'RECTANGLE') {
      const rectNode = node as RectangleNode;
      rectNode.fills = [
        { type: 'SOLID', color: this.hexToRGB(element.backgroundColor || '#FFFFFF') },
      ];
      rectNode.opacity = element.opacity || 1;
      rectNode.cornerRadius = element.cornerRadius || 0;
    }

    if (node.type === 'TEXT') {
      const textNode = node as TextNode;
      textNode.fills = [{ type: 'SOLID', color: this.hexToRGB(element.color || '#000000') }];
    }

    parentFrame.appendChild(node);
    return node;
  }

  private hexToRGB(hex: string): RGB {
    // Remove the hash at the start if it's there
    hex = hex.replace(/^#/, '');

    // Handle 3-digit hex
    if (hex.length === 3) {
      hex = hex
        .split('')
        .map(char => char + char)
        .join('');
    }

    // Convert to RGB
    const bigint = parseInt(hex, 16);
    const r = ((bigint >> 16) & 255) / 255;
    const g = ((bigint >> 8) & 255) / 255;
    const b = (bigint & 255) / 255;

    return { r, g, b };
  }

  async generateUI(analysisResult: AnalysisResult): Promise<FrameNode> {
    try {
      // Create main frame
      const frame = figma.createFrame() as FrameNode;
      frame.name = 'AI Generated UI';

      // Calculate grid layout
      const { columns, rows } = this.calculateGridLayout(
        analysisResult.layout,
        analysisResult.elements.length
      );

      // Set frame size based on elements
      const gridSpacing = analysisResult.layout.gridSpacing || 20;
      const margin = analysisResult.layout.margin || 10;

      // Create UI elements
      analysisResult.elements.forEach(element => {
        this.createUIElement(element, frame);
      });

      // Resize and position frame
      frame.layoutMode = 'HORIZONTAL';

      // Add custom properties for grid-like behavior
      (frame as any).gridRowCount = rows;
      (frame as any).gridColumnCount = columns;

      frame.itemSpacing = gridSpacing;
      frame.paddingLeft = margin;
      frame.paddingRight = margin;
      frame.paddingTop = margin;
      frame.paddingBottom = margin;

      this.notifyUser('UI generated successfully');
      return frame;
    } catch (error) {
      console.error('Error generating UI:', error);
      this.notifyUser('Failed to generate UI');
      throw error;
    }
  }

  // Optional method for generating UI from image
  async generateUIFromImage(imageData: string): Promise<FrameNode> {
    try {
      const analysisResult = await this.openAIService.analyzeImage(imageData);
      return this.generateUI(analysisResult);
    } catch (error) {
      console.error('Error generating UI from image:', error);
      this.notifyUser('Failed to generate UI from image');
      throw error;
    }
  }
}
