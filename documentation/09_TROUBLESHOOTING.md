# 09. Troubleshooting & Known Issues

This document registers critical incidents and their established resolution procedures to prevent debugging loops in production.

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
