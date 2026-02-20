@echo off
title 🤖 ALIADO LABORAL - SISTEMA COMPLETO
color 0B

echo ==============================================
echo    INICIANDO TODO EL SISTEMA DE ALIADO LABORAL
echo ==============================================
echo.
echo [1/2] Arrancando el CEREBRO (Backend Server)...
start "ALIADO BACKEND" cmd /k "call RUN_BACKEND.bat"

timeout /t 5 /nobreak >nul

echo [2/2] Arrancando el CUERPO (App Debug)...
call RUN_DEBUG_FINAL.bat
