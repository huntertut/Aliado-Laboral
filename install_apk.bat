@echo off
echo Instalando APK en el dispositivo/emulador...
adb install -r "frontend\android\app\build\outputs\apk\release\app-release.apk"
if %ERRORLEVEL% EQU 0 (
    echo.
    echo [EXITO] App instalada/actualizada correctamente.
) else (
    echo.
    echo [ERROR] Hubo un problema. Asegurate de que el emulador este abierto.
)
pause
