# Guía de Configuración: Entorno de Construcción Android Local

Para generar APKs directamente en tu máquina Windows sin esperar servidores externos, necesitas configurar el entorno de desarrollo de Android.

## ✅ Estado Actual
- **Node.js**: Instalado.
- **Java (JDK)**: Instalado (v17).
- **EAS CLI**: Instalándose...
- **Android SDK**: ❌ NO ENCONTRADO (Requiere acción manual).

---

## 🚀 Pasos para Instalar Android Studio (Obligatorio)

Como el SDK de Android requiere licencias y una interfaz gráfica, debes instalarlo manualmente:

1.  **Descargar Android Studio**:
    - Ve a: [https://developer.android.com/studio](https://developer.android.com/studio)
    - Descarga la versión "Hedgehog" o más reciente para Windows.

2.  **Instalación**:
    - Ejecuta el instalador.
    - Asegúrate de marcar **"Android Virtual Device"** en los componentes.
    - Sigue el asistente de configuración inicial ("Standard" suele ser suficiente).
    - **IMPORTANTE**: Cuando te pida instalar el SDK, fíjate en la ruta donde lo instala (Usualmente: `C:\Users\TuUsuario\AppData\Local\Android\Sdk`).

3.  **Configurar SDK Manager** (Dentro de Android Studio):
    - Ve a `More Actions` > `SDK Manager`.
    - En la pestaña **SDK Platforms**, asegúrate de tener instalada la **Android API 34** (o la 35).
    - En la pestaña **SDK Tools**, marca e instala:
        - **Android SDK Build-Tools**
        - **Android SDK Command-line Tools (latest)**
        - **Android SDK Platform-Tools**
        - **CMake** (opcional, pero recomendado).

---

## 🛠 Configurar Variables de Entorno (Windows)

Para que la terminal reconozca los comandos de Android:

1.  Presiona `Tecla Windows`, escribe **"Variables de entorno"** y selecciona "Editar las variables de entorno del sistema".
2.  Haz clic en **"Variables de entorno..."**.
3.  **Nueva Variable de Usuario**:
    - Nombre: `ANDROID_HOME`
    - Valor: La ruta de tu SDK (ej. `C:\Users\Save Company\AppData\Local\Android\Sdk`).
4.  **Actualizar Path**:
    - Busca la variable `Path` (en variables de usuario) y edítala.
    - Añade una nueva línea: `%ANDROID_HOME%\platform-tools`.
    - Añade otra línea: `%ANDROID_HOME%\emulator`.
5.  Acepta y cierra todo.

---

## 🏗 Generar tu APK

Una vez instalado todo y reiniciada tu terminal (VS Code):

1.  **Login en EAS** (si tienes cuenta Expo):
    ```powershell
    eas login
    ```

2.  **Compilar Localmente**:
    ```powershell
    eas build --platform android --local
    ```
    - Esto generará el archivo `.apk` o `.aab` directamente en tu carpeta de proyecto.
