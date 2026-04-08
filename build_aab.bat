@echo off
setlocal
set "ORIGINAL_DIR=%CD%"
set "TEMP_BUILD_DIR=C:\rn_safe_build_aab"
set "SOURCE_DIR=%~dp0frontend"

echo ==========================================
echo  Aliado Laboral - Android AAB Build Helper 
echo  (Production Google Play Mode)
echo ==========================================

if exist "%TEMP_BUILD_DIR%" (
    echo [WARN] Stopping Gradle Daemons...
    pushd "%SOURCE_DIR%\android"
    call gradlew --stop >nul 2>&1
    popd
    echo [WARN] Removing old build directory...
    rmdir /s /q "%TEMP_BUILD_DIR%" 2>nul
)

echo.
echo 1. Mirroring project to Safe Path: %TEMP_BUILD_DIR%...
if not exist "%TEMP_BUILD_DIR%" mkdir "%TEMP_BUILD_DIR%"
robocopy "%SOURCE_DIR%" "%TEMP_BUILD_DIR%" /MIR /XD .git .cxx build .gradle node_modules /R:1 /W:1 /NFL /NDL /NJH /NJS

echo.
echo 2. Installing dependencies...
cd /d "%TEMP_BUILD_DIR%"
call npm install --legacy-peer-deps

echo.
echo 3. Patching React Native...
copy /Y "%~dp0patch_rn.ps1" "%TEMP_BUILD_DIR%\patch_rn.ps1"
powershell -ExecutionPolicy Bypass -File "patch_rn.ps1"

echo.
echo 4. Starting Gradle AAB Build...
set "ANDROID_HOME=C:\Users\Save Company\AppData\Local\Android\Sdk"
cd android

echo [INFO] Running bundleRelease...
call gradlew bundleRelease --no-daemon

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] AAB BUILD FAILED!
    cd /d "%ORIGINAL_DIR%"
    pause
    exit /b 1
)

echo.
echo ==========================================
echo [SUCCESS] AAB Generated Successfully!
echo ==========================================
echo Copying AAB back to original project...
if not exist "%SOURCE_DIR%\android\app\build\outputs\bundle\release" mkdir "%SOURCE_DIR%\android\app\build\outputs\bundle\release"
copy /Y "%TEMP_BUILD_DIR%\android\app\build\outputs\bundle\release\app-release.aab" "%SOURCE_DIR%\android\app\build\outputs\bundle\release\app-release.aab"
copy /Y "%TEMP_BUILD_DIR%\android\app\build\outputs\bundle\release\app-release.aab" "%ORIGINAL_DIR%\app-release.aab"

echo.
echo [INFO] AAB is ready at:
echo app-release.aab
echo.
cd /d "%ORIGINAL_DIR%"
rmdir /s /q "%TEMP_BUILD_DIR%"
pause
