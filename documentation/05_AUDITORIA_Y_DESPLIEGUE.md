# 05. Auditoría y Despliegue

**Estado de Auditoría:** APROBADO (25 Enero 2026)

## Certificación de Lógica
1.  **Precios:** Precios hardcoded en `subscriptionController` coinciden con el modelo ($29 worker, $99/$299 lawyer).
2.  **Privacidad:** "Legal Armor" activo. Datos sensibles de trabajadores están enmascarados hasta el pago.
3.  **Comisiones:** "El Puente" activo. Generación automática de facturas al detectar convenios.

## Guía de Despliegue Rápido
Para poner esto en producción:

1.  **Frontend (Android):**
    ```bash
    cd derechos-laborales-mx
    ./build_android.bat
    ```
    *Genera APK en `android/app/build/outputs/apk/release/`.*

2.  **Backend:**
    *   Requiere servidor Node.js (v18+).
    *   Variables de Entorno necesarias: `DATABASE_URL`, `STRIPE_SECRET_KEY`, `GROQ_API_KEY`.
    *   Comando: `npm run build && npm start`.

3.  **Base de Datos:**
    *   Ejecutar migraciones: `npx prisma migrate deploy`.

---

**Fin de la Documentación.**
