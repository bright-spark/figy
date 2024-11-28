// Comprehensive type definitions for Figma AI Plugin

export enum MessageType {
  ANALYZE_IMAGE = 'analyze-image',
  UI_READY = 'ui-ready',
  READY = 'ready',
  ERROR = 'error',
  INIT = 'init',
}

export enum UIElementType {
  RECTANGLE = 'rectangle',
  TEXT = 'text',
  BUTTON = 'button',
  INPUT = 'input',
}

export interface UIElement {
  type: UIElementType;
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

export interface LayoutInfo {
  columns: number;
  rows: number;
  gridSpacing: number;
  margin: number;
}

export interface AnalysisResult {
  layout: LayoutInfo;
  elements: UIElement[];
  components?: {
    react?: string;
    vue?: string;
    angular?: string;
    html?: string;
  };
}

export interface PluginMessagePayload {
  imageData?: string;
  message?: string;
  version?: string;
  timestamp?: number;
}

export interface PluginMessage {
  type: MessageType;
  payload?: PluginMessagePayload;
}

export interface PluginMessageEvent {
  data: {
    pluginMessage: PluginMessage;
  };
}

export class ImageAnalysisError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageAnalysisError';
  }
}

export class OpenAIServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OpenAIServiceError';
  }
}

export class PluginInitializationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PluginInitializationError';
  }
}
