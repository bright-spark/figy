/// <reference types="@figma/plugin-typings" />

export type NotifyCallback = (message: string) => void;

export interface FigmaPluginAPI {
  showUI: (html: string, options?: ShowUIOptions) => void;
  ui: {
    onmessage: ((msg: any) => void) | null;
    postMessage: (msg: any) => void;
  };
  notify: (message: string, options?: { error?: boolean }) => void;
}

export interface ShowUIOptions {
  width?: number;
  height?: number;
}

export interface PluginConfig {
  apiKey: string;
  maxRetries: number;
  retryDelay: number;
  timeout: number;
}

export interface PluginMessageEvent {
  data: {
    pluginMessage: any;
  };
}

export enum MessageType {
  INIT = 'INIT',
  ANALYZE_IMAGE = 'ANALYZE_IMAGE',
  ANALYSIS_RESULT = 'ANALYSIS_RESULT',
  ERROR = 'ERROR',
  READY = 'READY'
}

export interface PluginMessage {
  type: MessageType;
  payload: any;
}

export enum UIElementType {
  TEXT = 'TEXT',
  BUTTON = 'BUTTON',
  IMAGE = 'IMAGE',
  FRAME = 'FRAME',
  RECTANGLE = 'RECTANGLE'
}

export interface UIStyle {
  color: string;
  fontSize: number;
}

export interface UIElement {
  type: UIElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  style: UIStyle;
}

export interface LayoutInfo {
  columns: number;
  rows: number;
  margin: number;
  gridSpacing: number;
}

export interface AnalysisResult {
  success: boolean;
  error?: string;
  layout: LayoutInfo;
  elements: UIElement[];
}

export class OpenAIServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OpenAIServiceError';
  }
}
