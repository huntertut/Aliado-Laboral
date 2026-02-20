# 03. Arquitectura Técnica: Escala y Estabilidad

**Stack Moderno:** Diseñado para velocidad de iteración y bajo costo operativo.

---

## 1. Stack Tecnológico

### A. Frontend (Móvil)
*   **Framework:** **Expo SDK 52** (React Native 0.76).
    *   *Ventaja:* Actualizaciones OTA (Over-the-Air) sin pasar por revisión de tiendas.
*   **Navegación:** `React Navigation 7` (Stack + Tabs).
*   **Estado:** `Context API` + `Zustand` (Ligero y rápido).
*   **UI:** `StyleSheet` nativo + `Lucide Icons`.

### B. Backend (API)
*   **Runtime:** **Node.js v20** (LTS).
*   **Framework:** `Express` (TypeScript).
*   **ORM:** `Prisma` (Type-safe database queries).
*   **Seguridad:** `Helmet`, `CORS`, `Rate Limiting`.

### C. Base de Datos
*   **Motor:** **SQLite** (Producción).
    *   *Por qué:* Cero latencia, backup simple (archivo único), ideal para el volumen actual.
    *   *Migración Futura:* PostgreSQL (cuando superemos 1M de registros).
*   **Ubicación:** Volumen persistente en Digital Ocean Droplet.

### D. Inteligencia Artificial (El Cerebro)
*   **Modelo:** **Llama 3-70b** (vía Groq API).
    *   *Velocidad:* Respuestas en <800ms.
    *   *Costo:* ~10x más barato que GPT-4.
*   **Funciones:**
    *   Análisis de sentimiento (Detección de acoso).
    *   Clasificación de casos (HOT / COLECTIVO).
    *   Generación de resúmenes legales.

---

## 2. Infraestructura Cloud

*   **Proveedor:** **Digital Ocean**.
*   **Servidor:** Droplet (Ubuntu 22.04 LTS).
*   **Containerización:** **Docker Compose**.
    *   Servicio `app`: Backend Node.js.
    *   Servicio `nginx`: Proxy Inverso + SSL (Certbot).
*   **CI/CD:** Scripts de despliegue automatizado (`deploy.sh`).
*   **Monitoreo:** Logs en tiempo real (`docker logs -f`).

---

## 3. Diagrama de Flujo de Datos

1.  **Usuario (App):** Envía audio/texto ->
2.  **API (Nginx -> Node):** Valida Token (Auth Middleware) ->
3.  **Controller:** Llama a `Groq AI` para análisis ->
4.  **Database:** Guarda el `LegalCase` y la respuesta ->
5.  **Notificación:** Dispara `FCM` al Abogado adecuado ->
6.  **Respuesta:** El usuario recibe la alerta en <2s.

---

[Siguiente: Módulos del Sistema](./04_MODULOS_SISTEMA.md)
