import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import OpenAIService from '../src/services/openai-service';

dotenv.config();

async function testImageAnalysis() {
    try {
        // Read the test image
        const imagePath = path.join(__dirname, 'test-ui.png');
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = imageBuffer.toString('base64');

        // Create OpenAI service instance
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error('OPENAI_API_KEY environment variable is not set');
        }

        const openaiService = new OpenAIService({ apiKey });
        
        console.log('Starting image analysis...');
        const result = await openaiService.analyzeImage(base64Image);
        console.log('Analysis result:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Test failed:', error);
        if ((error as any).details) {
            console.error('Error details:', (error as any).details);
        }
    }
}

testImageAnalysis();
