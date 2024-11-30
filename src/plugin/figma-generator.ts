import { OpenAIService } from '../services/openai-service';
import { AnalysisResult } from '../types/plugin';

export class FigmaGenerator {
  private readonly openAIService: OpenAIService;

  constructor(openAIService: OpenAIService) {
    this.openAIService = openAIService;
  }

  async generateUIFromImage(imageData: string): Promise<AnalysisResult> {
    try {
      return await this.openAIService.generateUIFromImage(imageData);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        layout: {
          columns: 1,
          rows: 1,
          margin: 10,
          gridSpacing: 10,
        },
        elements: [],
      };
    }
  }
}
