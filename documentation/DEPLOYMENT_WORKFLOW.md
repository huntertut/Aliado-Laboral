# DEPLOYMENT WORKFLOW (Autonomía vs. Manual)

Este documento define estrictamente la distribución de responsabilidades entre el Desarrollador (Humano) y la IA de asistencia para cada una de las 3 piezas del ecosistema "Aliado Laboral".

## 1. Backend (DigitalOcean)
- **Responsable del Código y Despliegue:** IA
- **Flujo:** Al terminar y aprobar los cambios, la IA ejecuta de forma autónoma `git add`, `git commit`, `git push` y cualquier orquestación o paso necesario para que el código llegue y corra en el servidor.
- **Rol del Humano:** Exclusivo de revisión y aseguramiento de calidad. El desarrollador NO hace commits ni pushes manuales.
- **Regla:** **Automático**. Los cambios en Backend son empujados e implementados 100% por la IA.

## 2. App Móvil (Android .AAB)
- **Responsable de Compilación (Build):** IA
- **Responsable de Distribución:** Humano
- **Flujo:** La IA programa la feature, valida dependencias y corre los procesos de Gradle/Expo necesarios para generar el archivo final `.AAB` en el disco local.
- **Rol del Humano:** Retira el `.AAB` generado en la computadora local y lo sube manualmente a Google Play Console firmándolo.
- **Regla Obligatoria:** **Híbrido**. La IA nunca intenta usar credenciales ni sube directamente a Play Store. El trabajo de la IA termina al entregar el archivo y, adicionalmente, proporcionando obligatoriamente las **notas de versión en formato `<es-419>`** para que el humano las pegue en la consola.

## 3. Sistema Web (Frontend Admin)
- **Responsable de Compilación (Build):** IA
- **Responsable de Alojamiento:** Humano
- **Flujo:** La IA realiza los ajustes necesarios en el Frontend (React/Vite) y ejectuta el comando de construcción (`bundle / build`) para posteriormente comprimirlo en un archivo `.ZIP`.
- **Rol del Humano:** Toma el `.ZIP` generado y lo carga de forma manual a través del panel de control de su Proveedor de Hosting Web.
- **Regla:** **Híbrido**. La IA nunca intenta enlazarse por FTP ni SSH al panel de hosting del Frontend. El trabajo de la IA termina al entregar el archivo comprimido.
