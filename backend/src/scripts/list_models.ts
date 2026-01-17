import dotenv from 'dotenv';

dotenv.config();

const listModels = async () => {
    const key = process.env.GOOGLE_API_KEY;
    if (!key) {
        console.error('❌ GOOGLE_API_KEY is missing.');
        return;
    }

    console.log(`🔑 Testing Key: ${key.substring(0, 5)}...`);

    // Method 1: Raw REST API Check
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
    console.log(`🌐 Fetching models from: ${url.replace(key, 'HIDDEN_KEY')}`);

    try {
        const response = await fetch(url);

        if (!response.ok) {
            console.error('❌ API Request Failed!');
            console.error(`Status: ${response.status}`);
            const errorText = await response.text();
            console.error('Data:', errorText);

            if (response.status === 403 || response.status === 400) {
                console.log('\n💡 DIAGNOSIS: The API Key is invalid or the "Generative Language API" is NOT enabled in Google Cloud Console.');
            }
            return;
        }

        const data: any = await response.json();
        console.log('✅ API Connection Successful!');
        console.log('📜 Available Models:');

        const models = data.models || [];
        if (models.length === 0) {
            console.warn('⚠️ No models found! (This usually means the API is enabled but has no quotas/models assigned)');
        }

        models.forEach((m: any) => {
            console.log(`   - ${m.name} (${m.displayName})`);
        });

    } catch (error: any) {
        console.error('Error:', error.message);
    }
};

listModels();
