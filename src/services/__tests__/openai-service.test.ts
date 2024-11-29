import { OpenAIService } from '../openai-service';
import { UIElementType, UIElement } from '../../types/plugin';

describe('OpenAIService', () => {
  let service: OpenAIService;

  beforeEach(() => {
    service = new OpenAIService({
      apiKey: 'test-api-key',
      maxRetries: 2,
      retryDelay: 10,
      timeout: 1000
    });
  });

  describe('generateUIFromImage', () => {
    const defaultElement: UIElement = {
      type: UIElementType.BUTTON,
      x: 0,
      y: 0,
      width: 100,
      height: 50,
      text: '',
      style: {
        color: '#000000',
        fontSize: 16
      }
    };

    const createMockResponse = (layout = {}, elementOverrides: Partial<UIElement> = {}) => ({
      choices: [
        {
          message: {
            content: JSON.stringify({
              layout: {
                columns: 1,
                rows: 1,
                margin: 10,
                gridSpacing: 0,
                ...layout
              },
              elements: [
                {
                  ...defaultElement,
                  ...elementOverrides
                }
              ]
            })
          }
        }
      ]
    });

    it('should generate UI layout from image data', async () => {
      const mockResponse = createMockResponse(
        {
          columns: 2,
          rows: 2,
          gridSpacing: 10
        },
        {
          text: 'Hello'
        }
      );

      // @ts-ignore - Mock implementation
      service['openai'].chat.completions.create = jest.fn().mockResolvedValue(mockResponse);

      const result = await service.generateUIFromImage('test-image-data');

      expect(result.success).toBe(true);
      expect(result.layout.columns).toBe(2);
      expect(result.layout.rows).toBe(2);
      expect(result.elements).toHaveLength(1);
      expect(result.elements[0].type).toBe(UIElementType.BUTTON);
      expect(result.elements[0].text).toBe('Hello');
      expect(result.elements[0].style.color).toBe('#000000');
      expect(result.elements[0].style.fontSize).toBe(16);
    });

    it('should generate UI layout with partial element data', async () => {
      const mockResponse = createMockResponse();

      // @ts-ignore - Mock implementation
      service['openai'].chat.completions.create = jest.fn().mockResolvedValue(mockResponse);

      const result = await service.generateUIFromImage('test-image-data');

      expect(result.success).toBe(true);
      expect(result.layout.columns).toBe(1);
      expect(result.elements).toHaveLength(1);
      expect(result.elements[0].type).toBe(UIElementType.BUTTON);
      expect(result.elements[0].x).toBe(0);
      expect(result.elements[0].y).toBe(0);
      expect(result.elements[0].width).toBe(100);
      expect(result.elements[0].height).toBe(50);
      expect(result.elements[0].text).toBe('');
      expect(result.elements[0].style.color).toBe('#000000');
      expect(result.elements[0].style.fontSize).toBe(16);
    });

    it('should throw error for invalid image data', async () => {
      await expect(service.generateUIFromImage('')).rejects.toThrow('Invalid image data');
    });

    it('should throw error for invalid API response', async () => {
      // @ts-ignore - Mock implementation
      service['openai'].chat.completions.create = jest.fn().mockResolvedValue({
        choices: []
      });

      await expect(service.generateUIFromImage('test-image-data')).rejects.toThrow('Invalid API response');
    });

    it('should retry on retriable network errors', async () => {
      const retryableErrors = [
        'Network connection error',
        'Request timeout'
      ];

      // @ts-ignore - Mock implementation
      const mockCreate = jest.fn()
        .mockRejectedValueOnce(new Error(retryableErrors[0]))
        .mockRejectedValueOnce(new Error(retryableErrors[1]))
        .mockResolvedValueOnce(createMockResponse());

      service['openai'].chat.completions.create = mockCreate;

      const result = await service.generateUIFromImage('test-image-data');
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(mockCreate).toHaveBeenCalledTimes(3);
    });

    it('should throw last error after max retries for non-retriable errors', async () => {
      // @ts-ignore - Mock implementation
      const mockCreate = jest.fn()
        .mockRejectedValueOnce(new Error('Parsing error'))
        .mockRejectedValueOnce(new Error('Validation error'));

      service['openai'].chat.completions.create = mockCreate;

      await expect(service.generateUIFromImage('test-image-data')).rejects.toThrow('Validation error');
      expect(mockCreate).toHaveBeenCalledTimes(2);
    });

    it('should add jitter to retry delay', async () => {
      const delayMock = jest.spyOn(service as any, 'delay');
      
      // @ts-ignore - Mock implementation
      service['openai'].chat.completions.create = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValueOnce(createMockResponse());

      await service.generateUIFromImage('test-image-data');

      // Check that delay was called with a value that includes jitter
      expect(delayMock).toHaveBeenCalledTimes(2);
      const firstDelay = delayMock.mock.calls[0][0] as number;
      const secondDelay = delayMock.mock.calls[1][0] as number;

      // First delay should be around 10 * 2^0 + jitter
      expect(firstDelay).toBeGreaterThan(10);
      expect(firstDelay).toBeLessThan(20);

      // Second delay should be around 10 * 2^1 + jitter
      expect(secondDelay).toBeGreaterThan(20);
      expect(secondDelay).toBeLessThan(40);

      // Jitter should be random
      const firstJitter = firstDelay - 10;
      const secondJitter = secondDelay - 20;
      expect(firstJitter).toBeGreaterThanOrEqual(0);
      expect(firstJitter).toBeLessThan(10);
      expect(secondJitter).toBeGreaterThanOrEqual(0);
      expect(secondJitter).toBeLessThan(10);
    });
  });
});
