import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAIService from '../src/services/openai-service.js';
import { logger } from '../src/utils/logger';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.resolve(__dirname, '../.env');
const envVars = fs
  .readFileSync(envPath, 'utf8')
  .split('\n')
  .filter(line => line && !line.startsWith('#'))
  .reduce((acc: { [key: string]: string }, line) => {
    const [key, value] = line.split('=');
    if (key && value) {
      acc[key.trim()] = value.trim();
    }
    return acc;
  }, {});

if (!envVars.OPENAI_API_KEY) {
  logger.error('Error: OPENAI_API_KEY not found in .env file');
  process.exit(1);
}

// Initialize OpenAI service
const openai = new OpenAIService({
  apiKey: envVars.OPENAI_API_KEY,
  maxRetries: 2,
  retryDelay: 1000,
  timeout: 30000,
});

// Read and process test image
const imagePath = path.resolve(__dirname, 'test-image.png');
const imageBuffer = fs.readFileSync(imagePath);
const base64Image = imageBuffer.toString('base64');
const dataUrl = `data:image/png;base64,${base64Image}`;

try {
  logger.log('Processing image...');
  openai
    .generateUIFromImage(dataUrl)
    .then(result => {
      logger.log('Success!');
      logger.log(JSON.stringify(result, null, 2));
    })
    .catch(error => {
      logger.error('Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    });
} catch (error) {
  logger.error('Error processing image:', error);
  process.exit(1);
}
