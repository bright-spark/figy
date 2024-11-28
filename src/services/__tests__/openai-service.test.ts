import axios from 'axios';
import OpenAIService, { RateLimitError } from '../openai-service';
import { 
  UIElementType, 
  ImageAnalysisError, 
  OpenAIServiceError 
} from '../../types/plugin';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock process.env
const originalEnv = process.env;

describe('OpenAIService', () => {
  let openAIService: OpenAIService;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.OPENAI_API_KEY = 'sk-test-key';
    jest.useFakeTimers();
    
    // Mock the delay function to resolve immediately
    jest.spyOn(OpenAIService.prototype as any, 'delay').mockImplementation(() => Promise.resolve());
    
    openAIService = new OpenAIService({
      maxRetries: 3,
      baseRetryDelay: 1000,
      maxRetryDelay: 5000,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('constructor', () => {
    it('should throw error if API key is missing', () => {
      process.env.OPENAI_API_KEY = undefined;
      expect(() => new OpenAIService()).toThrow('API key is required');
    });

    it('should throw error if API key format is invalid', () => {
      process.env.OPENAI_API_KEY = 'invalid-key';
      expect(() => new OpenAIService()).toThrow('Invalid API key format');
    });

    it('should use Codeium API URL for sk-proj- keys', () => {
      process.env.OPENAI_API_KEY = 'sk-proj-test-key';
      const service = new OpenAIService();
      expect((service as any).baseUrl).toBe('https://api.codeium.com/v1/chat/completions');
    });

    it('should use custom retry options', () => {
      const options = {
        maxRetries: 5,
        baseRetryDelay: 2000,
        maxRetryDelay: 10000
      };
      const service = new OpenAIService(options);
      expect((service as any).options).toEqual(options);
    });
  });

  describe('analyzeImage', () => {
    const mockImageData = 'base64-encoded-image';
    const mockSuccessResponse = {
      data: {
        choices: [
          {
            message: {
              content: JSON.stringify({
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
                    content: 'Sample Text',
                    style: {
                      color: 'black',
                      backgroundColor: 'white',
                      opacity: 1,
                      cornerRadius: 0
                    }
                  },
                ],
              }),
            },
          },
        ],
      },
    };

    it('should successfully analyze image', async () => {
      mockedAxios.post.mockResolvedValue(mockSuccessResponse);

      const result = await openAIService.analyzeImage(mockImageData);

      expect(result.elements.length).toBe(1);
      expect(result.elements[0].type).toBe(UIElementType.TEXT);
      expect(result.elements[0].x).toBe(10);
      expect(result.elements[0].y).toBe(20);
      expect(result.elements[0].width).toBe(100);
      expect(result.elements[0].height).toBe(50);
      expect(result.elements[0].text).toBe('Sample Text');
      expect(result.layout.columns).toBe(2);
      expect(result.layout.rows).toBe(3);
      expect(result.layout.gridSpacing).toBe(10);
      expect(result.layout.margin).toBe(5);

      // Verify API call
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          model: 'gpt-4o-mini',
          messages: expect.any(Array),
          max_tokens: expect.any(Number),
        }),
        expect.any(Object)
      );
    });

    it('should throw OpenAIServiceError for empty image data', async () => {
      await expect(openAIService.analyzeImage('')).rejects.toThrow(OpenAIServiceError);
    });

    it('should throw OpenAIServiceError for invalid image data', async () => {
      await expect(openAIService.analyzeImage(null as any)).rejects.toThrow(OpenAIServiceError);
      await expect(openAIService.analyzeImage(undefined as any)).rejects.toThrow(OpenAIServiceError);
    });

    it('should throw ImageAnalysisError for invalid response format', async () => {
      mockedAxios.post.mockResolvedValue({
        data: {
          choices: [{ message: { content: 'Invalid JSON' } }],
        },
      });

      await expect(openAIService.analyzeImage(mockImageData)).rejects.toThrow(ImageAnalysisError);
    });

    it('should handle rate limit errors', async () => {
      const mockError = {
        response: {
          status: 429,
          headers: {
            'retry-after': '3600',
          },
        },
      };

      mockedAxios.post.mockRejectedValue(mockError);

      await expect(openAIService.analyzeImage(mockImageData)).rejects.toThrow(RateLimitError);
      await expect(openAIService.analyzeImage(mockImageData)).rejects.toMatchObject({
        retryAfter: 3600,
      });
    });

    it('should handle unauthorized errors', async () => {
      const mockError = {
        response: {
          status: 401,
        },
      };

      mockedAxios.post.mockRejectedValue(mockError);

      await expect(openAIService.analyzeImage(mockImageData)).rejects.toThrow('Invalid API key or unauthorized access');
    });

    it('should handle 404 errors', async () => {
      const mockError = {
        response: {
          status: 404,
        },
      };

      mockedAxios.post.mockRejectedValue(mockError);

      await expect(openAIService.analyzeImage(mockImageData)).rejects.toThrow('API endpoint not found');
    });

    it('should retry on server errors with backoff', async () => {
      const mockError = {
        response: {
          status: 500,
        },
      };

      mockedAxios.post
        .mockRejectedValueOnce(mockError)
        .mockRejectedValueOnce(mockError)
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce({
          data: {
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    layout: {
                      columns: 2,
                      rows: 3,
                      gridSpacing: 10,
                      margin: 5,
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
                        backgroundColor: 'white',
                        opacity: 1,
                        cornerRadius: 0,
                      },
                    ],
                    components: {},
                  }),
                },
              },
            ],
          },
        });

      const resultPromise = openAIService.analyzeImage(mockImageData);
      await jest.runAllTimersAsync();
      const result = await resultPromise;

      expect(result).toEqual({
        layout: {
          columns: 2,
          rows: 3,
          gridSpacing: 10,
          margin: 5,
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
            backgroundColor: 'white',
            opacity: 1,
            cornerRadius: 0,
          },
        ],
        components: {},
      });
      expect(mockedAxios.post).toHaveBeenCalledTimes(4); // Initial try + 3 retries
    });

    it('should handle max retries exceeded', async () => {
      const mockError = {
        response: {
          status: 500,
        },
      };

      mockedAxios.post.mockRejectedValueOnce(mockError)
        .mockRejectedValueOnce(mockError)
        .mockRejectedValueOnce(mockError)
        .mockRejectedValueOnce(mockError);

      const resultPromise = openAIService.analyzeImage(mockImageData);
      await jest.runAllTimersAsync();

      await expect(resultPromise).rejects.toThrow('Max retry attempts exceeded');
      expect(mockedAxios.post).toHaveBeenCalledTimes(4); // Initial try + 3 retries
    });

    it('should handle missing layout or elements in response', async () => {
      // Test missing elements
      mockedAxios.post.mockResolvedValue({
        data: {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  layout: {
                    columns: 2,
                    rows: 3,
                    gridSpacing: 10,
                    margin: 5
                  }
                }),
              },
            },
          ],
        },
      });

      await expect(openAIService.analyzeImage(mockImageData)).rejects.toThrow('Failed to parse AI response');

      // Test missing layout
      mockedAxios.post.mockResolvedValue({
        data: {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  elements: [
                    {
                      type: 'text',
                      x: 10,
                      y: 20,
                      width: 100,
                      height: 50,
                      text: 'Sample Text',
                      color: 'black',
                      backgroundColor: 'white',
                      opacity: 1,
                      cornerRadius: 0
                    }
                  ]
                }),
              },
            },
          ],
        },
      });

      await expect(openAIService.analyzeImage(mockImageData)).rejects.toThrow('Failed to parse AI response');
    });

    it('should handle invalid element type', async () => {
      const invalidTypeResponse = {
        data: {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  layout: {
                    columns: 2,
                    rows: 3,
                    gridSpacing: 10,
                    margin: 5
                  },
                  elements: [
                    {
                      type: 'invalid_type',
                      x: 10,
                      y: 20,
                      width: 100,
                      height: 50,
                      text: 'Sample Text',
                      color: 'black',
                      backgroundColor: 'white',
                      opacity: 1,
                      cornerRadius: 0
                    }
                  ],
                  components: {}
                }),
              },
            },
          ],
        },
      };

      mockedAxios.post.mockResolvedValue(invalidTypeResponse);

      const result = await openAIService.analyzeImage(mockImageData);
      expect(result.elements[0].type).toBe(UIElementType.RECTANGLE); // Invalid types should default to RECTANGLE
    });
  });
});
