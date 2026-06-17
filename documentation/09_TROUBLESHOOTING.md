# 09. Troubleshooting & Known Issues

This document registers critical incidents and their established resolution procedures to prevent debugging loops in production.

---

## 0. Abogado siempre aparece como "Suscripción Inactiva" en la app

**Síntoma:**
El abogado aparece como "Inactivo" en la app móvil (dashboard muestra `Suscripción Inactiva` en rojo) aunque en el Admin Web figure como "Suscrito" y con fecha de vencimiento futura.

**Causa Raíz:** Son 3 bugs encadenados en el backend.

### Árbol de diagnóstico

```
App muestra "Inactiva"
│
├─► LawyerDashboardScreen llama a /my-metrics PRIMERO
│       │
│       ├─ Si /my-metrics responde 404 → early return → NUNCA llama a /subscription/status
│       │    Causa: el abogado no tiene LawyerProfile (tabla separada de Lawyer)
│       │    Fix: getMyMetrics() auto-crea LawyerProfile si no existe
│       │
│       └─ Si /my-metrics responde 200 → llama a /subscription/status
│               │
│               └─ Si LawyerSubscription no existe o status ≠ 'active' → hasSubscription: false
│                    Causa: el Admin Gift solo actualizaba Lawyer, no LawyerSubscription
│                    Fix: updateUserSubscription() hace upsert en LawyerSubscription
```

### Cómo verificar el estado en producción

```bash
# SSH al servidor
ssh root@142.93.186.75

# Verificar las 3 tablas relevantes para un abogado por email
sqlite3 /root/Aliado-Laboral/backend/prisma/dev.db "
SELECT
  u.email,
  l.subscriptionStatus AS lawyer_status,
  datetime(l.subscriptionEndDate/1000,'unixepoch') AS lawyer_end,
  lp.id AS lawyerProfile_exists,
  ls.status AS lawyerSub_status,
  datetime(ls.endDate/1000,'unixepoch') AS lawyerSub_end
FROM User u
JOIN Lawyer l ON l.userId = u.id
LEFT JOIN LawyerProfile lp ON lp.lawyerId = l.id
LEFT JOIN LawyerSubscription ls ON ls.lawyerId = l.id
WHERE u.email LIKE '%samuel%';"
```

**Resultado esperado (todo OK):**
- `lawyerProfile_exists` → debe tener un ID (no vacío)
- `lawyerSub_status` → `active`
- `lawyerSub_end` → fecha futura

### Fix manual si LawyerProfile no existe

```bash
sqlite3 /root/Aliado-Laboral/backend/prisma/dev.db "
INSERT INTO LawyerProfile (id, lawyerId, profileViews, successRate, totalCases, successfulCases, reputationScore, lifetimeCommissionSavings, createdAt, updatedAt)
SELECT
  lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
  id, 0, 0.0, 0, 0, 0, 0.0, datetime('now'), datetime('now')
FROM Lawyer WHERE id = '<LAWYER_ID>'
AND NOT EXISTS (SELECT 1 FROM LawyerProfile WHERE lawyerId = '<LAWYER_ID>');"
```

### Reglas permanentes para evitar recurrencia

> ⚠️ **CRÍTICO:** El sistema usa 3 tablas distintas para abogados:
> - `Lawyer` — estado base (subscriptionStatus, subscriptionEndDate)
> - `LawyerSubscription` — lo que lee la app móvil via `/subscription/status`
> - `LawyerProfile` — métricas, foto, bio (requerido para que el dashboard funcione)
>
> Toda operación de Admin que active/desactive suscripción DEBE actualizar `Lawyer` Y `LawyerSubscription`.

---

## 1. Production Backend: The "Rogue PM2" Incident (Error 500)
**Symptom:**
The backend API intermittently returns `503 Service Unavailable` or `500 Internal Server Error`, specifically on the `/promotions` and `/api/health` endpoints, even right after a fresh Docker deployment.

**Cause:**
DigitalOcean droplet was previously configured using a CWP (CentOS Web Panel) setup that left a native instance of **PM2** running directly on the host OS (`pm2 list` showed `aliado-api`). This native process hijacked port 3001, effectively bypassing the Docker containers and running stale code against the production database, causing Prisma schema mismatches.

**Resolution:**
Host-level Node/PM2 processes must be strictly exterminated.
```bash
# SSH into the host
pm2 delete aliado-api
pm2 save
# Restart Docker
cd /root/Aliado-Laboral/backend
docker-compose down && docker-compose up -d
```

---

## 2. Mobile App: PyME Registration Crash (Prisma P2003)
**Symptom:**
Registering a PyME from the mobile app causes the server to silently crash with a 500 status.

**Cause:**
The mobile frontend sends the optional `assignedLawyerId` payload as an empty string `""` instead of `null`. Prisma treats `""` as a literal ID, attempting to link the PyME to a non-existent lawyer, violating the foreign key constraint (Error P2003).

**Resolution:**
Fixed in `authController.ts` using Null Coalescing:
```typescript
assignedLawyerId: assignedLawyerId || null
```

---

## 3. Expo Mobile Build: "Autolinking Settings Not Found"
**Symptom:**
Running `npm run android` fails immediately with `Plugin [id: 'expo-autolinking-settings'] was not found in any of the following sources`.

**Cause:**
Corruption in the `node_modules/expo-modules-autolinking` package due to mismatched SDK 52 versions.

**Resolution:**
Do not manually edit `settings.gradle`. Force a clean prebuild:
```bash
rm -rf node_modules
npm install
npx expo prebuild --platform android --clean
npm run android
```

---

## 4. HTTPS/SSL CWP Proxy Errors
**Symptom:**
The API is unreachable via HTTPS, returning a generic Nginx 404 from CentOS Web Panel.

**Cause:**
Nginx configuration within CWP defaults to routing traffic to `/var/www/html` instead of reverse-proxying port 3001.

**Resolution:**
Ensure the Nginx `vhost` configuration file (`/etc/nginx/conf.d/vhosts/api.cibertmx.org.conf`) includes the proper proxy pass block:
```nginx
location /api {
    proxy_pass http://127.0.0.1:3001;
    proxy_set_header Host $host;
}
```

---

## 5. Mobile App: "Property 'StyleSheet' doesn't exist" (Hermes Crash)
**Symptom:**
The release build (AAB/APK) installs correctly but crashes violently on startup with a white screen. Capturing logcat reveals:
`ReferenceError: Property 'StyleSheet' doesn't exist, js engine: hermes`

**Cause:**
This is a **Hermes initialization order conflict**, usually triggered by a global polyfill imported at the very top of `index.js`. Libraries like `react-native-url-polyfill/auto` execute synchronously and force `react-native-readable-stream` to load before React Native's internal `FabricUIManager` or `StyleSheet` modules have fully initialized in the Hermes engine. 

**Resolution:**
Do **not** import aggressive global polyfills at the root of the app unless absolutely necessary.
`index.js`:
```js
// Remove this line to prevent circular dependency crashes on Android release builds
// import 'react-native-url-polyfill/auto'; 

import { AppRegistry } from 'react-native';
import App from './App';
AppRegistry.registerComponent('main', () => App);
```

---

## 6. Backend: Worker Profile Save Error (Prisma Invalid Date)
**Symptom:**
The mobile app returns `Error Backend: Error updating profile` or `Error Backend: Provided Date object is invalid` when saving the worker profile, even if no date was changed.

**Cause:**
Prisma's SQLite connector crashes if a `Date` object passed to it is invalid or if a string is not in ISO format. The mobile app sometimes leaks localized strings (e.g., `"25/11/2026"` - DD/MM/YYYY) into the `startDate` field. Native `new Date()` in NodeJS treats `25` as an invalid month, causing an `Invalid Date` crash.

**Resolution:**
Implemented defensive parsing in `workerProfileController.ts`. The backend now intercepts strings containing slashes and manually re-orders them to `YYYY-MM-DD` before attempting to create a Date object. If parsing still fails, it defaults to `null` to prevent a 500 error.

---

## 7. Deployment: "Invalid ELF Header" (bcrypt) & Permission Denied
**Symptom:**
After a fresh `git pull` and `npm install` on DigitalOcean, the API crashes on startup with:
`Error: .../bcrypt_lib.node: invalid ELF header` or `sh: npx prisma: Permission denied`.

**Cause:**
1. **Binary Mismatch:** `node_modules` containing Windows-compiled binaries were synced/pushed to the Linux server. Linux cannot execute Windows `.node` files.
2. **Permissions:** The `node_modules/.bin` directory lost execution bits during the file transfer or internal OS migration.

**Resolution:**
Execute a surgical rebuild on the server:
```bash
cd /root/Aliado-Laboral/backend
rm -rf node_modules
npm install --legacy-peer-deps
npm rebuild bcrypt --build-from-source
chmod -R 777 node_modules/.bin
npx prisma generate
npm run build
pm2 restart aliado-api
```

---

## 8. INCIDENT POST-MORTEM: Interrupción Total de Producción — Abril 2026 ⚠️ CRÍTICO

**Fecha:** 15–16 de Abril 2026 | **Duración:** ~24 horas | **Severidad:** CRÍTICO
**Afectados:** Panel de administración, API pública, OTA updates, registro en app móvil

### Causa Raíz
```
Error: /root/Aliado-Laboral/backend/node_modules/bcrypt/lib/binding/napi-v3/bcrypt_lib.node: invalid ELF header
```
El `node_modules/` compilado en **Windows** fue copiado al servidor **Linux**. Los binarios nativos de `bcrypt` no son portables — generan un ELF header inválido que hace crashear el proceso al iniciar.
Adicionalmente: el comando de Docker enmascaraba este crash, por lo que parecía "en línea" pero en realidad estaba inactivo.

### Solución Definitiva Aplicada
1. Migración total de `bcrypt` a `bcryptjs` (pura implementación en JavaScript, libre de binarios nativos).
2. Rebuild **nativo** en el servidor host:
   ```bash
   cd /root/Aliado-Laboral/backend
   pm2 stop all 2>/dev/null; pm2 delete all 2>/dev/null
   rm -rf node_modules
   npm install      # Compilación local en Linux
   npx prisma generate
   npx tsc
   pm2 start dist/index.js --name aliado-api
   ```

---

## 9. Backend: Vault File Fetch Error (Firestore Missing Index)
**Symptom:**
Fetching vault files (`GET /api/vault/files`) returns a `500 Internal Server Error`.

**Cause:**
The Firestore query used both a `.where('userId', '==', ...)` filter and an `.orderBy('uploadedAt', 'desc')` clause. Firestore requires a **composite index** for queries using multiple fields (equality + range/order). If the index is missing, the Firebase SDK throws an error that crashes the backend.

**Resolution:**
Instead of relying on a composite index that might be missing in some environments, the backend was updated in `vaultController.ts` to perform the filtering in Firestore but the **sorting in memory** using JavaScript's `.sort()`.

---

## 10. Admin Panel: Gift Months 500/404 Error (ID Mismatch)
**Symptom:**
In the Admin Web, trying to "Gift Months" to a lawyer causes an `AxiosError: 500`, and for workers/pymes it causes a `404`.

**Cause:**
1. **Lawyer ID vs User ID:** The frontend was incorrectly sending the `Lawyer.id` (UUID) to the `/admin/users/:userId/subscription` endpoint. Since that endpoint expects a Record from the `User` table, Prisma failed to find the user and crashed.
2. **Hardcoded Roles:** The frontend was hardcoding `role: 'lawyer'` for all users in the gift config logic.
3. **Ghost Call:** The frontend was unconditionally calling the lawyer-only `/free-leads-quota` endpoint for workers and pymes.

**Resolution:**
Simplified the logic in `admin-web/src/pages/Users.tsx` to:
- Capture both `userId` and `lawyerId` in the modal's state.
- Conditionally call `/free-leads-quota` ONLY for lawyers.
- Use the correct `User.id` for the subscription update.
- Dynamically set the `role` based on the active tab.
---

## 11. Backend: "Error code 14: Unable to open the database file" ⚠️ CRÍTICO

**Síntoma:**
El backend arranca correctamente (`pm2 status` muestra `online`), pero todas las peticiones de login y datos devuelven un error 500. Los logs de PM2 muestran:
```
Error querying the database: Error code 14: Unable to open the database file
```

**Causa:**
El archivo `.env` en producción usa una ruta **relativa** (`file:./dev.db` o `file:./prisma/dev.db`). Como PM2 ejecuta el proceso desde el directorio `dist/`, la ruta relativa se resuelve de forma incorrecta apuntando a un archivo inexistente.

La base de datos real vive en:
```
/root/Aliado-Laboral/backend/prisma/dev.db
```

**Resolución:**
Siempre usar la **ruta absoluta** en el `.env` de producción:
```bash
# SSH al servidor
sed -i 's|DATABASE_URL=.*|DATABASE_URL="file:/root/Aliado-Laboral/backend/prisma/dev.db"|g' /root/Aliado-Laboral/backend/.env
pm2 restart aliado-api
# Verificar con:
curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Veronica@2099"}'
# Debe devolver un token JWT
```

**⚠️ REGLA PERMANENTE:**
Nunca cambiar `DATABASE_URL` a una ruta relativa en producción. La ruta correcta y permanente es:
```
DATABASE_URL="file:/root/Aliado-Laboral/backend/prisma/dev.db"
```

**Archivos de DB en el servidor (referencia):**
- ✅ `/root/Aliado-Laboral/backend/prisma/dev.db` — DB de **PRODUCCIÓN REAL** con todos los datos
- ⚠️ `/root/Aliado-Laboral/backend/dev.db` — Copia incompleta/antigua, **NO USAR**
- 📦 `/root/Aliado-Laboral/backend/recovered_apr15.db` — Backup de Abril 2026, solo para recuperación

---
---

## 12. Mobile: OTA Updates no funcionan (ENABLED=false en AndroidManifest) ⚠️

**Síntoma:**
La app NO descarga actualizaciones automáticamente al arrancar, aunque se publiquen con `eas update`. La pantalla `OTAUpdateScreen.tsx` nunca detecta una actualización disponible.

**Causa:**
El `AndroidManifest.xml` tiene el meta-data de expo-updates con `android:value="false"`:
```xml
<!-- ❌ MAL — así estaba en producción -->
<meta-data android:name="expo.modules.updates.ENABLED" android:value="false"/>
```
Esto ocurre porque `npx expo prebuild --clean` regenera el manifiesto desde cero y lo deja desactivado. También faltaban la URL de EAS y el nombre del canal.

**Resolución — Configuración correcta y permanente:**
```xml
<!-- ✅ CORRECTO — lo que debe tener AndroidManifest.xml -->
<meta-data android:name="expo.modules.updates.ENABLED" android:value="true"/>
<meta-data android:name="expo.modules.updates.EXPO_UPDATE_URL" android:value="https://u.expo.dev/edbaa94d-8deb-4e42-9eae-b9d597dcf595"/>
<meta-data android:name="expo.modules.updates.EXPO_RUNTIME_VERSION" android:value="@string/expo_runtime_version"/>
<meta-data android:name="expo.modules.updates.EXPO_UPDATES_CHECK_ON_LAUNCH" android:value="ALWAYS"/>
<meta-data android:name="expo.modules.updates.EXPO_UPDATES_LAUNCH_WAIT_MS" android:value="3000"/>
<meta-data android:name="expo.modules.updates.EXPO_CHANNEL_NAME" android:value="production"/>
```

Y en `app.json`:
```json
"updates": {
  "url": "https://u.expo.dev/edbaa94d-8deb-4e42-9eae-b9d597dcf595",
  "enabled": true,
  "fallbackToCacheTimeout": 3000,
  "checkAutomatically": "ON_LOAD"
}
```

**⚠️ REGLA CRÍTICA:** Cada vez que se ejecute `npx expo prebuild --clean`, verificar inmediatamente que `AndroidManifest.xml` tenga `ENABLED=true` y todos los meta-data de updates antes de compilar el AAB.

**Importante sobre runtimeVersion y OTA:**
- Los OTA solo llegan a usuarios que tienen instalado un AAB con el mismo `runtimeVersion`.
- Si cambias `runtimeVersion` en `app.json`, los usuarios con versiones anteriores NO recibirán OTA hasta actualizar desde Play Store.
- Para publicar un OTA sin nuevo AAB: `eas update --channel production --runtime-version 1.22.0`

---

## 13. Mobile: "Version code ya existe" al subir a Google Play Production ⚠️

**Síntoma:**
Al intentar subir un nuevo AAB a Google Play Console (producción), rechaza el archivo con el error: *"El código de versión X ya existe"* o *"El código de versión debe ser mayor que Y"*.

**Causa:**
El `versionCode` en `build.gradle` y `app.json` no estaba sincronizado con el versionCode real de Google Play. La documentación local estaba desactualizada y no reflejaba el número actual en la consola de producción.

**Resolución:**
1. Antes de compilar cualquier AAB, verificar en **Google Play Console → Producción → Versiones** cuál es el último versionCode activo.
2. El nuevo AAB debe tener `versionCode = último_activo + 1`.
3. Actualizar SIEMPRE los dos archivos juntos:

```gradle
// frontend/android/app/build.gradle
versionCode 55   // ← último_en_play + 1
versionName "1.22.0"
```
```json
// frontend/app.json
"version": "1.22.0",
"runtimeVersion": "1.22.0",
"versionCode": 55
```
**Resolution:**
Implemented defensive parsing in `workerProfileController.ts`. The backend now intercepts strings containing slashes and manually re-orders them to `YYYY-MM-DD` before attempting to create a Date object. If parsing still fails, it defaults to `null` to prevent a 500 error.

---

## 7. Deployment: "Invalid ELF Header" (bcrypt) & Permission Denied
**Symptom:**
After a fresh `git pull` and `npm install` on DigitalOcean, the API crashes on startup with:
`Error: .../bcrypt_lib.node: invalid ELF header` or `sh: npx prisma: Permission denied`.

**Cause:**
1. **Binary Mismatch:** `node_modules` containing Windows-compiled binaries were synced/pushed to the Linux server. Linux cannot execute Windows `.node` files.
2. **Permissions:** The `node_modules/.bin` directory lost execution bits during the file transfer or internal OS migration.

**Resolution:**
Execute a surgical rebuild on the server:
```bash
cd /root/Aliado-Laboral/backend
rm -rf node_modules
npm install --legacy-peer-deps
npm rebuild bcrypt --build-from-source
chmod -R 777 node_modules/.bin
npx prisma generate
npm run build
pm2 restart aliado-api
```

---

## 8. INCIDENT POST-MORTEM: Interrupción Total de Producción — Abril 2026 ⚠️ CRÍTICO

**Fecha:** 15–16 de Abril 2026 | **Duración:** ~24 horas | **Severidad:** CRÍTICO
**Afectados:** Panel de administración, API pública, OTA updates, registro en app móvil

### Causa Raíz
```
Error: /root/Aliado-Laboral/backend/node_modules/bcrypt/lib/binding/napi-v3/bcrypt_lib.node: invalid ELF header
```
El `node_modules/` compilado en **Windows** fue copiado al servidor **Linux**. Los binarios nativos de `bcrypt` no son portables — generan un ELF header inválido que hace crashear el proceso al iniciar.
Adicionalmente: el comando de Docker enmascaraba este crash, por lo que parecía "en línea" pero en realidad estaba inactivo.

### Solución Definitiva Aplicada
1. Migración total de `bcrypt` a `bcryptjs` (pura implementación en JavaScript, libre de binarios nativos).
2. Rebuild **nativo** en el servidor host:
   ```bash
   cd /root/Aliado-Laboral/backend
   pm2 stop all 2>/dev/null; pm2 delete all 2>/dev/null
   rm -rf node_modules
   npm install      # Compilación local en Linux
   npx prisma generate
   npx tsc
   pm2 start dist/index.js --name aliado-api
   ```

---

## 9. Backend: Vault File Fetch Error (Firestore Missing Index)
**Symptom:**
Fetching vault files (`GET /api/vault/files`) returns a `500 Internal Server Error`.

**Cause:**
The Firestore query used both a `.where('userId', '==', ...)` filter and an `.orderBy('uploadedAt', 'desc')` clause. Firestore requires a **composite index** for queries using multiple fields (equality + range/order). If the index is missing, the Firebase SDK throws an error that crashes the backend.

**Resolution:**
Instead of relying on a composite index that might be missing in some environments, the backend was updated in `vaultController.ts` to perform the filtering in Firestore but the **sorting in memory** using JavaScript's `.sort()`.

---

## 10. Admin Panel: Gift Months 500/404 Error (ID Mismatch)
**Symptom:**
In the Admin Web, trying to "Gift Months" to a lawyer causes an `AxiosError: 500`, and for workers/pymes it causes a `404`.

**Cause:**
1. **Lawyer ID vs User ID:** The frontend was incorrectly sending the `Lawyer.id` (UUID) to the `/admin/users/:userId/subscription` endpoint. Since that endpoint expects a Record from the `User` table, Prisma failed to find the user and crashed.
2. **Hardcoded Roles:** The frontend was hardcoding `role: 'lawyer'` for all users in the gift config logic.
3. **Ghost Call:** The frontend was unconditionally calling the lawyer-only `/free-leads-quota` endpoint for workers and pymes.

**Resolution:**
Simplified the logic in `admin-web/src/pages/Users.tsx` to:
- Capture both `userId` and `lawyerId` in the modal's state.
- Conditionally call `/free-leads-quota` ONLY for lawyers.
- Use the correct `User.id` for the subscription update.
- Dynamically set the `role` based on the active tab.
---

## 11. Backend: "Error code 14: Unable to open the database file" ⚠️ CRÍTICO

**Síntoma:**
El backend arranca correctamente (`pm2 status` muestra `online`), pero todas las peticiones de login y datos devuelven un error 500. Los logs de PM2 muestran:
```
Error querying the database: Error code 14: Unable to open the database file
```

**Causa:**
El archivo `.env` en producción usa una ruta **relativa** (`file:./dev.db` o `file:./prisma/dev.db`). Como PM2 ejecuta el proceso desde el directorio `dist/`, la ruta relativa se resuelve de forma incorrecta apuntando a un archivo inexistente.

La base de datos real vive en:
```
/root/Aliado-Laboral/backend/prisma/dev.db
```

**Resolución:**
Siempre usar la **ruta absoluta** en el `.env` de producción:
```bash
# SSH al servidor
sed -i 's|DATABASE_URL=.*|DATABASE_URL="file:/root/Aliado-Laboral/backend/prisma/dev.db"|g' /root/Aliado-Laboral/backend/.env
pm2 restart aliado-api
# Verificar con:
curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Veronica@2099"}'
# Debe devolver un token JWT
```

**⚠️ REGLA PERMANENTE:**
Nunca cambiar `DATABASE_URL` a una ruta relativa en producción. La ruta correcta y permanente es:
```
DATABASE_URL="file:/root/Aliado-Laboral/backend/prisma/dev.db"
```

**Archivos de DB en el servidor (referencia):**
- ✅ `/root/Aliado-Laboral/backend/prisma/dev.db` — DB de **PRODUCCIÓN REAL** con todos los datos
- ⚠️ `/root/Aliado-Laboral/backend/dev.db` — Copia incompleta/antigua, **NO USAR**
- 📦 `/root/Aliado-Laboral/backend/recovered_apr15.db` — Backup de Abril 2026, solo para recuperación

---
---

## 12. Mobile: OTA Updates no funcionan (ENABLED=false en AndroidManifest) ⚠️

**Síntoma:**
La app NO descarga actualizaciones automáticamente al arrancar, aunque se publiquen con `eas update`. La pantalla `OTAUpdateScreen.tsx` nunca detecta una actualización disponible.

**Causa:**
El `AndroidManifest.xml` tiene el meta-data de expo-updates con `android:value="false"`:
```xml
<!-- ❌ MAL — así estaba en producción -->
<meta-data android:name="expo.modules.updates.ENABLED" android:value="false"/>
```
Esto ocurre porque `npx expo prebuild --clean` regenera el manifiesto desde cero y lo deja desactivado. También faltaban la URL de EAS y el nombre del canal.

**Resolución — Configuración correcta y permanente:**
```xml
<!-- ✅ CORRECTO — lo que debe tener AndroidManifest.xml -->
<meta-data android:name="expo.modules.updates.ENABLED" android:value="true"/>
<meta-data android:name="expo.modules.updates.EXPO_UPDATE_URL" android:value="https://u.expo.dev/edbaa94d-8deb-4e42-9eae-b9d597dcf595"/>
<meta-data android:name="expo.modules.updates.EXPO_RUNTIME_VERSION" android:value="@string/expo_runtime_version"/>
<meta-data android:name="expo.modules.updates.EXPO_UPDATES_CHECK_ON_LAUNCH" android:value="ALWAYS"/>
<meta-data android:name="expo.modules.updates.EXPO_UPDATES_LAUNCH_WAIT_MS" android:value="3000"/>
<meta-data android:name="expo.modules.updates.EXPO_CHANNEL_NAME" android:value="production"/>
```

Y en `app.json`:
```json
"updates": {
  "url": "https://u.expo.dev/edbaa94d-8deb-4e42-9eae-b9d597dcf595",
  "enabled": true,
  "fallbackToCacheTimeout": 3000,
  "checkAutomatically": "ON_LOAD"
}
```

**⚠️ REGLA CRÍTICA:** Cada vez que se ejecute `npx expo prebuild --clean`, verificar inmediatamente que `AndroidManifest.xml` tenga `ENABLED=true` y todos los meta-data de updates antes de compilar el AAB.

**Importante sobre runtimeVersion y OTA:**
- Los OTA solo llegan a usuarios que tienen instalado un AAB con el mismo `runtimeVersion`.
- Si cambias `runtimeVersion` en `app.json`, los usuarios con versiones anteriores NO recibirán OTA hasta actualizar desde Play Store.
- Para publicar un OTA sin nuevo AAB: `eas update --channel production --runtime-version 1.22.0`

---

## 13. Mobile: "Version code ya existe" al subir a Google Play Production ⚠️

**Síntoma:**
Al intentar subir un nuevo AAB a Google Play Console (producción), rechaza el archivo con el error: *"El código de versión X ya existe"* o *"El código de versión debe ser mayor que Y"*.

**Causa:**
El `versionCode` en `build.gradle` y `app.json` no estaba sincronizado con el versionCode real de Google Play. La documentación local estaba desactualizada y no reflejaba el número actual en la consola de producción.

**Resolución:**
1. Antes de compilar cualquier AAB, verificar en **Google Play Console → Producción → Versiones** cuál es el último versionCode activo.
2. El nuevo AAB debe tener `versionCode = último_activo + 1`.
3. Actualizar SIEMPRE los dos archivos juntos:

```gradle
// frontend/android/app/build.gradle
versionCode 55   // ← último_en_play + 1
versionName "1.22.0"
```
```json
// frontend/app.json
"version": "1.22.0",
"runtimeVersion": "1.22.0",
"versionCode": 55
```

**Historial de versionCodes en producción (mantener actualizado):**

| versionCode | versionName | Fecha | Notas |
|------------|-------------|-------|-------|
| 54 | 1.21.8 | 7 Mayo 2026 | Última versión antes de este fix |
| 55 | 1.22.0 | 11 Mayo 2026 | OTA activado + push noticias + estabilización DB |

> ⚠️ Actualizar esta tabla cada vez que se publique un nuevo AAB en producción.

---

## 14. Mobile: "Tu aplicación no admite tamaños de página de memoria de 16 kB" ⚠️ CRÍTICO

**Síntoma:**
Google Play Console rechaza el AAB con el error **"Tu aplicación no admite tamaños de página de memoria de 16 kB"** al intentar subir una nueva versión de producción.

**Causa raíz (confirmada con APK Analyzer de Android Studio):**
**NO** es un problema de flags de compilación. Es un problema de **binarios precompilados desactualizados**.

Los archivos `.so` que Google rechaza (`libhermes.so`, `libreactnative.so`, `libexpo-modules-core.so`, etc.) vienen precompilados dentro de los paquetes npm de React Native y Expo. Con Expo SDK 52 + RN 0.76/0.77, esos binarios estaban compilados con alineación de **4KB** (estándar anterior). Android 15 y Google Play exigen **16KB** a partir de noviembre 2025.

**Intentos que NO funcionan (documentados para no repetirlos):**
- ❌ Agregar `externalNativeBuild { cmake { cppFlags "-Wl,-z,max-page-size=16384" } }` — Solo afecta código C++ que compila el desarrollador, no los `.so` precompilados de npm.
- ❌ Cambiar `useLegacyPackaging` a `false` — Necesario pero no suficiente, no recompila los binarios.
- ❌ Forzar NDK r27/r28 en `build.gradle` — El NDK solo recompila código propio, no paquetes npm.

**Resolución definitiva — Upgrade a Expo SDK 53:**
```bash
# 1. Actualizar Expo SDK
npm install expo@~53.0.0 --legacy-peer-deps

# 2. Actualizar TODAS las dependencias a versiones compatibles con SDK 53
#    (Esto incluye React Native 0.79.6 y React 19, que traen binarios 16KB-alineados)
npx expo install --fix

# 3. Regenerar los archivos nativos de Android desde cero
npx expo prebuild --clean --platform android

# 4. IMPORTANTE: Restaurar manualmente la configuración de signing en
#    frontend/android/app/build.gradle (el prebuild --clean siempre la borra)
```

**Por qué SDK 53 sí funciona:**
Expo SDK 53 (con React Native 0.79.6) fue el primer SDK que distribuyó binarios precompilados de Hermes, JSI y los módulos nativos compilados con alineación de 16KB. Es la única forma de resolver el problema sin modificar código de terceros.

**Stack de producción validado (Mayo 2026):**
```json
{
  "expo": "~53.0.0",
  "react-native": "0.79.6",
  "react": "19.0.0"
}
```

**Tabla de versionCodes en producción:**

| versionCode | versionName | SDK | Fecha | Notas |
|-------------|-------------|-----|-------|-------|
| 54 | 1.21.8 | SDK 52 / RN 0.76 | 7 Mayo 2026 | Antes del fix 16KB |
| 55 | 1.22.0 | SDK 52 / RN 0.76 | 11 Mayo 2026 | OTA activado |
| 72 | 1.23.14 | SDK 52 / RN 0.77 | 18 Mayo 2026 | Build CI/CD |
| 76 | 1.23.16 | SDK 53 / RN 0.79.6 | 26 Mayo 2026 | **16KB fix definitivo** ✅ |

> ⚠️ **REGLA:** Para cualquier versión futura, mantener mínimo Expo SDK 53. NO bajar a SDK 52.

**Restaurar signing después de prebuild --clean:**
El prebuild siempre borra la configuración de release signing. Después de cada `prebuild --clean`, añadir manualmente en `frontend/android/app/build.gradle`:
```gradle
signingConfigs {
    release {
        storeFile file(System.getenv('KEYSTORE_PATH') ?: 'aliado-upload-key.jks')
        storePassword System.getenv('KEYSTORE_PASSWORD') ?: ''
        keyAlias System.getenv('KEY_ALIAS') ?: ''
        keyPassword System.getenv('KEY_PASSWORD') ?: ''
    }
}
// En buildTypes.release, cambiar signingConfig de 'debug' a 'release':
buildTypes {
    release {
        signingConfig signingConfigs.release
    }
}
```

---

## 15. EAS Build: Error de rutas Windows (CXX1102)
**Síntoma:**
La compilación de EAS falla en la fase `Configure project :expo-av` con el error: `[CXX1102] Location specified by ndk.dir (C:\android-sdk...) did not contain a valid NDK`.

**Causa:**
El archivo `local.properties` (que contiene rutas fijas de Windows) no estaba ignorado por Git y fue subido accidentalmente a la nube de Expo (Linux). Linux intentó buscar la unidad `C:\`.

**Resolución:**
Se agregó `android/local.properties` al `.gitignore` en la carpeta `frontend/`. El archivo nunca debe subirse al repositorio.

---

## 16. EAS Build: Error de npm ERESOLVE (Strict Peer Dependencies)
**Síntoma:**
EAS falla en el primer paso con `npm error ERESOLVE could not resolve... peer react-native@>=0.82.0 from react-native-screens`.

**Causa:**
La infraestructura de EAS usa npm v10+ en modo estricto, abortando ante conflictos de peer dependencies.

**Resolución:**
Se creó un archivo `.npmrc` en la carpeta `frontend/` con el contenido `legacy-peer-deps=true`.

---

## 17. HTTPS/SSL: Expiración del Certificado en api.cibertmx.org (Network Error)
**Síntoma:**
La aplicación móvil se queda en blanco o arroja de inmediato un error de conexión a la red (`Network Error`) al intentar hacer login u otras peticiones HTTP, mientras que el backend local del servidor funciona correctamente.

**Causa:**
El certificado SSL de Let's Encrypt para el subdominio de la API (`api.cibertmx.org`) expiró (ocurrió el 1 de Junio de 2026). Android bloquea estrictamente conexiones a endpoints HTTPS que tengan certificados inválidos o expirados.

**Resolución:**
1. Conectarse al servidor CentOS mediante SSH.
2. Detener temporalmente el servidor web Apache para liberar el puerto 80 (necesario para la validación de Certbot):
   ```bash
   systemctl stop httpd
   killall -9 httpd
   ```
3. Ejecutar la renovación del certificado con Certbot:
   ```bash
   certbot renew --cert-name api.cibertmx.org --quiet
   ```
4. Volver a arrancar Apache utilizando el comando nativo de CWP (no `systemctl start`):
   ```bash
   /usr/local/apache/bin/apachectl start
   ```

**Configuración de Auto-renovación Permanente:**
Se creó el script de automatización `/root/renew-api-ssl.sh` con el siguiente contenido:
```bash
#!/bin/bash
# Auto-renewal script for api.cibertmx.org SSL certificate
echo "[$(date)] Starting SSL renewal..."
systemctl stop httpd 2>/dev/null
killall -9 httpd 2>/dev/null
sleep 2
certbot renew --cert-name api.cibertmx.org --quiet
/usr/local/apache/bin/apachectl start
echo "[$(date)] SSL renewal complete."
```
Y se configuró una tarea programada en el `cron` del usuario root (`crontab -l`) para que corra el 1 y el 15 de cada mes a las 3:00 AM:
```cron
0 3 1,15 * * /root/renew-api-ssl.sh >> /var/log/ssl-renewal.log 2>&1
```

---

## 18. Mobile: Crash "Default FirebaseApp is not initialized" en Android (FCM / Push Notifications)
**Síntoma:**
La aplicación compila correctamente pero crashea inmediatamente después de iniciar sesión o al arrancar, mostrando en los logs/Alerts de diagnóstico nativos:
`Default FirebaseApp is not initialized in this process com.aliadolaboral.app. Make sure to call FirebaseApp.initializeApp(Context) first.`

**Causa:**
Se agregaron permisos y librerías para habilitar notificaciones push, pero la aplicación nativa de Android no estaba registrada en el proyecto de Firebase Console. Al no existir el archivo `google-services.json` dentro del directorio del módulo nativo (`frontend/android/app/`), el SDK de Firebase en Android no podía inicializarse en runtime.

**Resolución:**
1. Acceder a **Firebase Console** -> Tu Proyecto -> Configuración del Proyecto -> Pestaña **General**.
2. En la parte inferior, hacer clic en **Agregar app** -> Elegir **Android**.
3. Registrar el paquete exacto de la aplicación: `com.aliadolaboral.app`.
4. Descargar el archivo de configuración **`google-services.json`**.
5. Mover el archivo a la ruta nativa del proyecto:
   `c:\dev\aliado-laboral\frontend\android\app\google-services.json`
6. Asegurar que el plugin de servicios de Google esté configurado en `frontend/android/build.gradle` y `frontend/android/app/build.gradle`.
7. **IMPORTANTE:** Para que la compilación en la nube de EAS Build funcione, el archivo `google-services.json` debe ser rastreado por Git. Asegurarse de quitarlo de `.gitignore` para que EAS pueda subirlo y compilar la app con el archivo presente.

---

## 19. EAS Build: Duplicación de Builds y Control de VersionCode en Planes Gratuitos
**Síntoma:**
Al generar builds en Expo EAS Cloud, se consumen múltiples ejecuciones (ej. dos builds seguidos por cada intento de actualización), lo cual reduce rápidamente el cupo gratuito de la cuenta (límite de 30 builds/mes).

**Causa:**
1. Desincronización del `versionCode` entre el archivo nativo (`android/app/build.gradle`) y el archivo de Expo (`app.json`).
2. Lanzar la compilación (`eas build`) sin validar de forma previa que todos los archivos requeridos estén confirmados en Git o que falten dependencias críticas.

**Resolución (Checklist obligatorio previo a la compilación):**
Antes de ejecutar cualquier comando de `eas build`, se debe verificar manualmente y de manera estricta la siguiente lista de control para asegurar que el build compile en el primer intento:

- [ ] **1. Sincronía del `versionCode`**: El `versionCode` en `frontend/app.json` y el `versionCode` en `frontend/android/app/build.gradle` deben ser idénticos y mayores al último versionCode aprobado en Google Play Console.
- [ ] **2. Archivo `google-services.json`**: Confirmar que el archivo existe en `frontend/android/app/google-services.json` y que Git lo está rastreando (que no esté en el `.gitignore` del proyecto).
- [ ] **3. Permisos en `AndroidManifest.xml`**: Verificar que estén declarados los permisos requeridos (por ejemplo, `POST_NOTIFICATIONS` para Android 13+).
- [ ] **4. Plugin de Google Services en Gradle**: Confirmar que los classpath y complementos de `com.google.gms.google-services` estén presentes en los archivos `build.gradle`.
- [ ] **5. Estado de Git**: Ejecutar `git status` y verificar que todos los cambios locales necesarios estén confirmados (staged) en el repositorio para que EAS Build los suba al servidor de compilación.
- [ ] **6. Lanzar un solo build**: Únicamente tras marcar todos los puntos anteriores con éxito, lanzar la compilación con `eas build --platform android --profile production`.

