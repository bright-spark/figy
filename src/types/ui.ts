export enum UIElementType {
  TEXT = 'text',
  BUTTON = 'button',
  RECTANGLE = 'rectangle',
  IMAGE = 'image',
  CONTAINER = 'container',
  UNKNOWN = 'unknown',
}

export interface ColorRGB {
  r: number;
  g: number;
  b: number;
}

export interface UIElementProperties {
  color?: ColorRGB;
  fontSize?: number;
  fontWeight?: string;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
}

export interface UIElement {
  type: UIElementType;
  properties: UIElementProperties;
  content?: string;
}

export interface LayoutInfo {
  width: number;
  height: number;
  elements: UIElement[];
}

export interface AnalysisResult {
  layout: LayoutInfo;
  elements: UIElement[];
}
