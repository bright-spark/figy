import { FigmaGenerator } from '../figma-generator';
import { OpenAIService } from '../../services/openai-service';
import { UIElementType, ImageAnalysisError, OpenAIServiceError } from '../code';

describe('FigmaGenerator', () => {
  let figmaGenerator: FigmaGenerator;
  let mockOpenAIService: jest.Mocked<OpenAIService>;
  let mockCreateRectangle: jest.Mock;
  let mockCreateText: jest.Mock;
  let mockNotify: jest.Mock;

  beforeEach(() => {
    mockOpenAIService = {
      analyzeImage: jest.fn()
    } as any;

    // Create mock Figma nodes
    mockCreateText = jest.fn().mockReturnValue({
      characters: '',
      x: 0,
      y: 0,
      resize: jest.fn()
    });

    mockCreateRectangle = jest.fn().mockReturnValue({
      x: 0,
      y: 0,
      resize: jest.fn()
    });

    mockNotify = jest.fn();

    figmaGenerator = new FigmaGenerator(
      mockOpenAIService, 
      mockCreateRectangle, 
      mockCreateText, 
      mockNotify
    );
  });

  it('should successfully generate UI elements from image analysis', async () => {
    const mockAnalysisResult = {
      layout: { width: 800, height: 600, elements: [] },
      elements: [
        {
          type: UIElementType.TEXT,
          properties: { x: 10, y: 20, width: 100, height: 50 },
          content: 'Sample Text'
        }
      ]
    };

    mockOpenAIService.analyzeImage.mockResolvedValue(mockAnalysisResult);

    await figmaGenerator.generateUIFromImage('test-image-data');

    expect(mockOpenAIService.analyzeImage).toHaveBeenCalledWith('test-image-data');
    expect(mockCreateText).toHaveBeenCalledTimes(1);
    expect(mockNotify).toHaveBeenCalledWith('Generated 1 UI elements');
  });

  it('should handle OpenAI service errors', async () => {
    mockOpenAIService.analyzeImage.mockRejectedValue(new OpenAIServiceError('Service error'));

    await expect(figmaGenerator.generateUIFromImage('test-image-data'))
      .rejects.toThrow(OpenAIServiceError);
  });

  it('should handle invalid image data', async () => {
    mockOpenAIService.analyzeImage.mockRejectedValue(new ImageAnalysisError('Invalid image'));

    await expect(figmaGenerator.generateUIFromImage('test-image-data'))
      .rejects.toThrow(ImageAnalysisError);
  });

  it('should handle unknown errors', async () => {
    mockOpenAIService.analyzeImage.mockRejectedValue(new Error('Unexpected error'));

    await expect(figmaGenerator.generateUIFromImage('test-image-data'))
      .rejects.toEqual(expect.any(Error));
  });

  it('should handle empty analysis result', async () => {
    const emptyResult = {
      layout: { width: 800, height: 600, elements: [] },
      elements: []
    };

    mockOpenAIService.analyzeImage.mockResolvedValue(emptyResult);

    await figmaGenerator.generateUIFromImage('test-image-data');

    expect(mockOpenAIService.analyzeImage).toHaveBeenCalledWith('test-image-data');
    expect(mockNotify).toHaveBeenCalledWith('Generated 0 UI elements');
    expect(mockCreateRectangle).not.toHaveBeenCalled();
    expect(mockCreateText).not.toHaveBeenCalled();
  });
});
