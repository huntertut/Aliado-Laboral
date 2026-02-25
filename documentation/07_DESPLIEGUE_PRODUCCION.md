# Guía de Despliegue en Digital Ocean (Producción)

Dado que en el servidor CentOS de Digital Ocean no contamos con una instalación global de `npx` ni herramientas de desarrollo locales como las que usamos en la máquina Windows (`c:\dev\aliado-laboral`), los pasos de despliegue y actualización de base de datos son diferentes y estrictos.

## 1. Actualización de Código (Git Pull)

Siempre que se hayan subido cambios mediante Git desde el entorno local, se deben bajar al servidor.

1. Conéctate a tu servidor mediante SSH.
2. Navega al directorio del backend o raíz (dependiendo de tu estructura exacta, generalmente `/var/www/aliado-laboral/backend` o similar).
3. Ejecuta el pull request:
   ```bash
   git pull origin main
   ```

## 2. Instalación de Dependencias

Si se agregaron nuevas librerías en el `package.json`, debes instalarlas. Como es un entorno de producción, recomendamos usar `npm ci` o en su defecto `npm install`.
```bash
npm install
```

## 3. Actualización de Base de Datos (Prisma)

**⚠ IMPORTANTE:** Nunca uses `npx prisma db push` o comandos de desarrollo de prisma directamente en producción si no tienes el entorno configurado. 

En su lugar, nosotros controlamos los cambios de esquema estructurándolos en archivos `.sql` (como `init_competences.sql`).

Para aplicar cambios a la base de datos PostgreSQL:

1. Identifica el usuario, base de datos y archivo. (Por defecto el usuario es `postgres` y la base de datos `derechos_laborales`).
2. Utiliza el binario nativo de postgres (`psql`) para inyectar el script a la base de datos local del servidor.
3. Asegúrate de estar en el mismo directorio donde descargaste el archivo sql.

**Comando de actualización SQL:**
```bash
sudo -u postgres psql -d derechos_laborales -f init_competences.sql
```
*Tip: Usar `sudo -u postgres` soluciona el error `command not found` o problemas de permisos al intentar acceder a la consola de postgresql.*

**Generar el Cliente de Prisma para Producción:**
Después de alterar la base de datos, el código de Node necesita saber de estos cambios. Puesto que no hay `npx` global, utilizaremos el comando predefinido en tu `package.json` de backend o ejecutaremos el binario local usando `npx` proporcionado por npm localmente. 
*Asegúrate de estar dentro del directorio `backend`.*
```bash
npm run generate
# Si el comando anterior falla porque no está en package.json, usa el binario local de npm:
./node_modules/.bin/prisma generate
```

## 4. Reconstrucción y Reinicio (PM2)

Una vez que el código más nuevo está descargado y la base de datos / cliente prisma están actualizados, debemos recompilar TypeScript y reiniciar el gestor de procesos (PM2).

1. Construir el proyecto:
   ```bash
   npm run build
   ```
2. Reiniciar el servicio (Reemplaza 'backend' por el nombre del proceso en PM2 si es diferente):
   ```bash
   pm2 restart backend
   ```
3. Verifica que no haya errores:
   ```bash
   pm2 logs backend --lines 20
   ```
