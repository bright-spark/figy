/// <reference types="@figma/plugin-typings" />

import { PluginController } from './plugin';
import { PluginMessage, PluginMessageEvent, MessageType } from '../../types/plugin';

// Enhanced logging utility
const log = (message: string, type: 'info' | 'error' | 'warn' = 'info') => {
  const emoji = {
    info: '✅',
    error: '❌',
    warn: '⚠️',
  }[type];
  console.log(`[Figma Plugin ${emoji}] ${message}`);
};

// Validate and load API key
const validateApiKey = (): string => {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    const errorMessage = 'OpenAI API key not found. Please check your .env file.';
    log(errorMessage, 'error');
    figma.notify(errorMessage, { error: true });
    throw new Error(errorMessage);
  }

  return OPENAI_API_KEY;
};

// Main plugin initialization function
const initializePlugin = () => {
  try {
    // Validate and get API key
    const apiKey = validateApiKey();

    // Show the plugin UI with proper options
    figma.showUI(__html__, {
      width: 500,
      height: 600,
    });

    // Initialize plugin controller
    const pluginController = new PluginController(apiKey);

    // Set up message handling with comprehensive error management
    figma.ui.onmessage = (msg: any) => {
      try {
        log(`Received message: ${msg.type}`);

        // Create a proper PluginMessageEvent
        const messageEvent: PluginMessageEvent = {
          data: { pluginMessage: msg as PluginMessage },
        };

        // Delegate message handling to plugin controller
        pluginController.handleMessage(messageEvent).catch(error => {
          const errorMessage = error instanceof Error ? error.message : 'Unexpected error occurred';
          log(errorMessage, 'error');

          // Send error back to UI
          figma.ui.postMessage({
            type: MessageType.ERROR,
            payload: {
              message: errorMessage,
              timestamp: Date.now(),
            },
          });

          // Notify user
          figma.notify(errorMessage, { error: true });
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unexpected error occurred';
        log(errorMessage, 'error');

        // Send error back to UI
        figma.ui.postMessage({
          type: MessageType.ERROR,
          payload: {
            message: errorMessage,
            timestamp: Date.now(),
          },
        });

        // Notify user
        figma.notify(errorMessage, { error: true });
      }
    };

    // Initial ready notification
    figma.ui.postMessage({
      type: MessageType.INIT,
      payload: {
        message: 'Plugin initialized successfully',
        version: '1.0.0',
        timestamp: Date.now(),
      },
    });

    log('Plugin initialization complete');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Plugin initialization failed';
    log(errorMessage, 'error');
    figma.notify(errorMessage, { error: true });
  }
};

// Run plugin initialization
initializePlugin();
