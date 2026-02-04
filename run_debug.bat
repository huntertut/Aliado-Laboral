@echo off
setlocal enabledelayedexpansion
title 🚀 ALIADO LABORAL - MODO DEBUG (HOT RELOAD)

echo =======================================================
echo      MODO DESARROLLO RAPIDO (DEBUG BUILD)
echo =======================================================
echo.
echo Este script instalara la version DEBUG de la app.
echo Podras ver tus cambios al instante (Ctrl + S) sin reconstruir.
echo.

cd frontend

echo [1/3] Limpiando caches previos...
if exist "android\app\build" rmdir /s /q "android\app\build"

echo.
echo [2/3] Iniciando Metro Bundler + Instalando App Debug...
echo        - Asegurate de tener tu emulador abierto.
echo        - Si falla, verifica que el puerto 8081 este libre.
echo.

call npx expo run:android --variant debug

echo.
echo =======================================================
echo      SI LA APP SE CIERRA O MUESTRA ERROR ROJO:
echo =======================================================
echo 1. Presiona 'r' en esta terminal para recargar.
echo 2. En el emulador, presiona 'Ctrl + M' -> 'Reload'.
echo 3. Verifica que esta ventana siga corriendo (Metro Bundler).
echo.
pause
