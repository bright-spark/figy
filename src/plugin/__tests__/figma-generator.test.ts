import { FigmaGenerator } from '../figma-generator';
import { OpenAIService } from '../../services/openai-service';
import { AnalysisResult, UIElementType } from '../../types/plugin';

jest.mock('../../services/openai-service');

describe('FigmaGenerator', () => {
  let mockOpenAIService: jest.Mocked<OpenAIService>;
  let generator: FigmaGenerator;

  beforeEach(() => {
    mockOpenAIService = new OpenAIService({
      apiKey: 'test-key',
      maxRetries: 2,
      retryDelay: 10,
      timeout: 1000,
    }) as jest.Mocked<OpenAIService>;
    generator = new FigmaGenerator(mockOpenAIService);
  });

  describe('generateUIFromImage', () => {
    const mockImageData = 'base64-encoded-image-data';

    it('should generate UI elements from image data', async () => {
      const analysisResult: AnalysisResult = {
        success: true,
        layout: {
          columns: 2,
          rows: 2,
          margin: 10,
          gridSpacing: 10,
        },
        elements: [
          {
            type: UIElementType.BUTTON,
            x: 0,
            y: 0,
            width: 100,
            height: 50,
            text: 'Click me',
            style: {
              color: '#000000',
              fontSize: 16,
            },
          },
        ],
      };

      mockOpenAIService.generateUIFromImage.mockResolvedValue(analysisResult);

      const result = await generator.generateUIFromImage(mockImageData);

      expect(result.success).toBe(true);
      expect(result.elements).toHaveLength(1);
      expect(result.elements[0].type).toBe(UIElementType.BUTTON);
      expect(result.elements[0].text).toBe('Click me');
      expect(result.elements[0].style.color).toBe('#000000');
      expect(result.elements[0].style.fontSize).toBe(16);
    });

    it('should handle empty response', async () => {
      const analysisResult: AnalysisResult = {
        success: true,
        layout: {
          columns: 1,
          rows: 1,
          margin: 10,
          gridSpacing: 10,
        },
        elements: [],
      };

      mockOpenAIService.generateUIFromImage.mockResolvedValue(analysisResult);

      const result = await generator.generateUIFromImage(mockImageData);

      expect(result.success).toBe(true);
      expect(result.elements).toHaveLength(0);
    });

    it('should handle errors', async () => {
      const errorMessage = 'Failed to generate UI';
      mockOpenAIService.generateUIFromImage.mockRejectedValue(new Error(errorMessage));

      const result = await generator.generateUIFromImage(mockImageData);

      expect(result.success).toBe(false);
      expect(result.error).toBe(errorMessage);
    });
  });
});
