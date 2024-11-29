/// <reference types="@figma/plugin-typings" />

import { OpenAIService } from '../../services/openai-service';
import { PluginController } from './plugin';
import { NotifyCallback, FigmaPluginAPI } from '../../types/plugin';

let pluginController: PluginController | null = null;
let notifyCallback: NotifyCallback = (message: string) => {
  figma.notify(message);
};

function createFigmaPluginAPI(): FigmaPluginAPI {
  return {
    showUI: (html: string, options?: { width?: number; height?: number }) => {
      figma.showUI(html, options);
    },
    ui: {
      onmessage: null,
      postMessage: (msg: any) => {
        figma.ui.postMessage(msg);
      }
    },
    notify: (message: string, options?: { error?: boolean }) => {
      figma.notify(message, options);
    }
  };
}

export function initializePlugin(): void {
  const openAIService = new OpenAIService({
    apiKey: process.env.OPENAI_API_KEY || '',
    maxRetries: 2,
    retryDelay: 10,
    timeout: 1000
  });

  const figmaAPI = createFigmaPluginAPI();
  pluginController = new PluginController(figmaAPI, openAIService, notifyCallback);
}

export function handleMessage(msg: any): void {
  if (!pluginController) {
    figma.notify('Plugin not initialized', { error: true });
    return;
  }

  pluginController.handleMessage(msg);
}

export function cleanup(): void {
  pluginController = null;
}
