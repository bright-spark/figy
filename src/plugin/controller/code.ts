/// <reference types="@figma/plugin-typings" />

import OpenAIService from '../../services/openai-service';
import { FigmaGenerator } from '../figma-generator';
import { PluginMessage } from '../../types/plugin';

// API Key Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not found in environment variables. Please check your .env file.');
}

// Initialize services
const openAIService = new OpenAIService(OPENAI_API_KEY);
const figmaGenerator = new FigmaGenerator(
    openAIService,
    () => figma.createRectangle(),
    () => figma.createText(),
    (message: string) => figma.notify(message)
);

// Show the plugin UI
figma.showUI(__html__, { width: 400, height: 300 });

// Listen for messages from the UI
figma.ui.onmessage = ((msg: PluginMessage) => {
    (async () => {
        try {
            switch (msg.type) {
                case 'analyze-image':
                    if (!msg.payload?.imageData) {
                        throw new Error('No image data provided');
                    }
                    await figmaGenerator.generateUIFromImage(msg.payload.imageData);
                    break;
                    
                default:
                    console.warn('Unknown message type:', msg.type);
            }
        } catch (error) {
            console.error('Error handling message:', error);
            figma.notify(error instanceof Error ? error.message : 'An unknown error occurred', { error: true });
        }
    })();
}) as any;