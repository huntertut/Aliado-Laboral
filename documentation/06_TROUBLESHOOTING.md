# Troubleshooting y Errores Comunes

Este documento registra los errores conocidos y sus soluciones para evitar pérdida de tiempo en el futuro.

## Problemas de Construcción (Build) en Android Local

### Error: Plugin [id: 'expo-autolinking-settings'] was not found

**Síntoma:**
Al correr `npm run android` de manera local, el build de Gradle falla inmediatamente mostrando el siguiente error en la consola y apuntando al archivo `settings.gradle`:
```
* What went wrong: 
Plugin [id: 'expo-autolinking-settings'] was not found in any of the following sources:
```

**Causa:**
Al usar Expo SDK 52, y dependiendo de cómo se hayan inicializado o actualizado los módulos, la carpeta de `node_modules/expo-modules-autolinking` puede corromperse o descargarse en una versión desactualizada (ej. `v2.0.8` en lugar de `v3.0+`) que no incluye los archivos de Gradle compatibles (como los scripts de Kotlin `.kts`).
Esto provoca que las rutas dinámicas en `settings.gradle` fallen sin poder cargar el autolinking obligatorio para módulos de Expo.

**Solución definitiva:**
No intentes editar manualmente los scripts de Gradle o parchar los archivos KTS/Groovy, ya que el SDK de Expo requiere configuraciones precisas por versión.
Sigue estos pasos para regenerar la configuración de manera limpia:

1. Mata cualquier proceso de Node que tenga bloqueada la carpeta:
`taskkill /f /im node.exe` (en Windows)

2. Borra e instala todos los módulos nuevamente, esto obliga a npm a traer la versión correcta del autolinking basándose en tu `expo@52.0.x`:
`rm -rf node_modules` o `Remove-Item -Recurse -Force node_modules`
`npm install`

3. Ejecuta el "prebuild" limpio de Expo. Esto le indica a Expo CLI que sobreescriba y regenere completamente la carpeta nativa `/android` de acuerdo a los permisos y variables definidas en el `app.json`:
`npx expo prebuild --platform android --clean`
*(Acepta "yes" si te pregunta sobre posibles cambios no commiteados)*

4. Vuelve a correr tu emulador:
`npm run android`
