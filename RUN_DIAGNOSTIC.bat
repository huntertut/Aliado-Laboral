@echo off
title 🐞 ALIADO LABORAL - DIAGNOSTIC DEBUG

echo [1/3] Ejecutando Diagnostico y Parche...
powershell -ExecutionPolicy Bypass -File "%~dp0diagnose_and_fix.ps1"

echo [2/3] Cambiando a carpeta frontend...
cd /d "%~dp0frontend"

echo [3/3] Iniciando App...
call npx expo run:android --variant debug

pause
