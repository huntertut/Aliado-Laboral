
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

// Force load .env from root or two levels up
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const logPath = path.resolve(__dirname, '../../ai_debug_log.txt');

const log = (msg: string) => {
    console.log(msg);
    fs.appendFileSync(logPath, msg + '\n');
};

const runTest = async () => {
    fs.writeFileSync(logPath, `--- AI TEST STARTED AT ${new Date().toISOString()} ---\n`);

    const key = process.env.GOOGLE_API_KEY;
    log(`Checking Environment Variable GOOGLE_API_KEY...`);

    if (!key) {
        log('ERROR: GOOGLE_API_KEY is undefined or empty.');
        return;
    }

    log(`Key found! Length: ${key.length}. First 4 chars: ${key.substring(0, 4)}...`);

    try {
        log('Initializing GoogleGenerativeAI...');
        const genAI = new GoogleGenerativeAI(key);

        const modelName = 'gemini-1.5-pro';
        log(`Getting model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });

        log('Sending message "Hola"...');
        const result = await model.generateContent("Hola");
        const response = result.response;
        const text = response.text();

        log('SUCCESS: Gemini responded!');
        log(`Response preview: ${text.substring(0, 50)}...`);

    } catch (error: any) {
        log('CRITICAL ERROR CALLING GEMINI:');
        log(`Message: ${error.message}`);
        log(`Stack: ${error.stack}`);

        if (error.message.includes('API_KEY_INVALID')) {
            log('DIAGNOSIS: The API Key is incorrect or revoked.');
        } else if (error.message.includes('User has exceeded quotas')) {
            log('DIAGNOSIS: Quota exceeded (Billing issue or Free tier limit).');
        } else if (error.message.includes('not found')) {
            log('DIAGNOSIS: Model not found. Maybe "gemini-1.5-flash" is not available for this key?');
        }
    }
};

runTest();
