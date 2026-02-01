@echo off
echo ===================================================
echo   HARD RESET ANDROID (CACHE BUSTER)
echo ===================================================
echo.
:: Go up to root, then down to frontend/android
cd /d "%~dp0..\frontend\android"

echo [1/3] Limpiando build folder...
rmdir /s /q app\build
rmdir /s /q .gradle
echo.
echo [2/3] Limpiando Gradle clean...
call gradlew.bat clean
echo.
echo [3/3] Listo.
echo       Ahora ejecuta: tools\01_build_android.bat
echo.
pause
