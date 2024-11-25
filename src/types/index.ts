import { UIElementType } from '@plugin/code';

export interface UIElement {
  type: UIElementType;
  properties: UIElementProperties;
  content?: string;
}

export interface UIElementProperties {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AnalysisResult {
  layout: {
    width: number;
    height: number;
    elements: UIElement[];
  };
  elements: UIElement[];
}

export interface OpenAIServiceConfig {
  apiKey: string;
}

export class ImageAnalysisError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageAnalysisError';
  }
}

export class OpenAIServiceError extends Error {
  originalError?: unknown;

  constructor(message: string, options?: { originalError?: unknown }) {
    super(message);
    this.name = 'OpenAIServiceError';
    this.originalError = options?.originalError;
  }
}
