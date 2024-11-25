import OpenAI from 'openai';
import { OpenAIService } from '../openai-service';
import { UIElementType, ImageAnalysisError, OpenAIServiceError } from '../../plugin/code';

// Mock OpenAI
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn()
        }
      }
    }))
  };
});

describe('OpenAIService', () => {
  let openAIService: OpenAIService;
  let mockOpenAI: any;

  beforeEach(() => {
    const apiKey = 'test-api-key';
    openAIService = new OpenAIService(apiKey);
    mockOpenAI = (OpenAI as jest.MockedClass<typeof OpenAI>).mock.results[0].value;
  });

  describe('analyzeImage', () => {
    const mockImageData = 'base64-encoded-image';
    const mockSuccessResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            layout: { width: 800, height: 600 },
            uiElements: [{
              type: 'TEXT',
              position: { x: 10, y: 20 },
              style: { width: 100, height: 50 },
              content: 'Sample Text'
            }]
          })
        }
      }]
    };

    it('should successfully analyze image', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue(mockSuccessResponse);

      const result = await openAIService.analyzeImage(mockImageData);

      expect(result.elements.length).toBe(1);
      expect(result.elements[0].type).toBe(UIElementType.TEXT);
      expect(result.elements[0].properties.x).toBe(10);
      expect(result.elements[0].properties.y).toBe(20);
      expect(result.elements[0].properties.width).toBe(100);
      expect(result.elements[0].properties.height).toBe(50);
      expect(result.elements[0].content).toBe('Sample Text');
    });

    it('should throw ImageAnalysisError for invalid image data', async () => {
      await expect(openAIService.analyzeImage('')).rejects.toThrow('Invalid image data');
    });

    it('should throw OpenAIServiceError for invalid response', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: 'Invalid JSON' } }]
      });

      await expect(openAIService.analyzeImage(mockImageData))
        .rejects.toThrow('Image analysis failed');
    });

    it('should throw OpenAIServiceError for API errors', async () => {
      const mockError = {
        status: 401,
        name: 'AuthenticationError',
        message: 'Invalid API key',
        code: 'invalid_api_key',
        type: 'invalid_request_error'
      };

      mockOpenAI.chat.completions.create.mockRejectedValue(mockError);

      await expect(openAIService.analyzeImage(mockImageData))
        .rejects.toThrow('Image analysis failed');
    });
  });
});
