import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAIService from '../src/services/openai-service.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.resolve(__dirname, '../.env');
const envVars = fs.readFileSync(envPath, 'utf8')
  .split('\n')
  .filter(line => line && !line.startsWith('#'))
  .reduce((acc, line) => {
    const [key, value] = line.split('=');
    acc[key.trim()] = value.trim();
    return acc;
  }, {});

async function testImageAnalysis() {
    try {
        // Read the test image
        const imagePath = path.resolve(__dirname, 'test-ui.png');
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = imageBuffer.toString('base64');

        // Initialize OpenAI service
        const openaiService = new OpenAIService({
          apiKey: envVars.OPENAI_API_KEY,
          maxRetries: 2,
          retryDelay: 1000,
          timeout: 30000
        });

        console.log('Starting image analysis...');
        const result = await openaiService.analyzeImage(base64Image);
        console.log('Analysis result:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Test failed:', error);
        if (error.details) {
            console.error('Error details:', error.details);
        }
    }
}

// Initialize OpenAI service
const openai = new OpenAIService({
  apiKey: envVars.OPENAI_API_KEY,
  maxRetries: 2,
  retryDelay: 1000,
  timeout: 30000
});

// Read and process test image
const imagePath = path.resolve(__dirname, 'test-image.png');
const imageBuffer = fs.readFileSync(imagePath);
const base64Image = imageBuffer.toString('base64');
const dataUrl = `data:image/png;base64,${base64Image}`;

console.log('Processing image...');
openai.generateUIFromImage(dataUrl)
  .then(result => {
    console.log('Success!');
    console.log(JSON.stringify(result, null, 2));
  })
  .catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });

testImageAnalysis();
