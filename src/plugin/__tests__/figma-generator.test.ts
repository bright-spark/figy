import { FigmaGenerator } from '../figma-generator';
import OpenAIService from '../../services/openai-service';
import { 
  UIElementType, 
  ImageAnalysisError, 
  OpenAIServiceError,
  AnalysisResult
} from '../../types/plugin';

// Mock Figma global object
const mockFigma = {
  createFrame: jest.fn().mockReturnValue({
    name: '',
    resize: jest.fn(),
    appendChild: jest.fn(),
  }),
  createRectangle: jest.fn().mockReturnValue({
    x: 0,
    y: 0,
    resize: jest.fn(),
  }),
  createText: jest.fn().mockReturnValue({
    characters: '',
    x: 0,
    y: 0,
    resize: jest.fn(),
  }),
};

// Temporarily add figma to global scope for testing
(global as any).figma = mockFigma;

describe('FigmaGenerator', () => {
  let figmaGenerator: FigmaGenerator;
  let mockOpenAIService: jest.Mocked<OpenAIService>;
  let mockCreateRectangle: jest.Mock;
  let mockCreateText: jest.Mock;
  let mockNotify: jest.Mock;

  beforeEach(() => {
    // Reset mocks before each test
    mockFigma.createFrame.mockClear();
    mockFigma.createRectangle.mockClear();
    mockFigma.createText.mockClear();

    mockOpenAIService = {
      analyzeImage: jest.fn(),
    } as any;

    // Create mock Figma nodes
    mockCreateText = mockFigma.createText;
    mockCreateRectangle = mockFigma.createRectangle;
    mockNotify = jest.fn();

    figmaGenerator = new FigmaGenerator(
      mockOpenAIService,
      mockCreateRectangle,
      mockCreateText,
      mockNotify
    );
  });

  it('should successfully generate UI elements from image analysis', async () => {
    const mockAnalysisResult: AnalysisResult = {
      layout: { 
        columns: 2, 
        rows: 3, 
        gridSpacing: 10, 
        margin: 5 
      },
      elements: [
        {
          type: UIElementType.TEXT,
          x: 10,
          y: 20,
          width: 100,
          height: 50,
          text: 'Sample Text',
          color: 'black',
          backgroundColor: 'white'
        },
      ],
    };

    mockOpenAIService.analyzeImage.mockResolvedValue(mockAnalysisResult);

    await figmaGenerator.generateUIFromImage('test-image-data');

    expect(mockOpenAIService.analyzeImage).toHaveBeenCalledWith('test-image-data');
    expect(mockCreateText).toHaveBeenCalledTimes(1);
    expect(mockNotify).toHaveBeenCalledWith('UI generated successfully');
  });

  it('should handle OpenAI service errors', async () => {
    mockOpenAIService.analyzeImage.mockRejectedValue(new OpenAIServiceError('Service error'));

    await expect(figmaGenerator.generateUIFromImage('test-image-data')).rejects.toThrow(
      OpenAIServiceError
    );
  });

  it('should handle invalid image data', async () => {
    mockOpenAIService.analyzeImage.mockRejectedValue(new ImageAnalysisError('Invalid image'));

    await expect(figmaGenerator.generateUIFromImage('test-image-data')).rejects.toThrow(
      ImageAnalysisError
    );
  });

  it('should handle unknown errors', async () => {
    mockOpenAIService.analyzeImage.mockRejectedValue(new Error('Unexpected error'));

    await expect(figmaGenerator.generateUIFromImage('test-image-data')).rejects.toEqual(
      expect.any(Error)
    );
  });

  it('should handle empty analysis result', async () => {
    const emptyResult: AnalysisResult = {
      layout: { 
        columns: 0, 
        rows: 0, 
        gridSpacing: 0, 
        margin: 0 
      },
      elements: [],
    };

    mockOpenAIService.analyzeImage.mockResolvedValue(emptyResult);

    await figmaGenerator.generateUIFromImage('test-image-data');

    expect(mockOpenAIService.analyzeImage).toHaveBeenCalledWith('test-image-data');
    expect(mockNotify).toHaveBeenCalledWith('UI generated successfully');
    expect(mockCreateRectangle).not.toHaveBeenCalled();
    expect(mockCreateText).not.toHaveBeenCalled();
  });
});
