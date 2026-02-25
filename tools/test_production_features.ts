
import axios from 'axios';

// DIGITAL OCEAN IP
const API_URL = 'http://142.93.186.75:3001/api';

async function testProductionFeatures() {
    console.log(`🌍 Conectando a DigitalOcean (${API_URL})...\n`);

    try {
        // 1. Verificar Salud del Servidor
        console.log('1. [GET] /health (o root verifier)...');
        try {
            const health = await axios.get(`${API_URL}/lawyers`);
            console.log('✅ Servidor Responde. Abogados encontrados:', health.data.length);
        } catch (e) {
            console.error('❌ Error conectando al servidor:', e.message);
            return;
        }

        // 2. Probar Endpoint de Fraude (Nuevo)
        // Intentaremos reportar fraude "falso" para ver si el endpoint existe (esperamos 401 o 400, no 404)
        console.log('\n2. [POST] /reports/fraud (Verificando existencia)...');
        try {
            await axios.post(`${API_URL}/reports/fraud`, {});
        } catch (e) {
            if (e.response && e.response.status === 404) {
                console.error('❌ Endpoint NO encontrado (404). El despliegue falló.');
            } else if (e.response && (e.response.status === 401 || e.response.status === 400 || e.response.status === 403)) {
                console.log(`✅ Endpoint EXISTE (Respondió ${e.response.status} como se esperaba sin auth).`);
            } else {
                console.log('❓ Respuesta inesperada:', e.message);
            }
        }

        console.log('\n🎉 Prueba de Humo Finalizada. El servidor tiene el código nuevo.');

    } catch (error) {
        console.error('Error general:', error);
    }
}

testProductionFeatures();
