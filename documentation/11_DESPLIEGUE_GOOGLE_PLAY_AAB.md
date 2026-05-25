# Guía de Despliegue: Subir AAB a Google Play Store

**Proyecto:** Aliado Laboral  
**Última actualización:** 11 de mayo de 2026  
**Último versionCode en Producción:** 55 (v1.22.0) — publicado 11 mayo 2026  
**Anterior en Producción:** 54 (v1.21.8) — publicado 7 mayo 2026

---

## Conceptos Clave: ¿Cómo funciona la firma?

Google Play utiliza un esquema de doble firma llamado **"Play App Signing"**:

1. **Tu Upload Key (`aliado-upload-key.jks`):** Firma el bundle localmente antes de subirlo. Es tu credencial para autenticarte con Google Play. Si se pierde, puedes solicitar un reset.
2. **La App Signing Key de Google:** Google guarda esta llave en sus servidores y la usa para re-firmar el bundle antes de distribuirlo a los usuarios. Es la que protege la identidad final de la app.

> ⚠️ **NUNCA** uses la `debug.keystore` para compilar un release. El Play Console lo rechazará con el error "Todos los bundles subidos deben estar firmados." refiriéndose a firma de release, no de debug.

---

## Prerrequisitos

- [x] Upload Keystore generada: `frontend/android/app/aliado-upload-key.jks`
- [x] `build.gradle` configurado con el `signingConfig` de release (ya está)
- [x] Google Play App Signing activado en la consola (✅ aparece como "Versiones firmadas por Google Play")
- [x] **Nivel de API:** Asegúrate de que `targetSdkVersion` sea **35** en `frontend/android/build.gradle` (Requisito obligatorio de Google Play).

---

## Paso 1: Verificar la configuración de firma en `build.gradle`

El archivo `frontend/android/app/build.gradle` debe tener este bloque (ya configurado):

```gradle
signingConfigs {
    debug {
        storeFile file('debug.keystore')
        storePassword 'android'
        keyAlias 'androiddebugkey'
        keyPassword 'android'
    }
    release {
        // Upload key para Google Play App Signing.
        storeFile file('aliado-upload-key.jks')
        storePassword 'AliadoLaboral2026!'
        keyAlias 'aliado-key-alias'
        keyPassword 'AliadoLaboral2026!'
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        // ...resto de opciones
    }
}
```

---

## Paso 2: Actualizar el número de versión (Obligatorio en cada subida)

Google Play **rechaza** bundles con el mismo `versionCode` que uno ya subido anteriormente.

En `frontend/android/app/build.gradle`, incrementa **ambos** valores:

```gradle
defaultConfig {
    versionCode 2          // ← Incrementar en +1 cada vez
    versionName "1.20.0"   // ← Cambiar al número semántico deseado
}
```

---

## Paso 3: Compilar el Bundle (AAB)

Desde PowerShell, en la carpeta `frontend/android/`:

```powershell
.\gradlew bundleRelease
```

El proceso tarda ~2-4 minutos. Al terminar, el archivo estará en:

```
frontend/android/app/build/outputs/bundle/release/app-release.aab
```

---

## Paso 4: Subir a Google Play Console

1. Ve a [play.google.com/console](https://play.google.com/console) → Tu app → **Pruebas → Prueba Interna** (o Producción).
2. Haz clic en **"Crear nueva versión"**.
3. En la sección **"App bundles"**, haz clic en **"Subir"** y selecciona el `app-release.aab`.
4. Espera a que se procese (barra de progreso).
5. Rellena los campos obligatorios:

| Campo | Valor sugerido |
|---|---|
| **Nombre de la versión** | El `versionName` del build (ej. `1.19.1`) |
| **Notas de la versión (es-419)** | Descripción de los cambios (ver ejemplo abajo) |

**Ejemplo de notas de versión:**
```xml
<es-419>
Mejoras de estabilidad y correcciones de errores. Ahora los abogados pueden gestionar sus casos de forma más eficiente.
</es-419>
```

6. Haz clic en **"Siguiente"** → **"Guardar"** → **"Enviar a revisión interna"**.

---

## Paso 5: Agregar Testers (Prueba Interna)

1. En la sección **"Testers"**, abre el enlace de invitación.
2. Comparte el enlace con los testers. Deben aceptarlo desde un dispositivo Android.
3. La app aparecerá disponible en el Play Store de sus dispositivos en ~10-15 minutos.

---

## Errores Comunes y Soluciones

| Error | Causa | Solución |
|---|---|---|
| "Todos los bundles deben estar firmados" | Se usó la `debug.keystore` en el bloque `release` | Verificar que `signingConfig signingConfigs.release` esté en el buildType `release` |
| "Version code ya existe" | Se intentó subir con el mismo `versionCode` | Incrementar `versionCode` en `build.gradle` y recompilar |
| "Has subido un APK firmado en modo depuración" | El `signingConfig` del buildType `release` apunta a `signingConfigs.debug` | Cambiar a `signingConfig signingConfigs.release` |
| "El bundle no es válido" | Compilación corrupta o Metro caché viejo | Limpiar con `.\gradlew clean` y recompilar |

---

## Datos de la Keystore (Guardar en lugar seguro)

> ⚠️ **CONFIDENCIAL** — No subir al repositorio. Guardar en un gestor de contraseñas.

| Parámetro | Valor |
|---|---|
| Archivo | `frontend/android/app/aliado-upload-key.jks` |
| Alias | `aliado-key-alias` |
| Store Password | `AliadoLaboral2026!` |
| Key Password | `AliadoLaboral2026!` |
| Validez | 10,000 días (~27 años desde marzo 2026) |
| Algoritmo | RSA 2048 bits |
