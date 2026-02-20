# 04. Módulos del Sistema: El Corazón de la App

Desglose funcional de los 8 motores que impulsan Aliado Laboral.

---

## 1. Módulo de Autenticación Híbrida (`authController`)
*   **Función:** Gestiona identidades y permisos.
*   **Tecnología:** Firebase Auth (Login) + JWT Propio (Roles).
*   **Roles:**
    *   `Worker`: Usuario final (Freemium/Premium).
    *   `Lawyer`: Abogado socio (Basic/PRO).
    *   `PyME`: Empresa cliente (Shield).
    *   `Admin`: Superusuario (Dashboard).

## 2. Motor de Inteligencia Artificial (`aiController`)
*   **Función:** El cerebro legal.
*   **Capacidades:**
    *   **Chatbot ("Elías"):** Responde dudas laborales en tiempo real.
    *   **Legal Armor:** Detecta datos sensibles (Nombres, Montos) y los anonimiza antes de enviarlos al abogado.
    *   **Clasificador HOT:** Identifica casos de alto valor (> $150k o acoso grave).

## 3. Calculadora LFT (`calculatorController`)
*   **Función:** Estima liquidaciones según la Ley Federal del Trabajo.
*   **Entrada:** Salario, Fecha Inicio/Fin, Motivo de salida.
*   **Salida:** Desglose detallado (Aguinaldo, Vacaciones, Prima, 3 Meses, 20 Días).
*   **Diferenciador:** Genera una infografía visual para compartir.

## 4. Marketplace "El Puente" (`contactController`)
*   **Función:** Conecta oferta y defensa.
*   **Flujo:**
    1.  Trabajador solicita abogado.
    2.  Sistema notifica a abogados compatibles (Geolocalización + Especialidad).
    3.  Abogado "compra" el Lead.
    4.  Se abre canal de chat seguro.

## 5. Motor de Suscripciones (`paymentController`)
*   **Función:** Gestión de recurrencia y facturación.
*   **Tecnología:** Stripe Subscriptions.
*   **Lógica:**
    *   Cobro automático mensual.
    *   Gestión de intentos fallidos (Dunning).
    *   Cancelación y Downgrade automático.

## 6. Comunidad y Foro (`forumController`)
*   **Función:** Validación social y reputación.
*   **Mecánica:** Trabajadores preguntan anónimamente, Abogados responden para ganar "puntos de reputación".
*   **Moderación IA:** Filtra insultos o spam automáticamente.

## 7. Módulo de Notificaciones (`pushController`)
*   **Función:** Re-engagement y Alertas.
*   **Eventos:** "Nuevo caso cerca de ti", "Tu abogado respondió", "Tu suscripción vence pronto".
*   **Tecnología:** Expo Push Notifications Service.

## 8. Dashboard Administrativo
*   **Función:** Control total del negocio.
*   **KPIs:**
    *   Ingresos Totales (MRR).
    *   Casos Cerrados vs. Abiertos.
    *   Tasa de Conversión de Leads.
*   **Herramientas:** Verificación manual de abogados (Cédula) y gestión de usuarios.

---

[Fin de la Documentación Técnica]
