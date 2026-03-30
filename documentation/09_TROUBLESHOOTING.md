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
