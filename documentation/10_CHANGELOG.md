# 10. Changelog & Version History

All notable changes to the Aliado Laboral ecosystem (Mobile App, Backend, and Admin Web) are documented here.

---

**Último versionCode en Producción: 84 (v1.23.21) — 22 Junio 2026**

## [v1.23.22] - 22 Junio 2026 (Build 85/86: Fallback Stripe y Modales Premium Abogado)

- **Fix Crítico (Backend):** Implementado un "fallback" de validación manual en tiempo real de Stripe en `acceptContactRequest` (usando `stripeService.retrievePaymentIntent`). Esto resuelve el problema en el que el webhook de Stripe no llegaba/fallaba al Droplet y la solicitud quedaba bloqueada indefinidamente como no pagada por el trabajador.
- **Fix Crítico (Backend/Stripe):** Corregido error en el cobro automático del abogado en `acceptContactRequest`. Ahora se fuerzan los parámetros `confirm: true` y `off_session: true` usando la tarjeta guardada del abogado. En entornos de prueba (Stripe Test Mode), si el abogado no tiene tarjeta registrada, se simula éxito para no bloquear las pruebas del flujo.
- **Mejora Crítica (Mobile):** Reemplazadas las alertas nativas `Alert.alert` del flujo de aceptar/rechazar en `LawyerRequestDetailScreen.tsx` por **Modales Premium** personalizados. Estos modales muestran información estructurada de costos y soportan mostrar los errores reales del backend.
- **Fix (Mobile/UI):** Se eliminó el texto que indicaba el cobro de $50 pesos al trabajador en el modal de confirmación del abogado, manteniendo la privacidad de dicho cobro.
- **Fix (Mobile/Config):** Corregido formateo de query string en endpoints de API en `LawyerRequestsScreen.tsx` y `api.ts`.

## [v1.23.21] - 22 Junio 2026 (Build 84: Fix Imports, Modal Pago y Notificaciones Persistentes)

- **Fix Crítico (Mobile/CI):** Corregida ruta de import de `AppTheme` en `WorkerProfile.tsx` (`../../../` → `../../../../theme/colors`). Era la causa raíz de todos los fallos de build 83 y las primeras dos tentativas de build 84.
- **Fix Build (CI/CD):** `build.gradle` tenía `versionCode` hardcodeado en 83. Ahora sincronizado con `app.json` (versionCode 84, versionName 1.23.21). Agregado `frontend/android/**` a triggers del workflow.
- **Fix Crítico (Mobile):** Corregida la pantalla en blanco al hacer pago con Stripe en `ContactPaymentModal.tsx`. El spinner ya no bloquea el modal antes del Payment Sheet.
- **Fix Crítico (Mobile):** Corregido `MyContactRequestsScreen.tsx` que nunca cargaba datos (faltaba `useEffect` inicial con `fetchRequests()`).
- **Mejora (Mobile):** Notificaciones push ahora persisten como WhatsApp/Facebook. El `pushToken` se guarda en `AsyncStorage` al registrarse y NO se elimina al hacer logout. El backend puede seguir enviando notificaciones al dispositivo aunque el usuario esté deslogueado.

## [v1.23.20] - 18 Junio 2026 (Build 83: UI Éxito de Pago Nativa y Acceso a Mis Solicitudes)

- **Fix UI (Mobile):** Reemplazada la alerta nativa y el retorno nulo por una pantalla/tarjeta de éxito nativa (`step === 'success'`) dentro del modal `ContactPaymentModal.tsx` con un botón "Entendido" que maneja la navegación. Esto corrige definitivamente el error de pantalla en blanco/transparente atascada tras el pago de Stripe.
- **Feature (Mobile):** Agregado acceso directo a "Mis Solicitudes" (pantalla `MyContactRequestsScreen`) en la lista de acciones rápidas de la pantalla de inicio (`HomeScreen.tsx`) y en el perfil del trabajador (`WorkerProfile.tsx`).
- **Validación de Push:** Se probó y verificó con éxito el envío de notificaciones push de solicitudes al abogado Samuel en la base de datos de producción desde el droplet de backend.

## [v1.23.19] - 17 Junio 2026 (Build 82: Integración de Stripe Payment Sheet y Alerta de Notificación de Solicitudes)

- **Feature Crítica (Mobile):** Se integró el SDK nativo de Stripe (`@stripe/stripe-react-native`) en `ContactPaymentModal.tsx` mediante `initPaymentSheet` y `presentPaymentSheet` para recolectar de forma real y segura los datos de pago con tarjeta del trabajador.
- **Fix UI (Mobile):** Añadido retorno temprano nulo en el modal `ContactPaymentModal` al completarse el pago con éxito (estado `'success'`), previniendo que la UI de la app se quede bloqueada en un spinner infinito después de pagar.
- **Notificaciones (Backend):** Implementado el helper `notifyLawyerNewRequest` en `webhookHandlerService.ts` para notificar mediante push notification al abogado asignado en cuanto el trabajador finaliza el pago y se crea la solicitud (procesado vía webhooks de Stripe/MercadoPago).

## [v1.23.18] - 17 Junio 2026 (Build 81: End-to-End Case Push Notifications & Contact Flow Fix)

- **Fix Crítico (Mobile):** Corregida la navegación del directorio de abogados (`LawyersScreen.tsx`) que antes apuntaba a la pantalla estática mock `LawyerDetailScreen` (con botón de simulación roto). Ahora apunta correctamente a la pantalla real de base de datos `LawyerPublicProfileScreen`.
- **Integración (Mobile):** Se registraron `LawyerPublicProfileScreen` y `MyContactRequestsScreen` en el `AppNavigator.tsx` principal.
- **Flujo de Pago y IA (Mobile):** Se integró el modal `ContactPaymentModal` en la pantalla de redacción de caso `CreateContactRequestScreen.tsx`. Al enviar, se procesan los adjuntos a base64, se realiza el cobro del lead de $50 pesos (Stripe/MP) y se crea la solicitud real en el servidor.
- **Notificaciones (Backend):** Implementado el envío de notificaciones push al trabajador en tiempo real ante eventos críticos del caso:
  - Cuando el abogado acepta la solicitud de contacto (`✅ ¡Caso Aceptado!`).
  - Cuando el abogado rechaza la solicitud de contacto (`❌ Solicitud No Aceptada`).
  - Cuando el abogado cambia el estado en el CRM (`🤝 Fase de Negociación` / `🏆 ¡Caso Ganado/Conciliado!`).

## [v1.23.17] - 15 Junio 2026 (Build 80: Firebase Initialized + FCM Push Notifications)

- **Fix Crítico (Mobile):** Resuelto el crash inmediato en Android `Default FirebaseApp is not initialized` al agregar el archivo `google-services.json` a la ruta nativa `frontend/android/app/` y configurarlo en Git (eliminándolo del `.gitignore` para permitir que EAS Build compile con él).
- **Notificaciones (Mobile):** El build 80 incluye el permiso `POST_NOTIFICATIONS` nativo en el manifiesto y el plugin de Google Services en Gradle para inicializar FCM correctamente.
- **Registro de Token Exitoso:** Se validó que el dispositivo del usuario (Huawei Nova 12i) ahora puede registrar y guardar exitosamente su `ExponentPushToken` en el backend al iniciar sesión.
- **EAS Build Optimization:** Implementada una lista de verificación obligatoria para prevenir la duplicación de builds y consumo innecesario del plan gratuito de Expo.

## [SSL Hotfix] - 3 Junio 2026 (Certificado SSL Renovado y Auto-renovación automatizada)

- **Fix (DevOps):** Corregido el "Network Error" en la app móvil mediante la renovación del certificado SSL para `api.cibertmx.org` que había expirado el 1 de junio.
- **Procedimiento:** Detención temporal de Apache, renovación con Certbot y reinicio con `apachectl`.
- **Automatización:** Configurado un script de renovación en `/root/renew-api-ssl.sh` y agregado al cron de root para ejecutarse automáticamente el 1 y 15 de cada mes a las 3:00 AM.

## [Backend Hotfix] - 26 Mayo 2026 (Suscripción Abogado siempre "Inactiva")

### Causa Raíz (3 bugs encadenados)

**Bug 1 — Admin Gift no escribía en la tabla correcta:**
El endpoint `PUT /api/admin/users/:userId/subscription` actualizaba `Lawyer.subscriptionStatus` y `Lawyer.subscriptionEndDate`, pero la app móvil lee de la tabla separada `LawyerSubscription`. El Gift nunca creaba/actualizaba el registro en `LawyerSubscription`.
- **Fix:** `adminController.ts` → `updateUserSubscription()` ahora hace upsert en `LawyerSubscription` además de actualizar `Lawyer`.

**Bug 2 — Dashboard crasheaba silenciosamente por `LawyerProfile` inexistente:**
Los abogados creados via Admin o Firebase Sync solo tienen registro `Lawyer`, sin `LawyerProfile` (tabla separada para bio, foto, métricas). El endpoint `GET /api/lawyer-profile/my-metrics` devolvía **404** si faltaba `LawyerProfile`. El `LawyerDashboardScreen` hacía early return al detectar el error, nunca llamaba a `/subscription/status`, y el estado quedaba como `null` → mostraba "Inactiva".
- **Fix:** `lawyerProfileController.ts` → `getMyMetrics()` ahora **auto-crea** el `LawyerProfile` si no existe y devuelve métricas vacías (0) en lugar de 404.

**Bug 3 — LawyerProfile faltante en producción para abogados existentes:**
Los abogados ya registrados (lic.samuel y potencialmente otros) no tenían `LawyerProfile`. Se creó el registro directamente en la DB de producción via SQLite.
- **Fix:** Insert directo en producción. El Bug 2 previene que esto vuelva a ocurrir para cualquier abogado nuevo.

### Archivos modificados
- `backend/src/controllers/adminController.ts` — `updateUserSubscription()`
- `backend/src/controllers/lawyerProfileController.ts` — `getMyMetrics()`

### Regla permanente
> ⚠️ Toda operación de Admin sobre abogados debe siempre actualizar TANTO la tabla `Lawyer` como `LawyerSubscription`. Son tablas distintas con roles distintos.

---

## [v1.23.16] - 26 Mayo 2026 (Build 76: Expo SDK 53 / React Native 0.79.6 — Fix definitivo 16KB)

- **Fix Crítico (Mobile):** Upgrade completo a **Expo SDK 53** y **React Native 0.79.6** para resolver de forma definitiva el error de Google Play "Tu aplicación no admite tamaños de página de memoria de 16 kB".
- **Por qué esto resuelve el problema:** Los binarios precompilados de Hermes y React Native en SDK 53 se distribuyeron por primera vez con alineación de 16KB, que es lo que Android 15 requiere. Los intentos anteriores de flags de CMake (`-Wl,-z,max-page-size=16384`) no funcionaban porque esos flags solo aplican a código compilado localmente, no a los `.so` precompilados de npm.
- **Upgrade (Mobile):** React actualizado a v19.0.0, compatible con RN 0.79.6.
- **Upgrade (Mobile):** Todas las dependencias nativas actualizadas a versiones compatibles con SDK 53 (`expo install --fix`).
- **Maintenance (Mobile):** versionCode 76, versionName 1.23.16, runtimeVersion 1.23.16.
- **⚠️ Regla permanente:** No bajar de Expo SDK 53 en ninguna versión futura.

## [v1.23.14] - 18 Mayo 2026 (Build 72: React Native 0.77.3 — NOTA: 16KB NO resuelto)

- **Upgrade (Mobile):** Actualizado React Native a v0.77.3 y Expo a SDK 52 (v52.0.25) para obtener compatibilidad y soporte nativo de alineación a 16KB exigido por Google Play para Android 15.
- **Fix (Mobile):** Configurada la alineación de página a 16KB mediante `useLegacyPackaging false` en `build.gradle` y `gradle.properties`.
- **Maintenance (Mobile):** Sincronización de `versionCode` a 72 y `versionName` a 1.23.14 en `app.json` y `build.gradle`.

## [v1.23.2] - 16 Mayo 2026 (Fix 16KB Alignment Corrected)

- **Fix (Critical / Mobile):** Corregido el error de alineación de 16KB. Se cambió `useLegacyPackaging` a `false` para permitir que el Android Gradle Plugin alinee correctamente las librerías nativas no comprimidas, cumpliendo con los requisitos de Android 15.
- **Maintenance (Mobile):** Sincronización de `versionCode` a 59 y `versionName` a 1.23.2.

## [v1.23.0] - 13 Mayo 2026 (Fix 16KB Alignment + Build 57)

- **Fix (Critical / Mobile):** Resuelto error de "16KB page alignment" exigido por Google Play para Android 15.
- **Maintenance (Mobile):** Sincronización de `versionCode` a 58 en `app.json` y `build.gradle` (v1.23.1).
- **Maintenance (Mobile):** Sincronización de `versionName` y `runtimeVersion` a 1.23.0.

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
