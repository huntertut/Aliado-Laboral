# 06. Deployment Guide

**Production Server IP:** `142.93.186.75` (DigitalOcean)  
**Domain URL:** `https://api.cibertmx.org`

---

## 1. Backend & Admin Web Deployment (Server)

The backend and the Admin Web interface run as **Docker containers** managed by `docker-compose`. There are no native PM2 or Node installations managing the application on the host; everything must go through Docker.

### How to push a new Backend/Web update:
1. Transfer your updated `.zip` file via `scp` to the server:
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

---

## 2. Mobile App Deployment (Android AAB)

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
