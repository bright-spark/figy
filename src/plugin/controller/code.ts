"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// API Key Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not found in environment variables. Please check your .env file.');
}

// Utility function to manage API key
function manageApiKey() {
    try {
        // First, try to get existing key from environment
        let storedKey = OPENAI_API_KEY;
        
        if (!storedKey) {
            throw new Error('OpenAI API key not found. Please check your environment configuration.');
        }
        
        return storedKey;
    } catch (error) {
        console.error('Error managing API key:', error);
        throw error;
    }
}
class OpenAIService {
    constructor() {
        this.apiKey = manageApiKey();
    }
    analyzeImage(imageData) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const response = yield fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiKey}`
                    },
                    body: JSON.stringify({
                        model: "gpt-4-vision-preview",
                        messages: [
                            {
                                role: "user",
                                content: [
                                    {
                                        type: "text",
                                        text: "Analyze this UI design image and provide a structured JSON response with these components: " +
                                            "1. List of UI elements (text, buttons, rectangles) " +
                                            "2. Their positions (x, y coordinates) " +
                                            "3. Their styling (colors, sizes) " +
                                            "4. Overall layout dimensions " +
                                            "Ensure the response is a valid, parseable JSON object."
                                    },
                                    {
                                        type: "image_url",
                                        image_url: {
                                            url: imageData
                                        }
                                    }
                                ]
                            }
                        ],
                        max_tokens: 4096
                    })
                });
                if (!response.ok) {
                    const errorData = yield response.json().catch(() => ({}));
                    console.error('OpenAI API Error:', errorData);
                    throw new Error(`OpenAI API request failed: ${response.status}`);
                }
                const responseData = yield response.json();
                const rawContent = ((_b = (_a = responseData.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) || '{}';
                const result = JSON.parse(rawContent);
                return this.validateAnalysisResult(result);
            }
            catch (error) {
                console.error('Image Analysis Error:', error);
                figma.notify('Failed to analyze image', { error: true });
                throw error;
            }
        });
    }
    validateAnalysisResult(result) {
        var _a, _b;
        // Implement robust validation logic
        if (!result.elements || !Array.isArray(result.elements)) {
            console.warn('Invalid analysis result: missing elements', result);
            return {
                elements: [],
                layout: { width: 800, height: 600 },
                metadata: { confidence: 0 }
            };
        }
        return {
            elements: result.elements.map((element) => ({
                type: element.type || 'unknown',
                properties: {
                    x: element.x || 0,
                    y: element.y || 0,
                    width: element.width || 100,
                    height: element.height || 50,
                    text: element.text || '',
                    color: element.color || '#000000',
                    backgroundColor: element.backgroundColor || '#FFFFFF'
                }
            })),
            layout: {
                width: ((_a = result.layout) === null || _a === void 0 ? void 0 : _a.width) || 800,
                height: ((_b = result.layout) === null || _b === void 0 ? void 0 : _b.height) || 600
            },
            metadata: {
                confidence: result.confidence || 0.5
            }
        };
    }
}
class FigmaGenerator {
    generateUI(analysis) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Create main frame with analyzed dimensions
                const frame = figma.createFrame();
                frame.resize(analysis.layout.width, analysis.layout.height);
                frame.name = "AI Generated UI";
                // Apply layout settings
                if (analysis.layout.padding) {
                    frame.paddingTop = analysis.layout.padding.top || 0;
                    frame.paddingRight = analysis.layout.padding.right || 0;
                    frame.paddingBottom = analysis.layout.padding.bottom || 0;
                    frame.paddingLeft = analysis.layout.padding.left || 0;
                }
                // Generate UI elements
                for (const element of analysis.elements) {
                    yield this.createUIElement(element, frame);
                }
                // Center the frame in viewport
                const viewport = figma.viewport.center;
                frame.x = viewport.x - frame.width / 2;
                frame.y = viewport.y - frame.height / 2;
                // Zoom to fit
                figma.viewport.scrollAndZoomIntoView([frame]);
            }
            catch (error) {
                console.error('Figma Generation Error:', error);
                throw new Error('Failed to generate Figma UI elements');
            }
        });
    }
    createUIElement(element, parent) {
        return __awaiter(this, void 0, void 0, function* () {
            const { type, properties } = element;
            try {
                switch (type) {
                    case 'text':
                        yield this.createTextElement(properties, parent);
                        break;
                    case 'rectangle':
                        this.createRectangleElement(properties, parent);
                        break;
                    case 'button':
                        yield this.createButtonElement(properties, parent);
                        break;
                    default:
                        console.warn(`Unsupported element type: ${type}`);
                }
            }
            catch (error) {
                console.error(`Failed to create ${type} element:`, error);
                throw error;
            }
        });
    }
    createTextElement(props, parent) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const text = figma.createText();
                yield figma.loadFontAsync({ family: "Inter", style: "Regular" });
                text.characters = props.text || "";
                text.x = props.x || 0;
                text.y = props.y || 0;
                if (props.width)
                    text.resize(props.width, text.height);
                if (props.height)
                    text.resize(text.width, props.height);
                if (props.color) {
                    const { r, g, b } = this.hexToRGB(props.color);
                    text.fills = [{ type: 'SOLID', color: { r, g, b } }];
                }
                if (props.opacity !== undefined) {
                    text.opacity = props.opacity;
                }
                parent.appendChild(text);
            }
            catch (error) {
                console.error('Failed to create text element:', error);
                throw error;
            }
        });
    }
    createRectangleElement(props, parent) {
        const rect = figma.createRectangle();
        rect.x = props.x || 0;
        rect.y = props.y || 0;
        rect.resize(props.width || 100, props.height || 100);
        if (props.backgroundColor) {
            const { r, g, b } = this.hexToRGB(props.backgroundColor);
            rect.fills = [{ type: 'SOLID', color: { r, g, b } }];
        }
        if (props.cornerRadius) {
            rect.cornerRadius = props.cornerRadius;
        }
        if (props.opacity !== undefined) {
            rect.opacity = props.opacity;
        }
        parent.appendChild(rect);
    }
    createButtonElement(props, parent) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Create button container
                const button = figma.createFrame();
                button.name = "Button";
                button.x = props.x || 0;
                button.y = props.y || 0;
                button.resize(props.width || 120, props.height || 40);
                button.layoutMode = "HORIZONTAL";
                button.primaryAxisAlignItems = "CENTER";
                button.counterAxisAlignItems = "CENTER";
                if (props.backgroundColor) {
                    const { r, g, b } = this.hexToRGB(props.backgroundColor);
                    button.fills = [{ type: 'SOLID', color: { r, g, b } }];
                }
                if (props.cornerRadius) {
                    button.cornerRadius = props.cornerRadius;
                }
                if (props.opacity !== undefined) {
                    button.opacity = props.opacity;
                }
                // Add button text
                if (props.text) {
                    yield this.createTextElement({
                        text: props.text,
                        color: props.color || "#FFFFFF",
                        width: props.width ? props.width - 16 : 104, // Account for padding
                        height: props.height ? props.height - 8 : 32
                    }, button);
                }
                parent.appendChild(button);
            }
            catch (error) {
                console.error('Failed to create button element:', error);
                throw error;
            }
        });
    }
    hexToRGB(hex) {
        const cleanHex = hex.replace('#', '');
        const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
        const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
        const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
        return { r, g, b };
    }
}
// Initialize services
const openAIService = new OpenAIService();
const figmaGenerator = new FigmaGenerator();
// Show the plugin UI
figma.showUI(__html__, { width: 400, height: 300 });
// Listen for messages from the UI
figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
    if (msg.type === 'analyze-image' && msg.imageData) {
        try {
            // Analyze image using OpenAI
            const analysis = yield openAIService.analyzeImage(msg.imageData);
            // Generate Figma UI elements
            yield figmaGenerator.generateUI(analysis);
            figma.notify('UI elements generated successfully!');
        }
        catch (error) {
            console.error('Error:', error);
            figma.notify('Error generating UI elements', { error: true });
        }
    }
});
