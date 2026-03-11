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
Para comprobar que el servidor arrancó correctamente y revisar errores en vivo (esto reemplaza el uso de `pm2 logs`):
```bash
docker logs backend-backend-1 --tail 50 -f
```

## 6. Solución al Bug "Exited (0)" en CentOS (Podman)
En servidores CentOS Web Panel, Podman tiene un bug de red conocido al combinar `network_mode: "host"` con ejecución en segundo plano (`-d`). Si Node.js se ejecuta sin un TTY enganchado, asume que el contenedor se cerró y muere silenciosamente con código 0, causando que el proxy (Apache) de arroje un **Error 503**.

Para revivir de por vida la API y puentear el bug, ejecuta este comando sustituto *después* de encender el contenedor:
```bash
docker exec -d backend-backend-1 sh -c "nohup node dist/index.js > /app/live.log 2>&1 &"
```
Esto inyecta el proceso directamente en la memoria del contenedor bloqueando la muerte silente.

## 7. Referencias del Frontend (Punto de Montaje de la API)
Recuerda que todas las peticiones desde el frontend de React Native deben incluir estrictamente el sufijo `/api`, ya que el proxy interno de Express agrupa sus rutas allí.
Si recibes un **Error 404** en el celular tras un inicio de sesión, verifica que tu archivo `frontend/src/config/constants.ts` tenga la URL de producción configurada así:
```typescript
// ✅ CORRECTO: 
export const API_URL = 'https://api.cibertmx.org/api';

// ❌ INCORRECTO (Causará Error 404):
// export const API_URL = 'https://api.cibertmx.org';
```
