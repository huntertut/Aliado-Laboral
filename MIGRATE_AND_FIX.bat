@echo off
title 🚀 MIGRACION A RUTA CORTA (C:\dev)

echo =======================================================
echo    SOLUCION DEFINITIVA: MIGRAR A RUTA CORTA
echo =======================================================
echo.
echo Los trucos de unidad virtual fallaron porque React Native
echo se confunde entre discos (X: vs C:).
echo.
echo La unica solucion real es copiar el proyecto a una ruta
echo corta en tu disco C:, como C:\dev\aliado-laboral
echo.

set "SOURCE=%CD%"
set "DEST=C:\dev\aliado-laboral"

echo [1/3] Creando carpeta destino: %DEST%
if not exist "%DEST%" mkdir "%DEST%"

echo.
echo [2/3] Copiando archivos (robocopy mirror)...
echo        Esto puede tardar unos minutos. Por favor espera.
echo.

:: Excluimos node_modules, .git y builds para hacerlo rapido y limpio
:: Luego instalaremos dependencias frescas.
robocopy "%SOURCE%" "%DEST%" /MIR /XD node_modules .git .gradle build .cxx val /XF *.log *.lock

echo.
echo [3/3] Configurando entorno en nueva ruta...
cd /d "%DEST%\frontend"

echo.
echo =======================================================
echo    LISTO! PROYECTO CLONADO EN C:\dev\aliado-laboral
echo =======================================================
echo.
echo PASOS SIGUIENTES (AUTOMATICOS):
echo 1. Instalaremos dependencias (npm install)
echo 2. Ejecutaremos el debug desde ahi.
echo.
pause

echo.
echo --- Instalando Dependencias en %DEST% ---
call npm install --legacy-peer-deps

echo. 
echo --- Iniciando Debug en Ruta Corta ---
call npx expo run:android --variant debug

pause
