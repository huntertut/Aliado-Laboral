# 10. Changelog & Version History

All notable changes to the Aliado Laboral ecosystem (Mobile App, Backend, and Admin Web) are documented here.

---

## [v1.22.2] - 13 Mayo 2026 (UI Cleanup + Fixed OTA)

- **Fix (Mobile):** Eliminada duplicidad de título "Aliado Laboral" en el encabezado de `HomeScreen.tsx`.
- **Fix (Mobile):** Corregida lógica de saludo para evitar redundancia con el nombre de la app.
- **Feature (Mobile):** Activada oficialmente la calculadora desplegable en el Home mediante el despliegue del código local pendiente.
- **Cleanup:** Limpieza masiva de 70 cambios pendientes y eliminación de scripts temporales del historial de Git.
- **OTA:** Despliegue forzado al canal `production`.

## [v1.22.1] - 11 Mayo 2026 (OTA Activado + Push Noticias)

- **Fix (Critical / Mobile):** Activadas actualizaciones OTA en `AndroidManifest.xml`. El flag `ENABLED` estaba en `false`. Ahora configurado con URL de EAS, canal `production`, y espera de 3s al arrancar.
- **Fix (Mobile):** Agregada sección `updates` a `app.json` con URL de EAS Update y `checkAutomatically: ON_LOAD`.
- **Fix (Backend / Notifications):** `newsController.ts` ahora envía push notification a todos los usuarios con token registrado al publicar una noticia manualmente desde el panel de admin. Antes solo el scheduler automático (RSS) enviaba notificaciones.
- **Build:** Android AAB `versionCode 55`, `versionName 1.22.0`. Subir a Google Play Console → **Producción**.

> ⚠️ **REGLA OTA:** Nunca ejecutar `npx expo prebuild --clean` en producción sin revisar que el `AndroidManifest.xml` conserve `ENABLED=true` y la URL de EAS. El `--clean` regenera el manifiesto desde cero y borra la configuración OTA.

---


### 🚨 INCIDENTE CRÍTICO RESUELTO — Raíz del problema
Se identificó que el servidor de producción estaba usando la **base de datos incorrecta**. El `.env` apuntaba a `file:./dev.db` (copia incompleta en la raíz del backend), mientras que la DB real con todas las tablas y datos vive en `prisma/dev.db`. Esto causaba que **todos** los queries de Prisma fallaran con P2022 o errores de apertura de archivo.

- **Fix (Critical / DevOps):** `DATABASE_URL` corregida a ruta absoluta `file:/root/Aliado-Laboral/backend/prisma/dev.db` en producción.
- **Fix (Critical / Backend):** Restablecida contraseña de admin (`admin@test.com`) que se desincronizó durante las migraciones.
- **Fix (Backend / Auth):** Corregido `socialLogin` en `authController.ts` para crear correctamente los registros de `Lawyer` con status `PENDING` al registrarse como abogado desde la app.
- **Fix (Backend / Admin):** Corregida función `updateUserSubscription` para no usar `LawyerSubscription` de forma redundante — ahora actualiza directamente los campos en el modelo `Lawyer`.
- **Fix (Backend / Sync):** Reescrita función `syncFirebaseLawyers` completamente. Ya **no** importa usuarios de Firebase por rol desconocido. Ahora solo repara abogados que ya existen en la DB pero les falta su registro en la tabla `Lawyer`.
- **Fix (Critical / Auth):** Reparado un bug en `verifyFirebaseToken` donde la app móvil cargaba el rol del usuario desde la tabla de mapeo desactualizada (`UserRole`) en lugar del modelo central `User`, lo que causaba que usuarios como `elmisamouse` aparecieran como abogados en la app pero como trabajadores en el panel web. Se corrigieron 19 registros afectados en producción.
- **Cleanup (DB):** Eliminados 19 registros de abogados falsos creados por la función de sync incorrecta. Todos los usuarios afectados fueron restaurados a su rol correcto (`worker`).
- **Fix (Admin Web):** Restaurado botón "Sincronizar Firebase" en `Users.tsx` que se perdió en un merge anterior.
- **Docs:** Añadido incidente #11 en `09_TROUBLESHOOTING.md` con procedimiento completo de recuperación.

---

## [v1.21.9] - May 2026 (Admin Consistency & Bugfix)
- **Fix (Admin / Data):** Corregida duplicidad de usuarios en pestañas de Abogados/Trabajadores mediante sincronización forzada de `User.role`.
- **Fix (Admin / Logic):** Implementada corrección automática de roles en `updateUserSubscription` (Gifts). Al asignar un plan, el sistema ahora asegura que el rol del usuario coincida con la categoría seleccionada.
- **Maintenance (Database):** Ejecutada limpieza SQL masiva para migrar abogados marcados como `worker` al rol correcto de `lawyer`.
- **Optimization (Sync):** Mejorado el script `syncFirebaseLawyers` para detectar abogados por nombre/título (`Lic.`, `Abog.`), reduciendo la pérdida de usuarios en la sincronización.

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

---

## [v1.21.1] - April 2026 (Phase 34 - Registration Outage, Sync & Gift Refinement)
- **Feature (Backend):** Evolución del sistema de recuperación `syncFirebaseLawyers` a `syncFirebaseUsers`. Ahora es universal y permite sincronizar Trabajadores y PyMEs desde Firebase hacia SQL, reparando registros huérfanos por errores de red.
- **Bugfix (Critical / Backend):** Implementación de lógica de auto-recuperación robusta en el Admin para usuarios que ya existen en Firebase pero fallaron en la persistencia inicial.
- **Fix (Admin UI):** Restored the individual "Gift Months" feature in `Users.tsx` which was accidentally omitted in the previous update.
- **Fix (Logic):** Resolved 404 errors in the gift flow by correctly mapping `userId` for lawyers and `id` for workers/pymes in the frontend API calls.
- **Documentation:** Added "Admin Panel Maintenance Rules" to `00_CONTEXT.md` to safeguard critical features (individual gifts, password toggles) against future regressions.
- **Maintenance (DevOps):** Creación del script `clean_production.sh` para la eliminación de procesos PM2 "rogue" (huerfanos) en el host y la regeneración forzada de Prisma Client en contenedores.

---

## [v1.21.0] - April 2026 (Logic Refactor & Security)
- **Feature (Calculator/Backend):** Overhauled `PymeService` with a robust LFT-compliant engine. Supports Salario Diario Integrado (SDI), the 15-year seniority rule, and dynamic/custom benefits (Aguinaldo, Vacations, Premium).
- **Feature (Mobile UI):** Refactored `CalculatorScreen.tsx` to handle anniversary cycles correctly and support custom labor parameters.
- **Maintenance (Security):** Performed a surgical purge of sensitive tokens and large binary artifacts from the entire Git history using `git-filter-branch` and manual index cleaning.
- **Bugfix (Admin):** Resolved 404/500 errors in the "Gift Months" flow by fixing ID role resolution. Restored password visibility toggle in the Login screen.
- **Bugfix (UI):** Fixed "The width(-1) and height(-1) of chart" error in the Admin Panel by providing explicit container constraints.

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
