/// <reference types="@figma/plugin-typings" />

// Ensure self is defined in the global scope
if (typeof self === 'undefined') {
  (globalThis as typeof globalThis).self = globalThis;
}

import { OpenAIService } from '../../services/openai-service';
import { PluginController } from './plugin';
import { NotifyCallback, FigmaPluginAPI, PluginMessage } from '../../types/plugin';

interface CodeGenerationOptions {
  width?: number;
  height?: number;
  themeColors?: boolean;
}

let pluginController: PluginController | null = null;

function createFigmaPluginAPI(): FigmaPluginAPI {
  return {
    showUI: (html: string, options?: CodeGenerationOptions): void => {
      figma.showUI(html, options);
    },
    ui: {
      onmessage: null,
      postMessage: (pluginMessage: PluginMessage): void => {
        if (figma.ui) {
          figma.ui.postMessage(pluginMessage);
        }
      },
    },
    notify: (message: string, options?: { error?: boolean }): void => {
      figma.notify(message, options);
    },
  };
}

// Initialize the plugin
try {
  const openAIService = new OpenAIService({
    apiKey: process.env.OPENAI_API_KEY || '',
    maxRetries: 2,
    retryDelay: 10,
    timeout: 1000,
  });

  const figmaAPI = createFigmaPluginAPI();
  const notifyCallback: NotifyCallback = (message: string): void => {
    figmaAPI.notify(message);
  };

  pluginController = new PluginController(figmaAPI, openAIService, notifyCallback);

  // Show UI first
  figma.showUI(__html__, {
    width: 400,
    height: 600,
    themeColors: true,
  });

  // Set up message handling
  figma.ui.onmessage = async (msg: PluginMessage): Promise<void> => {
    if (!pluginController) {
      figma.notify('Plugin not initialized', { error: true });
      return;
    }
    try {
      await pluginController.handleMessage({
        data: {
          pluginMessage: msg,
        },
      });
    } catch (error) {
      console.error('Error handling message:', error);
      figma.notify('Error handling message', { error: true });
    }
  };
} catch (error) {
  console.error('Failed to initialize plugin:', error);
  figma.notify('Failed to initialize plugin', { error: true });
  figma.closePlugin();
}
