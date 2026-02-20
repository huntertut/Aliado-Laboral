@echo off
echo ==================================================
echo   ALIADO LABORAL - LOG MONITOR
echo   (Rastrea errores de la App y React Native)
echo ==================================================
echo.
echo Presiona Ctrl+C para salir.
echo.
echo Esperando dispositivo...
adb wait-for-device

echo.
echo [1/2] Limpiando logs viejos...
adb logcat -c

echo.
echo [2/2] Escuchando errores...
echo       (Filtra por: "ReactNativeJS", "FATAL", "com.aliadolaboral.app")
echo.

adb logcat -v color *:S ReactNativeJS:V AndroidRuntime:E com.aliadolaboral.app:V
