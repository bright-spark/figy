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
}

export interface UIElement {
  type: UIElementType;
  content?: string;
  properties: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface AnalysisResult {
  elements: UIElement[];
}

// Event types
export interface PluginMessageEvent extends MessageEvent {
  data: PluginMessage;
}
