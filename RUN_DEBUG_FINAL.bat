@echo off
title 🐞 ALIADO LABORAL - DEBUGGER

echo [1/3] Aplicando parche C++ a Gradle Cache...
python "%~dp0patch_headers.py"

echo [2/3] Cambiando a carpeta frontend...
cd /d "%~dp0frontend"

echo [3/3] Iniciando App...
call npx expo run:android --variant debug

pause
