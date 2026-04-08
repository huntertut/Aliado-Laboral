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
