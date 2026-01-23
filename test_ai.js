
// using native fetch

async function testAI() {
    console.log("Testing AI Endpoint (Production)...");
    try {
        const response = await fetch('https://aliado-laboral-production.up.railway.app/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: "Hola, necesito ayuda legal. Soy un trabajador sin contrato. (Testing Production)",
                persona: "elias"
            })
        });

        console.log(`Status: ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.log("Response Values:", text);

        try {
            const json = JSON.parse(text);
            console.log("Parsed JSON:", json);
        } catch (e) {
            console.log("Response is not JSON");
        }

    } catch (error) {
        console.error("Fetch Error:", error);
    }
}

testAI();
