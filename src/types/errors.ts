export interface OpenAIError {
  status: number;
  name: string;
  message: string;
  code: string;
  type: string;
  param?: string;
  response?: {
    requestId?: string;
    headers?: Record<string, string>;
    body?: unknown;
  };
  requestId?: string;
  headers?: Record<string, string>;
  body?: unknown;
}

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
