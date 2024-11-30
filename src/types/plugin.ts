/// <reference types="@figma/plugin-typings" />

export type NotifyCallback = (message: string, options: Record<string, unknown>) => void;

export interface FigmaPluginAPI {
  ui: {
    onmessage: ((msg: Record<string, unknown>) => void) | null;
    postMessage: (msg: Record<string, unknown>) => void;
  };
  showUI: (html: string, options?: ShowUIOptions) => void;
  notify: (message: string, options?: { error?: boolean }) => void;
  handleMessage?: (message: PluginMessage) => Promise<void>;
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
    pluginMessage: PluginMessage;
  };
}

export enum MessageType {
  INIT = 'INIT',
  ANALYZE_IMAGE = 'ANALYZE_IMAGE',
  ANALYSIS_RESULT = 'ANALYSIS_RESULT',
  ERROR = 'ERROR',
  READY = 'READY',
}

export interface PluginMessage {
  type: MessageType;
  payload: Record<string, unknown>;
}

export interface UIMessage {
  type: MessageType;
  payload: Record<string, unknown>;
}

export enum UIElementType {
  TEXT = 'TEXT',
  BUTTON = 'BUTTON',
  IMAGE = 'IMAGE',
  FRAME = 'FRAME',
  RECTANGLE = 'RECTANGLE',
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

export interface ErrorCallback {
  (error: Error): void;
}

export class OpenAIServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OpenAIServiceError';
  }
}

export interface MessageHandler {
  handleMessage(message: PluginMessage): Promise<void>;
}

export interface PluginController extends MessageHandler {
  handleMessage(message: PluginMessage): Promise<void>;
  onMessage?: (message: PluginMessage) => Promise<void>;
}
