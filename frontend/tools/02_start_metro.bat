@echo off
title Metro Bundler (React Native Server)
echo ==================================================
echo   INICIANDO METRO BUNDLER (SERVIDOR DE DESARROLLO)
echo ==================================================
echo.
echo Este servidor debe permanecer ABIERTO mientras desarrollas.
echo Si la app se cierra, presiona 'r' aqui para recargar.
echo.
cd ..
echo Limpiando cache de Metro...
call npx react-native start --reset-cache
pause
