@echo off
echo ===================================================
echo   NUCLEAR DEEP CLEAN - ALIADO LABORAL
echo   (Limpieza de Raiz de Memoria y Cache)
echo ===================================================

echo.
echo [1/6] Deteniendo Demonios de Gradle (Java)...
if exist "frontend\android\gradlew.bat" (
    cd frontend\android
    call gradlew --stop
    cd ..\..
) else (
    echo [ERROR] No se encuentra frontend\android\gradlew.bat. Asegurate de ejecutar desde la raiz del proyecto.
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
if exist "frontend\android\build" rd /s /q "frontend\android\build"
if exist "frontend\android\app\build" rd /s /q "frontend\android\app\build"

echo.
echo [4/6] Eliminando cache local de Gradle (.gradle)...
if exist "frontend\android\.gradle" rd /s /q "frontend\android\.gradle"

echo.
echo [5/6] Ejecutando 'gradlew clean' (Limpieza oficial)...
cd frontend\android
call gradlew clean
cd ..\..

echo.
echo [6/6] Verificando eliminación de assets corruptos...
if exist "frontend\assets\images\logo.png" (
    echo    - ALERTA: logo.png aun existe. Borrando...
    del /f /q "frontend\assets\images\logo.png"
)

echo.
echo ===================================================
echo   LIMPIEZA COMPLETA.
echo   El sistema ha olvidado todo rastro de builds anteriores.
echo.
echo   PASO SIGUIENTE: Ejecuta 'build_android.bat'
echo ===================================================
pause
