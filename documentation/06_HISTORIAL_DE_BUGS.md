# 🛠️ Registro de Errores y Soluciones (Troubleshooting Log)
Este documento sirve como base de conocimiento para problemas técnicos resueltos en el proyecto Aliado Laboral.
Úsalo para evitar reinventar la rueda cuando aparezcan errores recurrentes.

---

## 📅 2026-02-01: Pantalla Blanca en Build Android (Release)
**Estado:** 🟡 En Progreso (Parcialmente Solucionado)

### 🔴 Síntoma
- Al abrir la APK de producción (`release`), la app se queda en blanco o se cierra inmediatamente.
- **Logs:** `ReferenceError: Property 'AppTheme' doesn't exist` y `Invariant Violation: "main" has not been registered`.
- **Contexto:** Solo ocurre en builds nativos (APK), no en Expo Go development.

### 🔍 Diagnóstico Realizado
1.  **Falta de Entry Point:** Expo maneja `AppEntry.js` automáticamente, pero en builds nativos puros, `index.js` estaba siendo ignorado o mal configurado.
2.  **Hoisting de Imports:** Los `import` estáticos se ejecutan antes que cualquier `console.log`, ocultando el punto exacto del crash.
3.  **Babel Config Faltante:** El proyecto carecía de `babel.config.js` y la dependencia `babel-preset-expo`, causando fallos de compilación silenciosos o malformados.
4.  **Dependencias Circulares:** El tema (`AppTheme`) se usaba antes de ser inicializado.

### 🛠️ Solución Implementada
1.  **Control Manual de `index.js`:**
    ```javascript
    const { AppRegistry } = require('react-native'); // Usar require para controlar orden
    AppRegistry.registerComponent('main', () => App);
    ```
2.  **Reparación de Entorno:**
    - Creación de `babel.config.js` estándar.
    - Instalación de `babel-preset-expo` en `devDependencies`.
3.  **Scripts de Depuración:**
    - `RUN_METRO.bat`: Para ver logs en tiempo real (`npx expo start`).
4.  **Corrección de Código (Runtime Crash):**
    - **Error:** `Property 'View' doesn't exist`.
    - **Causa:** `AppNavigator.tsx` usaba `View` y `ActivityIndicator` en el estado de carga (`isLoading`), pero no estaban importados de `react-native`.
    - **Solución:** Se agregó `import { View, ActivityIndicator } ...`.

### 🧪 Estado Actual
- **Hello World Aislado:** ✅ Funciona.
- **App Launch:** ✅ **SOLUCIONADO**. La pantalla de Bienvenida carga correctamente.

---

## 📅 2026-01-31: Error "React Native not found / Expo not recognized"
**Estado:** ✅ Solucionado

### 🔴 Síntoma
- Al correr scripts `.bat`, Windows retornaba `'expo' is not recognized`.

### 🛠️ Solución
- Cambio de comando: Usar `npx expo start` en lugar de llamar al binario directo o `npm start`.
- `npx` localiza automáticamente el binario en `node_modules` sin necesidad de variables de entorno globales.

---

## 📅 2026-02-01: Error de Build - Módulo Faltante y Sintaxis
**Estado:** ✅ Solucionado

### 🔴 Síntoma
1. **Build Fallido 1:** `SyntaxError` en `AppNavigator.tsx` por un operador ternario mal formado (`: (`).
2. **Build Fallido 2:** `Unable to resolve module ./ForumNavigator`.

### 🛠️ Solución
1. Corregida la sintaxis del ternario en `AppNavigator.tsx`.
2. Identificado que `ForumNavigator.tsx` no existía a pesar de estar referenciado.
3. Se creó `ForumNavigator.tsx` conectando las pantallas `AnonymousForumScreen`, `ForumCreatePostScreen` y `ForumDetailScreen`, las cuales ya existían y fueron validadas.

---

## 💀 POST-MORTEM: La "Tormenta Perfecta" (Análisis de Causa Raíz)
**Fecha:** 2026-02-02
**Resumen:** La falla masiva no fue un solo error, sino la convergencia de 5 fallos críticos simultáneos.

1.  **El Saboteador (Imagen Corrupta):**
    *   **Hecho:** `logo.png` tenía headers corruptos.
    *   **Efecto:** El compilador de Android (Gradle) moría antes de empezar.
    *   **Lección:** Verificar assets gráficos en herramientas externas si el build falla muy temprano.

2.  **El Fantasma de la Entrada (`index.js` vs Expo):**
    *   **Hecho:** El build nativo buscaba `index.js`, pero la app estaba configurada para usar el entry point virtual de Expo.
    *   **Efecto:** La app instalaba pero no arrancaba el motor JS (Pantalla en blanco sin logs).
    *   **Lección:** En builds "prebuild" (eject/native), siempre forzar el registro manual en `index.js`.

3.  **El Crash Invisible (Missing Imports):**
    *   **Hecho:** `AppNavigator.tsx` usaba `<View>` y `<ActivityIndicator>` sin importarlos.
    *   **Efecto:** Crash instantáneo al montar el primer componente.
    *   **Lección:** El linter no siempre detecta esto si los archivos están excluidos o si el IDE no ha re-indexado.

4.  **El Círculo Vicioso (Circular Dependencies):**
    *   **Hecho:** `colors.ts` importaba módulos que a su vez importaban `colors.ts`.
    *   **Efecto:** Bloqueo silencioso del hilo JS.
    *   **Lección:** Mantener los archivos de constantes/tema sin dependencias externas.

5.  **El Módulo Fantasma (`ForumNavigator`):**
    *   **Hecho:** `AppNavigator` intentaba importar `./ForumNavigator`, el cual no existía en el disco.
    *   **Efecto:** Fallo de resolución de módulo en tiempo de ejecución (o build bundling).
    *   **Lección:** Auditar que todos los archivos importados realmente existan antes de descomentar código masivamente.

---
