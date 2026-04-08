# 10. Changelog & Version History

All notable changes to the Aliado Laboral ecosystem (Mobile App, Backend, and Admin Web) are documented here.

---

## [v1.20.4] - April 2026 (Phase 24, 25 & 26)
- **Feature (Mobile Forum):** Evolución del foro anónimo hacia una Bóveda de Glosario permanente. Eliminación de la extinción de posteos en 7 días y adición de un buscador de texto completo en la app para explorar dudas históricas.
- **Feature (AI Integration):** Se actualizó el motor LLM (Groq / Llama 3.1) inyectando JWT directamente desde el middleware para permitir que los bots saluden y procesen datos usando el nombre real de los usuarios, generando respuestas profesionales y empáticas.
- **Feature (Documents):** Refactor de generación de documentos dinámicos (Contratos, Renuncias, Actas Administrativas) optimizando la integración.
- **Feature (Web Admin):** Inyección del módulo "Regalar Meses" de forma directa y nativa en el panel VITE Web, permitiendo extender suscripciones PRO a abogados con sistema de alertas prompt.
- **UX/Bugfix (Web Admin):** Integración de mecanismos de resiliencia de sesión: ahora cuando el JWT token expira (401 Unauthorized), la web no se vacía ni muestra listas vacías, sino que dispara modal y expulsa al usuario (auto-logout) elegantemente. Adicionado un botón 'Refresh' manual cerca a la barra de búsqueda.
- **Build:** Actualización masiva de `versionCode` a 16 y version `1.20.4` debido al desfase de binarios Play Store. Nuevos APK/AAB generados.

---

## [v1.20.3] - April 2026 (Phase 22 & 23)
- **Feature (Admin/Mobile):** Creación del botón "Regalar Plan" en la interfaz de Administración desde el dispositivo móvil para extender hasta 1 o 3 meses a Abogados pioneros sin cobro de la mensualidad.
- **Maintenance:** Re-arquitectura del cronService para los envíos programados y noticias.
- **Build:** AAB Version Code 15 para Google Play.

---

## [v1.20.2] - April 2026 (Phase 21 UI Polish)
- **Feature (Mobile UX):** Implemented WelcomeScreen skip logic: Returning users are now routed directly to `LoginScreen` instead of `WelcomeScreen`, resolving a friction point.
- **Feature (Mobile UI):** Finalized `HomeScreen` UI redesign to exactly match the target mockup. Enhancements include cleaner header layout preserving the mini logo, centered hero text with PRO tags, a blue-purple glassmorphism gradient for the Calculator CTA, and explicit Zona labeling with frosted-glass card icons.
- **Maintenance (Mobile/Git):** Generated new AAB/APK upload with `versionCode` bumped to 13 due to Play Store collision.

---

## [v1.20.1] - April 2026 (Phase 20 Hotfix)
- **Bugfix (Critical / Mobile):** Resolved fatal blank screen crash on all Android devices. Root cause: `react-native-url-polyfill/auto` was imported globally in `index.js`, causing `react-native-readable-stream` (its dependency) to initialize before Hermes had loaded the `StyleSheet` module, throwing `ReferenceError: Property 'StyleSheet' doesn't exist`. Fix: removed the import from `index.js`. The polyfill was confirmed to be unused anywhere in user source code. New Android AAB generated with `versionCode` 10.

---

## [v1.20.0] - March 2026 (Phase 18 & 19)

- **Feature (Mobile UI):** Rediseño completo de la Pantalla de Inicio (Action Dashboard). Nueva interfaz orientada a la conversión con Zonas (Gancho Calculadora, Grid 2x2 tonos pastel, Menú horizontal de apoyo).
- **Maintenance (Mobile):** Incremented Android `versionCode` from 6 to 7 to resolve Google Play Console upload collisions. Generated new `.AAB` bundle.
- **Feature (Payments):** Implementación de Webhooks de Stripe como fuente única de verdad para la validación de pagos, garantizando idempotencia y eliminando la dependencia de confirmaciones del frontend. Añadidos modelos `Payment` y `StripeEvent`.
- **Feature (Sync):** Implemented the Firebase-to-PostgreSQL Lawyer Registration Sync. Lawyers registering via the app are automatically stubbed in the DB as "PENDING".
- **Feature (UX):** Added a native 48-hour SLA alert to the `RegisterScreen.tsx` para registering lawyers.
- **Feature (Admin):** Added a dynamic red notification badge to the "Usuarios" tab in `AdminLayout.tsx` and a manual `/admin/lawyers/sync-firebase` recovery endpoint.
- **Maintenance:** Completely reorganized the `C:\dev\aliado-laboral\documentation` folder into a standardized 11-file markdown structure, migrating 25 legacy assets to the `/legacy` fallback directory.

---

## [v1.19.1] - March 2026 (Phase 12 & 13)
- **Bugfix (Critical):** Exterminated a rogue native `PM2` process on the DigitalOcean host that was hijacking port 3001 and causing stale database schema queries (Error 500).
- **Bugfix (PyME):** Patched a Prisma P2003 Foreign Key Constraint crash occurring when PyMEs registered with an empty `assignedLawyerId` string. Added Null Coalescing fallback in `authController.ts`.

---

## [v1.19.0] - March 2026 (Phase 10 & 11)
- **Feature (Security):** Hardened the Admin Dashboard. Migrated from hardcoded passwords to standard `Bcrypt` hashing in the database. Added a password reset UI in Settings.
- **Feature (Calendar):** Improved the Dynamic Promotions Engine by calculating automatic "Free Trial Days" based on explicit `startDate` and `endDate` intervals.
- **Maintenance (Host):** Sent a `nohup` keep-alive pulse to the CentOS host to stabilize the Node runtime.
- **UI/UX:** Overhauled Admin UI with high-resolution brand logos and a unified sidebar structure.

---

## [v1.18.0] - March 2026 (Phase 8 & 9)
- **Feature (Marketing):** Engineered the Advanced Promotions Engine. Replaced a simple toggle switch with a full CRUD system (`Promotion` table) capable of segmenting discounts by target role (Worker vs. Lawyer).
- **Feature (Audit):** Added a new Security Log system (`SecurityLog`) tracking failed login attempts into the Admin Panel.
- **UX Fix:** Disabled mobile native `autoCapitalize` and `autoCorrect` on custom password input fields, effectively solving the "Passwords do not match" bug reported by QA testers involving trailing spaces and special characters.
