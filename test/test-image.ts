import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { OpenAIService } from '../src/services/openai-service';

dotenv.config();

async function testImageAnalysis() {
  const service = new OpenAIService({
    apiKey: process.env.OPENAI_API_KEY || '',
    maxRetries: 2,
    retryDelay: 1000,
    timeout: 30000
  });

  try {
    // Read the test image
    const imagePath = path.join(__dirname, 'test-ui.png');
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');

    const result = await service.generateUIFromImage(base64Image);
    console.log('Analysis result:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

testImageAnalysis().catch(console.error);
