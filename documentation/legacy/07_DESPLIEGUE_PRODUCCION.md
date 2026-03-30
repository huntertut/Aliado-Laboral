# Guía de Despliegue en Digital Ocean (Producción)

El servidor de Digital Ocean (142.93.186.75) ejecuta la base de datos y el backend dentro de contenedores de **Docker (usando el motor Podman)** gestionados mediante `docker-compose`. 

**No hay instalaciones nativas o globales de Node, npm o PM2 en la máquina anfitriona**. Todos los comandos se deben ejecutar interactuando con los contenedores.

## 1. Conexión y Ubicación
1. Conéctate a tu servidor mediante SSH.
   ```bash
   ssh root@142.93.186.75
   ```
2. Navega al directorio donde reside el código del backend y el archivo `docker-compose.yml`:
   ```bash
   cd /root/Aliado-Laboral/backend
   ```

## 2. Actualización de Código (Git Pull)
Descarga los últimos cambios de la rama `main` de GitHub:
```bash
git pull origin main
```

## 3. Reconstrucción del Contenedor
Para que los cambios en el código (incluyendo nuevas dependencias en `package.json`, nuevas rutas API, o cambios en el esquema de Prisma) surtan efecto en el servidor en vivo, debes reconstruir la imagen del backend y levantarla:
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```
*⚠ IMPORTANTE: El script `"start"` en tu `package.json` debe ejecutar únicamente el código compilado (ej. `"node dist/index.js"`). **No agregues `npx prisma db push` en el script start de producción**, ya que esto bloquea la base de datos montada en volumen, causando que el contenedor entre en un bucle de reinicios (crash loop, "container state improper").*

## 4. Ejecutar Scripts de Base de Datos
Ya que el backend está corriendo de forma aislada dentro de su contenedor (`backend-backend-1`), comandos como la inserción de datos (seeding) no se pueden correr en el anfitrión directamente.

Una vez que el contenedor de backend ya encendió, ejecuta scripts directamente dentro de él. Por ejemplo, para correr la inyección del Excel:
```bash
docker exec -it backend-backend-1 npx tsx src/seed_excel.ts
```
*(Si te pedirá instalar interactívamente el paquete `tsx`, confirma con `y`)*

Si necesitas forzar una actualización del esquema de tu base de datos mediante Prisma (porque cambiaste el `schema.prisma`):
```bash
docker exec -it backend-backend-1 npx prisma db push
```

## 5. Interpretar Errores (Logs)

El servidor en producción es administrado por **PM2** directamente en el host. Para ver los logs en tiempo real:
```bash
pm2 logs aliado-api --lines 50
pm2 logs aliado-api --err --lines 50   # Solo errores
```

Para ver el estado del proceso:
```bash
pm2 list
```

## 6. Solución al Bug de Servidor Caído — Error 503 (Solución Permanente)

> ⚠️ **IMPORTANTE:** La solución `nohup` dentro del contenedor Docker es temporal y NO sobrevive reinicios. La solución correcta y permanente es usar **PM2 en el host** como se describe aquí.

El servidor CentOS tiene Node.js v20 instalado nativamente (NVM). La API se ejecuta con PM2 apuntando al código compilado en `/root/Aliado-Laboral/backend/dist/index.js`.

### Si la API está caída (503) — Pasos de Recuperación:
```bash
# 1. Navegar al backend
cd /root/Aliado-Laboral/backend

# 2. ⚠ CRÍTICO: Regenerar el cliente Prisma ANTES de iniciar PM2
#    Sin este paso, la API arranca pero /promotions da Error 500
npx prisma generate

# 3. Iniciar con PM2
pm2 start dist/index.js --name aliado-api

# 4. Guardar para persistir en reinicios
pm2 save
```

### Si PM2 no survive a un reinicio del servidor:
```bash
pm2 startup    # Genera comando systemctl — ejecutarlo tal cual
pm2 save
```

### Verificar que la API está activa:
```bash
curl https://api.cibertmx.org/api/health
# Debe responder: {"status":"ok","message":"Backend is reachable"}
```

## 7. Referencias del Frontend (Punto de Montaje de la API)
Recuerda que todas las peticiones desde el frontend de React Native deben incluir estrictamente el sufijo `/api`, ya que el proxy interno de Express agrupa sus rutas allí.
Si recibes un **Error 404** en el celular tras un inicio de sesión, verifica que tu archivo `frontend/src/config/constants.ts` tenga la URL de producción configurada así:
```typescript
// ✅ CORRECTO: 
export const API_URL = 'https://api.cibertmx.org/api';

// ❌ INCORRECTO (Causará Error 404):
// export const API_URL = 'https://api.cibertmx.org';
```
