@echo off
title 🎯 ALIADO LABORAL - TARGETED FIX

echo [1/3] Ejecutando Parche Específico...
powershell -ExecutionPolicy Bypass -File "%~dp0PATCH_TARGETED.ps1"

echo [2/3] Cambiando a carpeta frontend...
cd /d "%~dp0frontend"

echo [3/3] Iniciando App...
call npx expo run:android --variant debug

pause
