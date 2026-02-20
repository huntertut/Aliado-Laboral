@echo off
title 🐘 ALIADO LABORAL - BACKEND SERVER
color 0A

echo ==========================================
echo    INICIANDO SERVIDOR BACKEND (LOCAL)
echo ==========================================
echo.

cd /d "%~dp0backend"

echo [1/2] Verificando dependencias...
if not exist "node_modules" (
    echo    Instalando dependencias...
    call npm install
)

echo [2/2] Arrancando servidor...
echo.
echo    Esperando en puerto 3001...
echo    (Presiona Ctrl+C para detener)
echo.

call npx ts-node src/index.ts
pause
