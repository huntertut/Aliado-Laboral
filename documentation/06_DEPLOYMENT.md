# 06. Deployment Guide

**Production Server IP:** `142.93.186.75` (DigitalOcean)  
**Domain URL:** `https://api.cibertmx.org`

---

## 1. Backend Deployment (DigitalOcean)

The backend API runs on the DigitalOcean droplet (`142.93.186.75`). It is managed by `docker-compose`.

### How to push a new Backend update:
1. Ensure all changes are committed and pushed to the repository (the AI handles this autonomously via Git).
2. Or transfer the updated code via `scp` to the server:
   ```bash
   scp backend-update.zip root@142.93.186.75:/root/Aliado-Laboral/
   ```
2. Connect to the server:
   ```bash
   ssh root@142.93.186.75
   cd /root/Aliado-Laboral/backend
   ```
3. Rebuild and restart the Docker container:
   *(Never put `npx prisma db push` inside your package.json start script. It crashes the container)*
   ```bash
   docker-compose down
   docker-compose build --no-cache
   docker-compose up -d
   ```
4. If you made database schema changes, apply them manually inside the running container:
   ```bash
   docker exec -it backend-backend-1 npx prisma db push
   ```

## 2. Admin Web Frontend Deployment (Hospedando / cPanel)

The Admin Web Dashboard (`admin-web`) is hosted separately on a web hosting provider (Hospedando) and relies on static file generation.

### How to deploy the Admin Web Frontend:
1. The AI runs the compilation command locally in the `admin-web` folder:
   ```bash
   npm run build
   ```
2. The AI compresses the contents of the `dist/` directory into a `.zip` file (e.g., `admin-web-build.zip`).
3. The Human Developer takes this `.zip` file and manually uploads it to the hosting control panel (cPanel/Hospedando), extracting the files directly into the `public_html` directory (or corresponding subdomain root), replacing previous files.

---

## 3. Mobile App Deployment (Android AAB)

The mobile application is compiled locally to avoid complex Expo continuous integration loops and key footprint errors.

### Prerequisites:
- Your terminal must be exactly in `frontend/android/`.
- Ensure `build.gradle` is set up with the Release `signingConfig`.
- Remember to increment `versionCode` in `build.gradle` prior to building, otherwise Google Play Console will reject the file.

### Compilation Command:
```powershell
.\gradlew bundleRelease
```

### Build Output:
The generated bundle will be located at:
`frontend/android/app/build/outputs/bundle/release/app-release.aab`

Upload this file directly to the **Google Play Console** under the Internal Testing or Production tracks.
