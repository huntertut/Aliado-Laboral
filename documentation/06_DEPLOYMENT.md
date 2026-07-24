# 06. Deployment Guide

**Production Server IP:** `142.93.186.75` (DigitalOcean)  
**Domain URL:** `https://api.cibertmx.org`

---

## 1. Backend Deployment (DigitalOcean)

> ⚠️ **IMPORTANTE — Arquitectura real del servidor:**
> El backend en producción es servido por **PM2 directamente en el host** (Node v20 vía NVM).
> El archivo `docker-compose.yml` existe en el repo pero **NO sirve la API en producción**. Docker solo fue usado históricamente como build tool.
> La carpeta `backend/dist/` está en `.gitignore`, por lo tanto **siempre debes compilar en el servidor después de un `git pull`**.

### Workflow correcto para actualizar el backend:

```bash
# 1. Conectarse al servidor
ssh root@142.93.186.75

# 2. Ir a la raíz del repositorio (no a /backend directamente)
cd /root/Aliado-Laboral

# 3. Traer los cambios más recientes de GitHub
git checkout -- .       # descarta cambios locales del servidor si los hay
git pull origin main

# 4. Ir al backend
cd backend

# 5. Instalar dependencias nuevas (si se agregaron paquetes al package.json)
npm install

# 6. Regenerar cliente Prisma (CRÍTICO — sin esto da Error 500 en promotions/config)
npx prisma generate

# 7. Compilar TypeScript a JavaScript (CRÍTICO — dist/ no viene en git)
npm run build

# 8. Reiniciar el proceso PM2 con el nuevo código
pm2 restart aliado-api

# 9. Persistir el estado de PM2 para sobrevivir reinicios del servidor
pm2 save
```

### Verificar que el backend está activo:
```bash
curl https://api.cibertmx.org/api/health
# Debe responder: {"status":"ok","message":"Backend is reachable"}
```

### Si la API está caída (503) — Recuperación desde cero:
```bash
cd /root/Aliado-Laboral/backend
npm install
npx prisma generate
npm run build
pm2 start dist/index.js --name aliado-api
pm2 save
```

### Si hay cambios en el esquema de Prisma (schema.prisma):
```bash
npx prisma db push
npx prisma generate
npm run build
pm2 restart aliado-api
```

### Ver logs en tiempo real:
```bash
pm2 logs aliado-api --lines 50
pm2 logs aliado-api --err --lines 50   # Solo errores
pm2 list                                # Estado del proceso
```

---

## 2. Admin Web Frontend Deployment (Hospedando / cPanel)

The Admin Web Dashboard (`admin-web`) is hosted separately on a web hosting provider (Hospedando) and relies on static file generation.

> 📦 **Qué se sube:** Solo el ZIP generado del `dist/` (≈250 KB). NO el proyecto completo.

### How to deploy the Admin Web Frontend:
1. The AI runs the compilation command locally in the `admin-web` folder:
   ```bash
   npm run build
   ```
2. The AI compresses the contents of the `dist/` directory into a `.zip` file:
   ```powershell
   Compress-Archive -Path dist\* -DestinationPath admin-web-build.zip -Force
   ```
3. The Human Developer takes this `.zip` file and manually uploads it to the hosting control panel (cPanel/Hospedando), extracting the files directly into the `public_html` directory (or corresponding subdomain root), replacing previous files.

---

## 3. Mobile App Deployment (Android AAB)

The mobile application is compiled via EAS Build (CI/CD on GitHub Actions + Expo).

### Workflow:
1. Make changes locally and commit to `main`.
2. Create a version tag to trigger the EAS Build pipeline:
   ```bash
   git tag -a "v1.X.Y" -m "Release v1.X.Y"
   git push origin main --tags
   ```
3. Monitor the build at [expo.dev](https://expo.dev/accounts/huntertut2099/projects/aliado-laboral/builds).
4. Download the `.aab` file and upload to **Google Play Console**.

### Version rules:
- Bump `versionCode` in `app.json` and `android/app/build.gradle` before tagging.
- Never reuse a `versionCode` — Play Store rejects it.




