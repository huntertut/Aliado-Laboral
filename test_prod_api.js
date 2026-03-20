const axios = require('axios');

async function testProductionAPI() {
    console.log("🔍 TESTING PRODUCTION API (api.cibertmx.org)...\n");

    const API_URL = "https://api.cibertmx.org/api";

    try {
        console.log("➡️ Test 1: Health Check");
        const health = await axios.get(`${API_URL}/health`);
        console.log("✅ Health Check OK:", health.data);
    } catch (e) {
        console.log("❌ Health Check FAIL:", e.message);
    }

    try {
        console.log("\n➡️ Test 2: AI Chat (Elías /api/ai/chat)");
        const chat = await axios.post(`${API_URL}/ai/chat`, {
            input: "Hola, necesito calcular mi finiquito",
            persona: "elias",
            conversationHistory: "[]"
        });
        console.log("✅ AI Response OK:", chat.data);
    } catch (e) {
        console.log("❌ AI Chat FAIL:", e.response?.data || e.message);
    }

    try {
        console.log("\n➡️ Test 3: Jurisdiction Finder (/api/jurisdiction/find)");
        const jurisdiction = await axios.post(`${API_URL}/jurisdiction/find`, {
            sector_usuario: "restaurante",
            estado_usuario: "Jalisco"
        });
        console.log("✅ Jurisdiction OK:", jurisdiction.data);
    } catch (e) {
        console.log("❌ Jurisdiction FAIL:", e.response?.data || e.message);
    }
}

testProductionAPI();
