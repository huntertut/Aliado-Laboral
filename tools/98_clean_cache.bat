@echo off
echo ===================================================
echo   NUCLEAR DEEP CLEAN - ALIADO LABORAL
echo   (Limpieza de Raiz de Memoria y Cache)
echo ===================================================

echo.
echo [1/6] Deteniendo Demonios de Gradle (Java)...
:: Check relative path from tools folder
if exist "%~dp0..\frontend\android\gradlew.bat" (
    cd /d "%~dp0..\frontend\android"
    call gradlew --stop
    :: Return to tools dir
    cd /d "%~dp0"
) else (
    echo [ERROR] No se encuentra frontend\android\gradlew.bat.
    pause
    exit /b 1
)

echo.
echo [2/6] Eliminando Carpeta Espejo 'Safe Build' (C:\rn_safe_build)...
if exist "C:\rn_safe_build" (
    rd /s /q "C:\rn_safe_build"
    echo    - Eliminada correctamente.
) else (
    echo    - No existia o ya estaba borrada.
)

echo.
echo [3/6] Eliminando 'android/build' y 'android/app/build'...
cd /d "%~dp0..\frontend\android"
if exist "build" rd /s /q "build"
if exist "app\build" rd /s /q "app\build"

echo.
echo [4/6] Eliminando cache local de Gradle (.gradle)...
if exist ".gradle" rd /s /q ".gradle"

echo.
echo [5/6] Ejecutando 'gradlew clean' (Limpieza oficial)...
call gradlew clean
cd /d "%~dp0"

echo.
echo [6/6] Verificando eliminación de assets corruptos...
if exist "..\frontend\assets\images\logo.png" (
    echo    - ALERTA: logo.png aun existe. Borrando...
    del /f /q "..\frontend\assets\images\logo.png"
)

echo.
echo ===================================================
echo   LIMPIEZA COMPLETA.
echo   El sistema ha olvidado todo rastro de builds anteriores.
echo.
echo   PASO SIGUIENTE: Ejecuta '01_build_android.bat'
echo ===================================================
pause
