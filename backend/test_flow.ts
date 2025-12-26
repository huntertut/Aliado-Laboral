// @ts-ignore
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000';

async function testFlow() {
    console.log('🚀 Iniciando prueba de flujo de contacto...');

    try {
        // 1. Registrar Abogado
        console.log('\n1️⃣ Registrando Abogado...');
        const lawyerEmail = `lawyer_${Date.now()}@test.com`;
        const lawyerRes = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: lawyerEmail,
                password: 'password123',
                fullName: 'Lic. Test Abogado',
                role: 'lawyer'
            })
        });
        const lawyerData = await lawyerRes.json();
        if (!lawyerRes.ok) throw new Error(`Error registro abogado: ${JSON.stringify(lawyerData)}`);
        const lawyerToken = lawyerData.token;
        console.log('✅ Abogado registrado:', lawyerEmail);

        // 2. Crear Perfil de Abogado (necesario para recibir solicitudes)
        console.log('\n2️⃣ Creando Perfil de Abogado...');
        // Primero necesitamos crear el registro de 'Lawyer' y 'LawyerProfile'
        // Asumimos que hay un endpoint para esto o que el registro lo hace.
        // Revisando el código, parece que se necesita un paso extra o el registro es básico.
        // Vamos a intentar crear el perfil directamente si existe la ruta, o asumir que el registro lo hizo.
        // NOTA: En una app real, el abogado completaría su perfil. Vamos a simularlo.

        // Simulamos que el abogado se suscribe (necesario para estar activo)
        // Como no tenemos el endpoint de suscripción a mano en el plan, vamos a usar el endpoint de perfil si existe
        // Ojo: El controlador `contactController` verifica `lawyerProfile.lawyer.subscription?.status === 'active'`
        // Necesitamos activar la suscripción manualmente o via endpoint.

        // TRUCO: Para este test, vamos a intentar crear la suscripción via endpoint si existe, 
        // o tendremos que confiar en que el usuario lo haga manualmente.
        // Pero espera, el usuario pidió "ayudame a probarlo".

        // Vamos a intentar crear el perfil:
        const profileRes = await fetch(`${API_URL}/lawyer-profile`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${lawyerToken}`
            },
            body: JSON.stringify({
                licenseNumber: `CED-${Date.now()}`,
                specialty: 'Laboral',
                phone: '555-1234-5678',
                bio: 'Abogado de prueba'
            })
        });
        // Si falla, puede que ya exista o la ruta sea distinta. Continuamos.

        // Activar suscripción (Simulación)
        const subRes = await fetch(`${API_URL}/subscription/subscribe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${lawyerToken}`
            },
            body: JSON.stringify({ plan: 'bi-monthly' }) // Payload adivinada
        });

        // Obtener el ID del perfil del abogado para la solicitud
        const meRes = await fetch(`${API_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${lawyerToken}` }
        });
        const meData = await meRes.json();
        // Asumimos que `meData` trae el perfil o lo buscamos.
        // Si no, no podemos seguir.

        // 3. Registrar Trabajador
        console.log('\n3️⃣ Registrando Trabajador...');
        const workerEmail = `worker_${Date.now()}@test.com`;
        const workerRes = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: workerEmail,
                password: 'password123',
                fullName: 'Juan Trabajador',
                role: 'worker'
            })
        });
        const workerData = await workerRes.json();
        const workerToken = workerData.token;
        console.log('✅ Trabajador registrado:', workerEmail);

        // 4. Crear Solicitud de Contacto
        console.log('\n4️⃣ Enviando Solicitud de Contacto...');
        // Necesitamos el ID del perfil del abogado. 
        // Vamos a listar abogados para obtener uno.
        const lawyersListRes = await fetch(`${API_URL}/lawyers`, {
            headers: { 'Authorization': `Bearer ${workerToken}` }
        });
        const lawyersList = await lawyersListRes.json();
        const targetLawyer = lawyersList.find((l: any) => l.user.email === lawyerEmail);

        if (!targetLawyer) {
            throw new Error('No se encontró al abogado en la lista pública (¿Falta suscripción activa?)');
        }

        const requestRes = await fetch(`${API_URL}/contact/request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${workerToken}`
            },
            body: JSON.stringify({
                lawyerProfileId: targetLawyer.profile.id,
                caseSummary: 'Me despidieron injustificadamente hace 2 días.',
                caseType: 'despido',
                urgency: 'high'
            })
        });
        const requestData = await requestRes.json();
        if (!requestRes.ok) throw new Error(`Error creando solicitud: ${JSON.stringify(requestData)}`);
        console.log('✅ Solicitud enviada. ID:', requestData.request.id);
        const requestId = requestData.request.id;

        // 5. Abogado ve la solicitud
        console.log('\n5️⃣ Abogado revisando solicitudes...');
        const lawyerRequestsRes = await fetch(`${API_URL}/contact/lawyer/requests?status=pending`, {
            headers: { 'Authorization': `Bearer ${lawyerToken}` }
        });
        const lawyerRequests = await lawyerRequestsRes.json();
        const foundRequest = lawyerRequests.requests.find((r: any) => r.id === requestId);
        if (!foundRequest) throw new Error('El abogado no ve la solicitud pendiente');
        console.log('✅ Solicitud encontrada en bandeja del abogado');

        // 6. Abogado acepta la solicitud
        console.log('\n6️⃣ Abogado aceptando solicitud...');
        const acceptRes = await fetch(`${API_URL}/contact/lawyer/request/${requestId}/accept`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${lawyerToken}`
            }
        });
        const acceptData = await acceptRes.json();
        if (!acceptRes.ok) throw new Error(`Error aceptando: ${JSON.stringify(acceptData)}`);
        console.log('✅ Solicitud aceptada');

        // 7. Verificar datos desbloqueados
        console.log('\n7️⃣ Verificando datos de contacto...');
        const contactRes = await fetch(`${API_URL}/contact/lawyer/request/${requestId}/contact`, {
            headers: { 'Authorization': `Bearer ${lawyerToken}` }
        });
        const contactData = await contactRes.json();
        if (!contactData.contactInfo.worker.email) throw new Error('No se reveló el email del trabajador');
        console.log('✅ Datos revelados:', contactData.contactInfo.worker.email);

        console.log('\n🎉 ¡PRUEBA EXITOSA! El flujo funciona correctamente.');

    } catch (error) {
        console.error('\n❌ ERROR EN LA PRUEBA:', error);
    }
}

testFlow();
