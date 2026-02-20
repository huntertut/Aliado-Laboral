@echo off
title 🚀 ALIADO LABORAL - LAUNCHER (PYTHON POWERED)

echo ==================================================
echo   🚀 INICIANDO ENTORNO (CON PARCHE PYTHON)
echo ==================================================

:: 1. Verificar si existe la carpeta destino
if not exist "C:\dev\aliado-laboral\frontend" (
    echo [ERROR] No encuentro C:\dev\aliado-laboral\frontend
    pause
    exit /b
)

:: 2. Copiar el parche a la ruta segura
echo [1/4] Instalando parche Python...
copy "%~dp0patch_build.py" "C:\dev\aliado-laboral\patch_build.py" /Y >nul

:: 3. Cambiar de directorio
echo [2/4] Moviendonos a C:\dev\aliado-laboral\frontend...
cd /d "C:\dev\aliado-laboral\frontend"

:: 4. Ejecutar el parche Python
echo [3/4] Parcheando librerias C++ con Python...
python "..\patch_build.py"

:: 5. Ejecutar Build
echo [4/4] Arrancando App...
call npx expo run:android --variant debug

if %errorlevel% neq 0 (
    echo.
    echo ❌ ALGO FALLO. Revisa los errores arriba.
    pause
) else (
    echo.
    echo ✅ LISTO! App corriendo.
)
