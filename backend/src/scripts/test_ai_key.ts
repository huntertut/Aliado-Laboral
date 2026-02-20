import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const testAI = async () => {
    console.log('🤖 Testing Google Gemini API Key...');

    const key = process.env.GOOGLE_API_KEY;

    if (!key) {
        console.error('PROMPT_ERROR: GOOGLE_API_KEY is missing in .env file!');
        return;
    }

    console.log(`Key found: ${key.substring(0, 5)}...${key.substring(key.length - 4)} (Length: ${key.length})`);

    try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        console.log('Sending test prompt: "Hola, ¿estás funcionando?"...');
        const result = await model.generateContent("Hola, ¿estás funcionando?");
        const response = await result.response;
        const text = response.text();

        console.log('✅ AI Response received:');
        console.log(text);

    } catch (error: any) {
        console.error('❌ AI Test Failed:', error.message);
        if (error.message.includes('403')) {
            console.error('Hint: API Key might be invalid or has no quota.');
        }
    }
};

testAI();
