# 00. Product & Team Context

**Last Updated:** March 2026
**Project Name:** Aliado Laboral

---

## 1. The Team

The project is driven by a core founding team focused on scaling LegalTech in Mexico:
- **Misael Morales Urbano**: Lead Founder, Full-stack Developer, and Product Visionary.
- **Miguel Ángel Rodríguez Romero**: Co-founder of *Save Company*.
- **Founding Partner**: Third member focused on the *CIBERT* ONG initiative.

---

## 2. Business Entities

The legal and operational structure relies on a dual-entity ecosystem:

### A. CIBERT (NGO / Asociación Civil)
- **Legal Status**: NGO in the process of formal incorporation.
- **Mission**: Provide accessible legal technology and education to the Mexican workforce.
- **Funding Strategy**: Government and private grants (INDESO, CONAHCYT, International Funds).
- **Ecosystem Role**: Official owner of the "Aliado Laboral" intellectual property and generating the initial financial flow through social impact.

### B. Save Company
- **Legal Status**: Private technology company (S.A. de C.V. or similar).
- **Founders**: Misael Morales Urbano & Miguel Ángel Rodríguez Romero.
- **Ecosystem Role**: Serves as the dedicated software development and maintenance agency. Contracted directly by CIBERT to build and scale the "Aliado Laboral" platform.

---

## 3. The Financial Architecture
To ensure sustainability while maintaining the social mission of the NGO:
1. **App Revenues** (Subscriptions, Leads, Success Fees) flow directly to **CIBERT**.
2. **CIBERT** uses these funds to pay **Save Company** a monthly maintenance and development retainer at fair market value.
3. The founders receive income through their roles in both entities, legally separating the software maintenance business from the social impact NGO.

---

## 4. Platform Core Logic (LFT Engine)
As of **April 2026 (v1.21.0)**, the platform features a centralized, robust engine for calculating labor liquidations:
- **Accuracy**: Strictly follows the Mexican Federal Labor Law (LFT).
- **Flexibility**: Supports user-defined overrides for Aguinaldo, Vacations, and Premiums.
- **Complexity**: Handles advanced scenarios like Salario Diario Integrado (SDI), the 15-year seniority rules, and anniversary-based vacation accumulation.

### 4.1 Admin Panel Maintenance Rules
To avoid regressions in the Admin Dashboard:
- **Individual Gifts**: Always preserve the "Regalo" (Gift) button in `Users.tsx`. It interfaces with `/admin/users/:userId/subscription`.
- **ID Resolution**: For Lawyers, use `userId`. For Workers/Pymes, use `id`.
- **Role Consistency**: The `User.role` field must always match the user's active profile. Manual subscription updates (Gifts) must enforce this change to avoid users appearing in multiple dashboard tabs.
- **Security**: Never remove the password visibility toggle in `Login.tsx`.

### 4.2 Maintenance & Deployment Rules
- **ZIP Generation**: When updating the server, ALWAYS generate a "light" ZIP from the `dist` folder only.
  - Command: `Compress-Archive -Path dist\* -DestinationPath admin-dist.zip`
- **Heavy ZIPs**: Never upload a ZIP containing `node_modules` or `.git` to the production server. These are for backups only.
- **Verification**: Always check the version number in the Sidebar (e.g., `v1.21.1-prod`) after refreshing to confirm the update was successful.

## 5. Reglas Críticas de Infraestructura en Producción

### 5.1 Base de Datos — REGLA PERMANENTE ⚠️
La base de datos de producción **SIEMPRE** debe apuntar a:
```
DATABASE_URL="file:/root/Aliado-Laboral/backend/prisma/dev.db"
```
**Nunca usar ruta relativa** (`file:./dev.db`) en producción. PM2 ejecuta desde `dist/`, haciendo que las rutas relativas se rompan silenciosamente.

Hay 3 archivos `.db` en el servidor — solo uno es válido:
| Archivo | Estado | Uso |
|---------|--------|-----|
| `/root/Aliado-Laboral/backend/prisma/dev.db` | ✅ PRODUCCIÓN REAL | Siempre usar este |
| `/root/Aliado-Laboral/backend/dev.db` | ⛔ INCOMPLETO | No usar |
| `/root/Aliado-Laboral/backend/recovered_apr15.db` | 📦 BACKUP APR 2026 | Solo recuperación |

### 5.2 Flujo de Registro de Usuarios en la App — Cómo Funciona

Cuando un usuario descarga la app y se registra:
1. Elige su rol en la pantalla de bienvenida (Trabajador / Abogado / Empresa)
2. La app envía ese rol a `POST /api/auth/social-login` junto con su token de Firebase
3. El backend crea el `User` en SQL con el rol correcto
4. Si es **Abogado** → se crea también un registro `Lawyer` con `status: PENDING` e `isVerified: false`
5. Si es **Trabajador** → se crea un `WorkerSubscription` inactivo
6. Si es **PyME** → se crea un `PymeProfile`

> Firebase solo guarda email, UID y nombre. **El rol NO está en Firebase**, siempre viene de la app.

### 5.3 Botón "Sincronizar Firebase" — Qué hace y qué NO hace

**SÍ hace:**
- Revisa todos los usuarios con `role='lawyer'` en la DB SQL.
- Si alguno no tiene su registro en la tabla `Lawyer`, lo crea (caso de bug previo).
- **CRÍTICO:** Sincroniza la tabla `UserRole` (mapeo de Firebase) con la tabla `User` (fuente de verdad). Se corrigió un bug donde la app móvil mostraba perfiles de abogado a trabajadores debido a desincronización en esta tabla de mapeo.

**NO hace:**
- NO importa usuarios desde Firebase (no conoce su rol).
- NO crea Workers ni PyMEs.
- NO modifica usuarios que ya tienen perfil completo.

**Cuándo usarlo:** Solo si un abogado dice que se registró correctamente pero no aparece en el panel, o si un usuario reporta ver una interfaz que no corresponde a su rol real. En ese caso, primero verificar que su `User.role` sea el correcto en la DB, y luego presionar el botón o ejecutar el script de sincronización.

### 5.4 Despliegue — Flujo Correcto

```bash
# 1. Compilar localmente (Windows)
cd admin-web && npm run build
Compress-Archive -Path dist\* -DestinationPath ..\admin-web-dist.zip -Force

# 2. Desplegar Frontend (a Hostinger/cPanel manualmente via ZIP)
# Subir admin-web-dist.zip al File Manager de Hostinger

# 3. Desplegar Backend (automático via script)
node deployer\deploy_quota.js
```

> ⚠️ El script `deploy_quota.js` **NO ejecuta migraciones de DB**. Solo hace `npm run build` + `pm2 restart`. Esto es intencional para evitar que se pierdan datos.

### 5.5 OTA Updates (expo-updates) — Reglas Permanentes ⚠️

El sistema OTA permite actualizar el código JS de la app **sin nuevo AAB**. Solo requiere `eas update`.

**Configuración crítica en `AndroidManifest.xml`** (no tocar):
```xml
<meta-data android:name="expo.modules.updates.ENABLED" android:value="true"/>
<meta-data android:name="expo.modules.updates.EXPO_UPDATE_URL" android:value="https://u.expo.dev/edbaa94d-8deb-4e42-9eae-b9d597dcf595"/>
<meta-data android:name="expo.modules.updates.EXPO_RUNTIME_VERSION" android:value="@string/expo_runtime_version"/>
<meta-data android:name="expo.modules.updates.EXPO_UPDATES_CHECK_ON_LAUNCH" android:value="ALWAYS"/>
<meta-data android:name="expo.modules.updates.EXPO_UPDATES_LAUNCH_WAIT_MS" android:value="3000"/>
<meta-data android:name="expo.modules.updates.EXPO_CHANNEL_NAME" android:value="production"/>
```

**Cuándo usar OTA vs nuevo AAB:**

| Cambio | ¿Necesita AAB? | Comando |
|--------|---------------|---------|
| Cambio en pantallas, lógica JS, estilos | ❌ No | `eas update --channel production --runtime-version 1.22.0` |
| Nueva librería nativa, permisos, `runtimeVersion` | ✅ Sí | Compilar AAB + subir a Play Store |
| Cambio en `App.tsx` (Flujo de arranque) | ✅ Sí | Compilar AAB (si la lógica es estructural) |

**Pantalla de Carga OTA:** Se implementó `OTAUpdateScreen.tsx` para mostrar un mensaje visual de "Descargando actualizaciones" al arrancar. Para que esta pantalla aparezca, el `App.tsx` debe estar configurado para montarla primero.

**⛔ NUNCA:** Ejecutar `npx expo prebuild --clean` sin verificar después que `ENABLED=true` en `AndroidManifest.xml`.

### 5.6 Compilación AAB — Checklist Obligatorio

Antes de cada compilación de AAB para producción:

- [ ] Verificar en **Play Console → Producción → Versiones** el último versionCode activo
- [ ] Actualizar `versionCode = último + 1` en `build.gradle` Y en `app.json`
- [ ] Actualizar `versionName` y `runtimeVersion` en `app.json`
- [ ] Verificar que `AndroidManifest.xml` tenga `ENABLED=true` y URL de EAS
- [ ] Compilar: `cd frontend/android && .\gradlew bundleRelease`
- [ ] AAB estará en: `frontend/android/app/build/outputs/bundle/release/app-release.aab`
- [ ] Subir a **Producción** (no a prueba interna)
- [ ] Actualizar la tabla de historial en `09_TROUBLESHOOTING.md` incidente #13
- [ ] Actualizar el header de `11_DESPLIEGUE_GOOGLE_PLAY_AAB.md` con el nuevo versionCode

### 4.3 Sistema de Inactividad y Reasignación de Abogados (SLA V2)
- **Aceptación de casos**: El abogado tiene **3 días hábiles** para aceptar una nueva solicitud (excluyendo sábados y domingos). De lo contrario, expira y se reasigna a la bolsa pública.
- **Inactividad del Abogado**: Si el abogado no responde al trabajador en **5 días hábiles** (excluyendo sábados y domingos), el trabajador puede reasignar el caso a la bolsa pública de forma voluntaria.
- **Inactividad del Trabajador**: Si el trabajador no responde al abogado en **7 días laborables** (excluyendo únicamente domingos), el abogado puede archivar el caso por inactividad.
- **Bolsa Pública**: Los casos reasignados o expirados tienen `lawyerProfileId = null` y regresan al estado `pending`. Son visibles para todos los abogados activos y verificados en su pestaña de "Pendientes" (excepto para los abogados que previamente atendieron o dejaron expirar el caso, registrados en `previousLawyerIds`). Al ser aceptados, se cobra la cuota normal de $150/$300 y se asignan al nuevo abogado.

**Último versionCode en Producción: 84 (v1.23.21) — 22 Junio 2026**

