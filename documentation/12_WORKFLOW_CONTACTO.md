# Manual y Flujo de Gestión de Casos: Trabajador -> Abogado

*Versión 1.0 (Resolución de dudas arquitectónicas)*

Este manual describe el flujo de comunicación, privacidad y negocio del Marketplace Legal integrado en Aliado Laboral, y responde a preguntas clave de QA y Diseño de Experiencia de Usuario.

---

## FASE 1: Creación de la Solicitud (El Trabajador)

**¿Dónde está el formulario?**
No es un simple Pop-up; el proceso ocurre en una pantalla completa y dedicada: `CreateContactRequestScreen.tsx`. El usuario llega a esta pantalla cuando navega por el directorio de abogados y pulsa "Contactar" en el perfil de alguno.

**¿Cómo sabemos su información real (Nombre y Celular)?**
> 🔒 **Garantía Cero Fraudes:** Durante la creación de la cuenta (Firebase), forzamos al usuario a verificar su número de celular vía SMS (OTP). Cuando él llena la solicitud de contacto con el abogado, **no le pedimos su nombre ni su celular de nuevo**. El sistema "jala" esos datos en el backend directamente de su bóveda de sesión segura `req.user`. Si no está autenticado, no puede proceder.

**Proceso de documentos**
El formulario contiene un botón (usando `expo-document-picker`) para que adjunten fotos o PDFs directo desde la galería de su celular.

---

## FASE 2: Interfaz del Abogado y Costos

**¿Es un PDF lo que le llega al abogado?**
No, son "Datos nativos" en la aplicación móvil. El abogado tiene un Dashboard (`LawyerRequestsScreen.tsx`) donde se pinta un elegante *Grid* o Lista de Tarjetas (Cards). Cada tarjeta es un caso de un trabajador.

**Esquema de Costos Básicos (Free Freemium)**
Tienes razón, "Básico no es Gratis" en términos de Leads. 
- La cuenta *Básica* permite registrarse, subir documentos al Colegio de Abogados y que te vean en el directorio cobrando **0 pesos al mes**.
- Sin embargo, para abrir un Lead (desbloquear el teléfono de la persona y habilitar el chat), deben pagar "por evento" (Pay-per-Lead) usando su tarjeta en **Stripe** ($150 o $300 si es un caso HOT).

---

## FASE 3: Comunicación Worker <> Abogado

**¿Cómo se comunican, son solo botones o texto plano?**
Tenemos integrado un **Chat Completo Nivel WhatsApp** (`CaseChatScreen.tsx` y `ChatScreen.tsx`).
- **Texto Plano:** Ellos escriben mensajes libremente como en cualquier red social.
- **Mensajes del Sistema:** La plataforma puede inyectar "Mensajes Automáticos" en la burbuja de chat. (Por ejemplo, cuando el caso se marca como ganado, el bot les envía un mensajito que dice *"¡Felicidades por tu caso!"* sin que ninguno de los dos lo haya tenido que teclear).
- **Notificaciones Push:** Avisan cuando hay mensajes nuevos.

---

## Resumen del Flujo
1. **Trabajador:** Encuentra abogado -> Llena formulario -> Paga $50 (Stripe/MP) -> Envía.
2. **Sistema:** Etiqueta el caso (IA/Normal) -> Oculta celular del trabajador.
3. **Abogado:** Ve la oportunidad en su Dashboard -> Da Tap en "Aceptar" -> Paga su parte ($150) -> **SE ABRE EL CHAT DIRECTO Y SE LIBERA EL TELÉFONO.**
4. **Final:** Abogado marca como "Ganado" -> Sube acuerdo -> Se genera factura Stripe automática por la comisión de éxito.
