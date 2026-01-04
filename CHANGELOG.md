# Changelog - Derechos Laborales MX

## Version 1.5.0 (2026-01-04)

### 🛡️ Estabilidad y Recuperación
- **Recuperación de Proyecto**: Restauración exitosa tras upgrade a Expo SDK 54.
- **Backend Port Fix**: Migración automática a puerto 3001/3000 según disponibilidad.
- **Metro Config Fix**: Ajuste de compatibilidad para Windows/Node 22 (Standard Mode).

### 🐛 Correcciones Críticas
- **Persistencia de Perfil Abogado**: Solucionado bug donde "Días de Atención" y "Horario" no se guardaban al recargar.
- **UI Perfil Trabajador**: Ajuste en botón "Contactar Abogado" para evitar desbordamiento de texto.
- **Dependencias**: Actualización masiva de librerías (`@types/react`, `expo-updates`) para alineación con SDK 54.

---

## Version 1.4.0 (2025-12-10)

### 🎯 Nuevas Funcionalidades

#### **Nuevos Roles de Usuario**
- **Supervisor**: Panel de control para verificación de abogados
  - Vista de abogados pendientes de verificación
  - Sistema de aprobación de licencias profesionales
  - Endpoints: `GET /supervisor/pending-lawyers`, `PUT /supervisor/verify-lawyer/:id`
  
- **Contador**: Panel de gestión financiera
  - Vista de pagos pendientes de trabajadores y abogados
  - Verificación manual de pagos (transferencias bancarias)
  - Endpoints: `GET /accountant/pending-payments`, `PUT /accountant/verify-payment/:id`

#### **Arquitectura Modular Completa**
- Refactorización completa a arquitectura modular basada en roles
- Estructura: `src/modules/{worker,lawyer,admin,supervisor,accountant}`
- Separación de componentes, hooks y lógica de negocio por módulo
- Mejora en mantenibilidad y desarrollo independiente

### 🔧 Mejoras Técnicas

#### **Backend**
- Nuevos controladores: `supervisorController.ts`, `accountantController.ts`
- Nuevas rutas: `supervisorRoutes.ts`, `accountantRoutes.ts`
- Script de seeding: `seed_special_users.ts` para usuarios especiales
- Actualización de esquema Prisma con roles `supervisor` y `accountant`

#### **Frontend**
- Módulos completos para Supervisor y Contador con dashboards funcionales
- Centralización de configuración API (`API_URL` en `config/constants.ts`)
- Eliminación de IPs hardcodeadas en toda la aplicación
- Mejora en hooks personalizados (`useWorkerProfile`, `useLawyerProfile`)

### 🐛 Correcciones

- **Corrección de "infinite saving" bug** en perfiles de trabajador y abogado
- **Eliminación de IPs hardcodeadas** en:
  - `ProfileScreen.tsx`
  - `LawyerPublicProfileScreen.tsx`
  - `MyContactRequestsScreen.tsx`
  - `ProfedetInfoWizardScreen.tsx`
  - `SubscriptionManagementScreen.tsx`
- **Corrección de imports** en módulos movidos
- **Corrección de rutas** en AdminNavigator

### 📦 Archivos Modificados Principales

**Backend:**
- `backend/src/index.ts` - Registró nuevas rutas
- `backend/src/controllers/supervisorController.ts` - Nuevo
- `backend/src/controllers/accountantController.ts` - Nuevo
- `backend/src/routes/supervisorRoutes.ts` - Nuevo
- `backend/src/routes/accountantRoutes.ts` - Nuevo
- `backend/src/scripts/seed_special_users.ts` - Nuevo
- `backend/prisma/schema.prisma` - Actualizado con nuevos roles

**Frontend:**
- `frontend/src/modules/supervisor/dashboard/SupervisorDashboard.tsx` - Nuevo
- `frontend/src/modules/accountant/dashboard/AccountantDashboard.tsx` - Nuevo
- `frontend/src/modules/worker/profile/WorkerProfileModule.tsx` - Nuevo
- `frontend/src/modules/lawyer/profile/LawyerProfileModule.tsx` - Nuevo
- `frontend/src/screens/ProfileScreen.tsx` - Refactorizado para RBAC
- `frontend/src/config/constants.ts` - Centralización de API_URL
- `frontend/src/screens/LoginScreen.tsx` - Actualizado a v1.4

### 🔐 Usuarios de Prueba (Seeded)

- **Supervisor**: `supervisor@test.com` / `123456`
- **Contador**: `contador@test.com` / `123456`

### 📝 Notas de Migración

- Ejecutar `npx ts-node src/scripts/seed_special_users.ts` desde `/backend` para crear usuarios especiales
- Reiniciar backend y frontend después de actualizar

---

## Version 1.3.0 (Anterior)
- Implementación de sistema de contacto trabajador-abogado
- Integración de pagos con Stripe
- Panel de administración básico

## Version 1.2.0
- Sistema de perfiles de abogado
- Calculadora de finiquito
- Sistema de roles inicial

## Version 1.1.0
- Autenticación con Firebase
- Perfiles de trabajador
- Sistema de casos básico
