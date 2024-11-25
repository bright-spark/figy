/**
 * Valid message types for plugin communication
 */
export const MessageTypes = {
    ANALYZE_IMAGE: 'analyze-image',
    CONVERSION_COMPLETE: 'conversion-complete',
    ERROR: 'error',
};
/**
 * Supported UI element types
 */
export const UIElementTypes = {
    TEXT: 'text',
    RECTANGLE: 'rectangle',
    FRAME: 'frame',
    BUTTON: 'button',
};
/**
 * Error types that can occur during plugin operation
 */
export const ErrorTypes = {
    API_ERROR: 'api_error',
    VALIDATION_ERROR: 'validation_error',
    GENERATION_ERROR: 'generation_error',
    NETWORK_ERROR: 'network_error',
};
