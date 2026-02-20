@echo off
title 💽 ALIADO LABORAL - INITIALIZE DB
color 0E

echo ==============================================
echo    INICIALIZANDO BASE DE DATOS LOCAL
echo ==============================================
echo.

cd /d "%~dp0backend"

echo [1/3] Generando cliente Prisma...
call npx prisma generate

echo [2/3] Empujando esquema a SQLite...
call npx prisma db push

echo [3/3] Sembrando usuarios de prueba (Abogado, Pyme, etc)...
call npx ts-node prisma/seed_users.ts

echo.
echo ==============================================
echo    LISTO: USUARIOS DE PRUEBA CREADOS
echo ==============================================
echo.
pause
