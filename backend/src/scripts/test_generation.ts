import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const testGeneration = async () => {
    const key = process.env.GOOGLE_API_KEY;
    if (!key) return console.error('No key');

    console.log(`🔑 Testing Key: ${key.substring(0, 5)}...`);
    const genAI = new GoogleGenerativeAI(key);

    const modelsToTest = [
        "gemini-flash-latest",
        "gemini-2.0-flash-lite-preview-02-05",
        "gemini-2.0-flash-exp"
    ];

    for (const modelName of modelsToTest) {
        console.log(`\n🤖 Testing Model: ${modelName}...`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Say Hello");
            const response = await result.response;
            console.log(`✅ SUCCESS (${modelName}): ${response.text()}`);
        } catch (error: any) {
            console.log(`❌ FAILED (${modelName}): ${error.message.split(']')[1] || error.message}`);
        }
    }
};

testGeneration();
