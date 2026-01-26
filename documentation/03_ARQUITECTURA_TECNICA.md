# 03. Arquitectura Técnica

## Stack Tecnológico
*   **Frontend Mobile:** React Native (Expo) - iOS & Android.
*   **Backend:** Node.js + Express (TypeScript).
*   **Base de Datos:** SQLite (Dev) / PostgreSQL (Prod).
*   **ORM:** Prisma.

## Servicios Externos
*   **IA / LLM:** Groq (Llama 3-70b) para análisis rápido y económico.
*   **Pagos:** Stripe (Global) y MercadoPago (Latam Backup).
*   **OCR:** Tesseract.js (Local/Server-side).
*   **Almacenamiento:** Sistema de archivos local (Migrable a S3/DigitalOcean Spaces).

## Diagrama de Flujo (Simplificado)
1.  **App:** Usuario envía audio/texto.
2.  **Backend:**
    *   `authMiddleware` valida usuario.
    *   `aiController` envía prompt a Groq.
    *   `contactController` gestiona pagos y estado del caso.
3.  **Database:** Guarda caso, chat y transacciones.
4.  **Notificaciones:** Firebase Cloud Messaging (FCM) alerta al abogado.

---

[Siguiente: Módulos del Sistema](./04_MODULOS_SISTEMA.md)
