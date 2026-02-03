@echo off
title REPARAR Y ARRENCAR METRO
echo ==================================================
echo   REPARANDO ENTORNO (FORZADO) Y ARRENCANDO
echo ==================================================
echo.
echo 1. Navegando a carpeta frontend...
cd frontend
echo.
echo 2. Instalando dependencias (bypass conflictos)...
echo    Usando --legacy-peer-deps para resolver conflictos de Firebase.
call npm install --legacy-peer-deps
echo.
echo 3. Iniciando Metro Bundler...
call npx expo start --reset-cache
pause
