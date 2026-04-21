# 10. Changelog & Version History

All notable changes to the Aliado Laboral ecosystem (Mobile App, Backend, and Admin Web) are documented here.

---

## [v1.21.4] - February 2026 (Admin Panel Fixes)
- **Bugfix (Admin Web):** Corregido error 404/500 al regalar meses o cupos desde el panel de usuarios. Ahora el sistema diferencia correctamente entre `userId` y `lawyerId`, y utiliza roles dinámicos según la pestaña activa.
- **Bugfix (Admin UI):** Corregido error de renderizado en gráficas de Recharts (`width(-1)`) mediante la inicialización forzada de dimensiones en `ResponsiveContainer`.

---

## [v1.21.3] - February 2026 (Premium Access & Vault Fixes)
- **Bugfix (Auth):** Se corrigió lógica en `AuthContext.tsx` donde el plan de trabajadores premium en modo demo se asignaba incorrectamente como `worker_premium` en lugar de `premium`, rompiendo las validaciones de UI.
- **Bugfix (UI):** Reparación de candados PRO en "Mi Kit Laboral" (`MyChestScreen.tsx`). Ahora las plantillas de CV y cartas detectan correctamente el estado premium del usuario.
- **Bugfix (Backend):** Resolución de error 500 en el endpoint de archivos del baúl (`vaultController.ts`). Se implementó ordenamiento en memoria para evitar la dependencia de índices compuestos faltantes en Firestore.
- **Bugfix (Backend):** Se relajaron los filtros públicos de abogados (`lawyerProfileController.ts`) para permitir que las cuentas de prueba aparezcan en las búsquedas iniciales (removiendo requisito obligatorio de 2 casos ganados).
- **Navigation:** Registro de pantallas faltantes (`LiquidationCalculator`, `GenerateAct`) en `AppNavigator.tsx`.

---

## [v1.21.2] - April 2026 (Emergency Production Recovery)
- **Bugfix (Critical / DevOps):** Resolución a caída total de los servicios (Caída de API 503, Panel Admin caído). El servidor de producción crasheaba silenciosamente debido a binarios nativos de \node_modules/bcrypt\ compilados en Windows. Se migró la arquitectura criptográfica a `bcryptjs` (JavaScript puro) en todos los scripts de backend garantizando la portabilidad del código.
- **DevOps:** Extracción forzada del backend de contenedores problemáticos en Podman hacia gestión nativa con PM2 sobre el host en Node 20.20.1 y 153MB RAM estables. Restauración manual del acceso super-admin. 

## [v1.21.1] - April 2026 (Phase 34 - Registration Outage & Sync)
- **Feature (Backend):** Evolución del sistema de recuperación `syncFirebaseLawyers` a `syncFirebaseUsers`. Ahora es universal y permite sincronizar Trabajadores y PyMEs desde Firebase hacia SQL, reparando registros huérfanos por errores de red.
- **Bugfix (Critical / Backend):** Implementación de lógica de auto-recuperación robusta en el Admin para usuarios que ya existen en Firebase pero fallaron en la persistencia inicial.
- **Maintenance (DevOps):** Creación del script `clean_production.sh` para la eliminación de procesos PM2 "rogue" (huerfanos) en el host y la regeneración forzada de Prisma Client en contenedores.

## [v1.21.0] - April 2026 (Phase 29 - Free Leads & App Icon)
- **Feature (Backend):** Sistema de cupo mensual de casos gratuitos para abogados con plan regalado. Se añadieron 3 campos al modelo `Lawyer` (`freeLeadsMonthly`, `freeLeadsUsed`, `freeLeadsResetAt`). El endpoint `POST /admin/lawyers/:id/free-leads-quota` permite asignar el cupo desde el panel admin.
- **Feature (Backend Logic):** `acceptContactRequest` ahora verifica el cupo mensual antes de cobrar via Stripe. Si el abogado tiene cupo disponible, el caso se acepta sin cargo ($0) y el contador se decrementa. Si el cupo se agotó, el flujo normal de Stripe continúa. El contador se resetea automáticamente cada 1° de mes.
- **Feature (Admin Web):** El panel "Regalar" fue modernizado (Modal Tailwind) reemplazando alertas web nativas. Ahora permite configurar simultáneamente el **tiempo PRO en meses** y el **cupo de casos gratuitos**. Esto ahora *también está habilitado para Trabajadores*, no solo para Abogados. Se añadió ícono de mostrar/ocultar ("ojito") en login administrativo.
- **UI & App Build (Mobile):** Renvoación del Logo Principal en el `ic_launcher` del sistema operativo Android con diseño fusionado en cian/magenta. Actualización del Gradle a `v1.21.0` (`versionCode 19`), y generación de paquete AAB firmado.
- **DevOps:** Migración SQLite aplicada directamente en producción vía SSH (`ALTER TABLE Lawyer ADD COLUMN`). 4 archivos subidos via SFTP. PM2 reiniciado exitosamente. Admin Web vite deploy actualizado vía zip+sh.

---

## [v1.20.7] - April 2026 (Phase 28 - Final)
- **Bugfix (Critical / Backend):** Implementación de "Parsing Defensivo" para fechas en `workerProfileController.ts`. Ahora el backend detecta y corrige automáticamente fechas en formato latino (DD/MM/YYYY) enviadas por la App, evitando el colapso de Prisma (Invalid Date Error 500).
- **Maintenance (DevOps):** Resolución de desajuste de binarios en DigitalOcean (`invalid ELF header`). Se forzó la reconstrucción nativa de `bcrypt` en el servidor y se corrigieron permisos de ejecución en `node_modules/.bin` para permitir la regeneración de Prisma.
- **Build (Mobile):** Generado **VersionCode 19 (v.1.20.7)**. Esta versión incluye alertas de diagnóstico extendidas para interceptar errores de red y respuestas 502/500 con mayor claridad.

## [v1.20.6] - April 2026 (Phase 28)
- **Feature (Mobile UX):** Eliminación de textos estructurales temporales (ZONA 1, ZONA 2, ZONA 3) de la pantalla de inicio y redundancia de logotipos. Deshabilitado el Action Header nativo de React Navigation (`headerShown: false`) para erradicar el doble cintillo azul, ahorrando valioso espacio de pantalla.
- **Privacy Policy (Legal):** Inyectado interceptor de perfil en la Pantalla de Privacidad (`PrivacyPolicyScreen.tsx`); los usuarios logueados sólo visualizarán directamente la política aplicable a ellos (Trabajador, PyME, o Abogado).
- **Bugfix (Critical):** Solucionado error 500 al guardar perfiles de trabajadores enviando Strings Vacíos. Se añadió lógica 'Null Coalescing' en el JSON de Prisma en el backend (`workerProfileController.ts`) reparando envíos para el `monthlySalary`.
- **Bugfix (Critical):** Solucionado Crash `ReferenceError: Property 'TextInput' doesn't exist` que mataba la aplicación al ingresar al Foro Anónimo (producto de falta de importación en la Fase 25).
- **Build (Mobile):** Generado de urgencia `versionCode` 18 v.1.20.6 tras las purgas.

---

## [v1.20.5] - April 2026 (Phase 27)
- **Feature (Web Admin):** Adición de columnas 'Vencimiento' y 'Caso Activo' a los directorios de Abogados, Trabajadores y PyMEs para un mejor control del vencimiento de suscripciones y tickets en seguimiento.
- **Feature (Web Admin):** Inyección de un filtro reactivo en el Panel de Administración para ocultar de la lista a usuarios sin casos activos.
- **Security (Mobile App):** Eliminación total de código puente muerto (antiguos menús de Contador, Supervisor, y Admin) en la compilación nativa para reducir vectores de ingeniería inversa y peso del binario.
- **Build (Mobile):** Nuevo `versionCode` 17 y versión `1.20.5` para Google Play, con empaquetado optimizado del AAB.

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
