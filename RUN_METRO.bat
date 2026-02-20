@echo off
title Metro Bundler (React Native Server)
echo ==================================================
echo   INICIANDO METRO BUNDLER (DESDE RAIZ)
echo ==================================================
echo.
echo Navegando a carpeta frontend...
cd frontend
echo.
echo Limpiando cache e iniciando servidor...
echo Ejecutando: node_modules\.bin\expo start --reset-cache
call node_modules\.bin\expo start --reset-cache
pause
