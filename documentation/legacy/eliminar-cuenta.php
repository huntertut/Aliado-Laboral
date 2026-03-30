<?php
$page_title = "Eliminar Cuenta - Aliado Laboral";
include 'includes/head.php';
include 'includes/header.php';
?>

<main class="pt-32 pb-24 relative z-10">
    <div class="container mx-auto px-6 max-w-3xl reveal-content">

        <div class="text-center mb-12">
            <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-gradient inline-block">Eliminar tu
                Cuenta</h1>
            <p class="text-xl text-gray-400 font-light">Aliado Laboral — Gestión de datos personales</p>
        </div>

        <div class="glass-card p-8 md:p-12 rounded-[2rem] shadow-2xl legal-content">

            <h2>¿Cómo solicitar la eliminación de tu cuenta?</h2>
            <p>Puedes eliminar tu cuenta y los datos asociados de dos formas:</p>

            <h3>Opción 1: Desde la aplicación (inmediata)</h3>
            <ol>
                <li>Abre la app <strong>Aliado Laboral</strong> en tu dispositivo.</li>
                <li>Dirígete a <strong>Perfil → Configuración</strong>.</li>
                <li>Selecciona <strong>"Eliminar cuenta"</strong>.</li>
                <li>Confirma la acción. Tu cuenta y datos personales serán eliminados de forma inmediata.</li>
            </ol>

            <h3>Opción 2: Por correo electrónico</h3>
            <p>Envía un correo a <a href="mailto:soporte@cibertmx.org"
                    class="text-aliado-blue hover:underline">soporte@cibertmx.org</a> con el siguiente asunto y cuerpo:
            </p>
            <div
                style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:0.75rem; padding:1.25rem; margin:1rem 0; font-family:monospace; font-size:0.9rem;">
                <strong>Asunto:</strong> Solicitud de eliminación de cuenta — Aliado Laboral<br><br>
                <strong>Cuerpo:</strong><br>
                Nombre completo: [tu nombre]<br>
                Correo registrado: [tu correo en la app]<br>
                Solicito la eliminación completa de mi cuenta y todos los datos asociados.
            </div>
            <p>Procesaremos tu solicitud en un plazo máximo de <strong>72 horas hábiles</strong>.</p>

            <h2>¿Qué datos se eliminan?</h2>
            <ul>
                <li>✅ Datos de perfil (nombre, correo, teléfono, fotografía)</li>
                <li>✅ Historial laboral y cálculos de prestaciones</li>
                <li>✅ Mensajes e historial de conversaciones</li>
                <li>✅ Publicaciones en el foro</li>
                <li>✅ Documentos en la Bóveda Virtual</li>
            </ul>

            <h2>¿Qué datos se conservan temporalmente?</h2>
            <p>Por obligaciones fiscales y legales vigentes en México, los siguientes datos podrán conservarse hasta
                <strong>3 años</strong> después de la eliminación de la cuenta, en forma anónima o agregada:</p>
            <ul>
                <li>Registros de transacciones y pagos (requeridos por el SAT)</li>
                <li>Registros de auditoría de seguridad (logs del sistema)</li>
            </ul>

            <h2>¿Tienes preguntas?</h2>
            <p>Escríbenos a <a href="mailto:soporte@cibertmx.org"
                    class="text-aliado-blue hover:underline">soporte@cibertmx.org</a>. Responderemos en un máximo de 72
                horas hábiles.</p>

        </div>
    </div>
</main>

<?php include 'includes/footer.php'; ?>