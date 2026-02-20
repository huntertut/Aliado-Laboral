# Stack Tecnológico - Aliado Laboral

Esta guía te permitirá entender completamente la arquitectura de tu aplicación y trabajar de forma independiente.

## 📱 Frontend (Aplicación Móvil)

### Tecnologías Base
- **Framework**: React Native 0.72.10
- **Plataforma**: Expo SDK 49
- **Lenguaje**: TypeScript 5.1.3
- **UI Framework**: React Native Components nativas

### Navegación
```
@react-navigation/native: 6.1.9
@react-navigation/stack: 6.3.20
@react-navigation/bottom-tabs: 6.0.0
```

### Librerías Principales
| Librería | Uso |
|----------|-----|
| `expo-linear-gradient` | Gradientes en UI |
| `@expo/vector-icons` | Iconos (Ionicons) |
| `@stripe/stripe-react-native` | Pagos con Stripe |
| `@react-native-async-storage/async-storage` | Almacenamiento local |
| `axios` | Peticiones HTTP al backend |
| `date-fns` | Manejo de fechas |
| `zustand` | State management (alternativa a Redux) |
| `expo-document-picker` | Selección de archivos |

### Estructura de Carpetas (Frontend)
```
frontend/
├── App.tsx                 # Punto de entrada
├── app.json               # Configuración de Expo
├── eas.json              # Build configuration (APK/AAB)
├── package.json
└── src/
    ├── navigation/
    │   ├── AppNavigator.tsx      # Router principal
    │   └── AdminNavigator.tsx    # Panel admin
    ├── screens/              # Pantallas de la app
    │   ├── HomeScreen.tsx
    │   ├── ProfileScreen.tsx
    │   ├── ChatScreen.tsx
    │   ├── LawyersScreen.tsx
    │   ├── ProfedetInfoWizardScreen.tsx
    │   └── admin/           # Pantallas del admin panel
    ├── context/
    │   └── AuthContext.tsx   # Gestión de autenticación
    ├── data/
    │   └── laborGuideData.ts # Datos estáticos
    ├── theme/
    │   └── colors.ts         # Paleta de colores
    └── assets/
        └── images/           # Avatares, iconos
```

### Comandos de Desarrollo
```bash
# Iniciar servidor de desarrollo
npm start

# Correr en Android
npm run android

# Correr en iOS
npm run ios

# Generar APK
eas build -p android --profile preview
```

---

## 🖥️ Backend (API REST)

### Tecnologías Base
- **Runtime**: Node.js
- **Framework**: Express.js
- **Lenguaje**: TypeScript
- **Base de Datos**: SQLite (via Prisma ORM)

### Librerías Principales
| Librería | Uso |
|----------|-----|
| `prisma` | ORM para base de datos |
| `bcrypt` | Hash de contraseñas |
| `jsonwebtoken` | Autenticación JWT |
| `stripe` | Procesamiento de pagos |
| `zod` | Validación de esquemas |
| `cors` | Cross-Origin Resource Sharing |
| `helmet` | Seguridad HTTP headers |
| `dotenv` | Variables de entorno |

### Estructura de Carpetas (Backend)
```
backend/
├── prisma/
│   ├── schema.prisma      # Esquema de base de datos
│   ├── dev.db            # Base de datos SQLite
│   ├── seed_users.ts     # Scripts de prueba
│   └── seed_requests.ts
├── src/
│   ├── index.ts          # Servidor Express
│   ├── controllers/      # Lógica de negocio
│   │   ├── authController.ts
│   │   ├── workerProfileController.ts
│   │   ├── subscriptionController.ts
│   │   └── contactController.ts
│   ├── routes/           # Endpoints de API
│   │   ├── authRoutes.ts
│   │   ├── workerProfileRoutes.ts
│   │   └── contactRoutes.ts
│   ├── middleware/       # Middlewares
│   │   ├── auth.ts       # Autenticación JWT
│   │   └── adminMiddleware.ts
│   └── services/
│       └── stripeService.ts  # Integración Stripe
├── .env                  # Variables de entorno
└── package.json
```

### Variables de Entorno (.env)
```bash
PORT=3000
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET=tu_secret_key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
FRONTEND_URL=http://localhost:19006
```

### Comandos de Desarrollo
```bash
# Iniciar servidor
npm start

# Sincronizar base de datos
npx prisma db push

# Generar cliente Prisma
npx prisma generate

# Poblar base de datos con usuarios de prueba
npx ts-node prisma/seed_users.ts
```

---

## 🔐 Autenticación

### Flujo JWT
1. Usuario hace login → `/auth/login`
2. Backend valida credenciales y devuelve token JWT
3. Token se almacena en `AsyncStorage` (frontend)
4. Cada request incluye header: `Authorization: Bearer <token>`
5. Middleware `authMiddleware` valida token y adjunta `req.user`

### Usuarios de Prueba (Seeded)
```
worker_std@test.com    / password123  (Trabajador estándar)
worker_pro@test.com    / password123  (Trabajador PRO)
lawyer_pro1@test.com   / password123  (Abogado verificado)
lawyer_pro2@test.com   / password123  (Abogado verificado)
admin@test.com         / password123  (Administrador)
```

---

## 🗄️ Base de Datos (Prisma Schema)

### Modelos Principales
- `User`: Usuarios (workers, lawyers, admins)
- `WorkerProfile`: Perfil laboral y datos PROFEDET
- `Lawyer`: Información del abogado
- `LawyerProfile`: Perfil público del abogado
- `ContactRequest`: Solicitudes de contacto
- `LawyerSubscription`: Suscripción $99 MXN bimestral (Stripe)
- `WorkerSubscription`: Suscripción $29 MXN mensual

### Diagrama de Relaciones Clave
```
User (1) ──> (0..1) WorkerProfile
User (1) ──> (0..1) Lawyer ──> (1) LawyerProfile
User (1) ──> (N) ContactRequest (como worker)
LawyerProfile (1) ──> (N) ContactRequest
```

---

## 🎨 Diseño UI

### Sistema de Colores
Definido en `frontend/src/theme/colors.ts`:
- Primary: `#1e3799` (Azul oscuro)
- Gradientes personalizados por pantalla
- Paleta de 8 combinaciones únicas

### Componentes Visuales
- `LinearGradient` para headers y botones destacados
- `Ionicons` para todos los íconos
- Modales personalizados para confirmaciones
- Cards con sombras y elevación

---

## 🚀 Flujos de Usuario Implementados

### 1. Registro/Login
`LoginScreen` → `AuthContext` → Backend `/auth/login`

### 2. Perfil de Trabajador
`ProfileScreen` → API `/worker-profile` → Actualiza `WorkerProfile`

### 3. Wizard PROFEDET
`ProfedetInfoWizardScreen` (4 pasos) → Guarda datos de trámite legal

### 4. Contacto con Abogados
`LawyersScreen` → `LawyerDetailScreen` → `CreateContactRequestScreen` → API `/contact/create-with-payment`

### 5. Panel de Admin
`AdminDashboardScreen` → Métricas, gestión de usuarios

---

## 🔧 Debugging

### Frontend
```bash
# Ver logs en tiempo real
npx react-native log-android  # Android
npx react-native log-ios      # iOS

# Depurar en Chrome DevTools
# Presiona "d" en la terminal de Expo → "Debug JS Remotely"
```

### Backend
```bash
# Mostrar queries SQL de Prisma
# Agrega en .env:
DEBUG="prisma:query"

# Ver logs del servidor
npm start  # Ya incluye console.log activos
```

### Base de Datos
```bash
# Abrir interfaz gráfica
npx prisma studio
# Se abre en http://localhost:5555
```

---

## 📦 Dependencias Críticas

### Si necesitas reinstalar
```bash
# Frontend
cd frontend
npm install

# Backend
cd backend
npm install
npx prisma generate  # Regenera el cliente Prisma
```

---

## 🛠️ Extensión Futura

### Para agregar una nueva pantalla:
1. Crear archivo en `frontend/src/screens/NuevaPantalla.tsx`
2. Registrar en `AppNavigator.tsx`
3. Agregar navegación desde otra pantalla

### Para agregar un endpoint:
1. Crear controlador en `backend/src/controllers/`
2. Crear ruta en `backend/src/routes/`
3. Registrar en `backend/src/index.ts`
4. Actualizar schema Prisma si necesitas nuevos modelos

---

## 🐛 Problemas Comunes

### "Cannot find module..."
```bash
npm install
npx expo install  # Reinstala deps de Expo
```

### "Prisma Client not found"
```bash
cd backend
npx prisma generate
```

### "JWT Malformed"
- Verifica que `JWT_SECRET` sea el mismo en backend y frontend
- Borra AsyncStorage y vuelve a hacer login

### Backend no responde
- Verifica que esté corriendo en puerto 3000
- Actualiza IP en frontend: busca `192.168.100.239` y reemplaza con tu IP local
