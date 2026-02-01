@echo off
echo ===================================================
echo   HARD RESET ANDROID (CACHE BUSTER)
echo ===================================================
echo.
cd frontend\android
echo [1/3] Limpiando build folder...
rmdir /s /q app\build
rmdir /s /q .gradle
echo.
echo [2/3] Limpiando Gradle clean...
call gradlew.bat clean
echo.
echo [3/3] Listo. Ahora vuelve a la carpeta raiz y corre:
echo       build_android.bat
echo.
pause
