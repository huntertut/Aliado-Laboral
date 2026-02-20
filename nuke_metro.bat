@echo off
echo Limpiando cache de Metro Bundler...
cd frontend
del /s /q .expo
del /s /q node_modules\.cache
echo Cache eliminada.
echo.
echo Iniciando Metro con --clear-cache...
npx expo start --clear-cache
