// Plugin message types
export type MessageType = 'analyze-image' | 'create-elements' | 'notify' | 'error';

export interface PluginMessage {
  type: MessageType;
  payload?: any;
}

export interface AnalyzeImageMessage extends PluginMessage {
  type: 'analyze-image';
  payload: {
    imageData: string;
  };
}

export interface CreateElementsMessage extends PluginMessage {
  type: 'create-elements';
  payload: {
    elements: UIElement[];
  };
}

export interface NotifyMessage extends PluginMessage {
  type: 'notify';
  payload: {
    message: string;
    type?: 'info' | 'success' | 'error';
  };
}

export interface ErrorMessage extends PluginMessage {
  type: 'error';
  payload: {
    message: string;
    error?: Error;
  };
}

// UI Element types
export enum UIElementType {
  TEXT = 'text',
  RECTANGLE = 'rectangle',
  BUTTON = 'button',
  FRAME = 'frame',
  IMAGE = 'image',
  CONTAINER = 'container',
  UNKNOWN = 'unknown'
}

export interface UIElementProperties {
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  backgroundColor?: string;
  opacity?: number;
  cornerRadius?: number;
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

// Error types
export class ImageAnalysisError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageAnalysisError';
  }
}

export class OpenAIServiceError extends Error {
  details?: Record<string, unknown>;
  
  constructor(message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'OpenAIServiceError';
    this.details = details;
  }
}

// Event types
export interface PluginMessageEvent {
  data: PluginMessage;
}