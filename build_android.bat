@echo off
setlocal
set "ORIGINAL_DIR=%CD%"
set "TEMP_BUILD_DIR=C:\rn_safe_build"
set "SOURCE_DIR=%~dp0frontend"

echo ==========================================
echo  Aliado Laboral - Android Build Helper 
echo  (Physical Copy Mode V2)
echo ==========================================

echo.
echo 1. Cleaning previous attempts...
:: Aggressively clean up temp dir. 
:: If it was a junction, rmdir works. If dir, rmdir /s /q works.
if exist "%TEMP_BUILD_DIR%" (
    echo [WARN] Stopping Gradle Daemons to release file locks...
    pushd "%SOURCE_DIR%\android"
    call gradlew --stop >nul 2>&1
    popd
    
    echo [WARN] Removing old build directory...
    rmdir "%TEMP_BUILD_DIR%" 2>nul
    rmdir /s /q "%TEMP_BUILD_DIR%" 2>nul
)
:: Clear X: drive just in case it lingers
subst X: /d >nul 2>&1

echo.
echo 2. Mirroring project to Safe Path: %TEMP_BUILD_DIR%...
if not exist "%TEMP_BUILD_DIR%" mkdir "%TEMP_BUILD_DIR%"

echo [INFO] Copying files...
echo (Excluding .git, .cxx, build, .gradle, node_modules)
:: Robocopy to separate folder to bypass path limits completely
robocopy "%SOURCE_DIR%" "%TEMP_BUILD_DIR%" /MIR /XD .git .cxx build .gradle node_modules /R:1 /W:1 /NFL /NDL /NJH /NJS

echo.
echo 3. Installing dependencies in Short Path...
cd /d "%TEMP_BUILD_DIR%"
set NODE_ENV=development

echo [INFO] Running npm install...
call npm install --legacy-peer-deps

echo.
echo 3.5. Patching React Native (NDK r26 compat)...
echo [INFO] Running patch script...
copy /Y "%~dp0patch_rn.ps1" "%TEMP_BUILD_DIR%\patch_rn.ps1"
cd /d "%TEMP_BUILD_DIR%"
powershell -ExecutionPolicy Bypass -File "patch_rn.ps1"


echo.
echo 3.6. Debugging Node Environment...
echo [INFO] Node version:
node -v
echo [INFO] Testing React Native resolution...
node --print "require.resolve('react-native/package.json')" || echo [ERROR] Failed to resolve react-native
node --print "require.resolve('@react-native/gradle-plugin/package.json', { paths: [require.resolve('react-native/package.json')] })" || echo [ERROR] Failed to resolve gradle-plugin

echo.
echo 4. Starting Gradle Build...
set "ANDROID_HOME=C:\Users\Save Company\AppData\Local\Android\Sdk"
cd android

echo [INFO] Resolving dependencies (Extracting AARs)...
call gradlew :app:preBuild --no-daemon

echo.
echo 3.7. Re-Running Patch on Extracted Transforms...
cd /d "%TEMP_BUILD_DIR%"
powershell -ExecutionPolicy Bypass -File "patch_rn.ps1"
cd android

echo [INFO] Building Release APK...
call gradlew assembleRelease --no-daemon

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] BUILD FAILED!
    echo Logs are above.
    echo.
    echo NOTE: Build folder %TEMP_BUILD_DIR% preserved for inspection.
    cd /d "%ORIGINAL_DIR%"
    pause
    exit /b 1
)

echo.
echo ==========================================
echo [SUCCESS] APK Generated Successfully!
echo ==========================================
echo Location (Temp): %TEMP_BUILD_DIR%\android\app\build\outputs\apk\release\app-release.apk
echo.
echo Copying APK back to original project...
if not exist "%SOURCE_DIR%\android\app\build\outputs\apk\release" mkdir "%SOURCE_DIR%\android\app\build\outputs\apk\release"
copy /Y "%TEMP_BUILD_DIR%\android\app\build\outputs\apk\release\app-release.apk" "%SOURCE_DIR%\android\app\build\outputs\apk\release\app-release.apk"

echo.
echo [INFO] APK is ready at:
echo frontend\android\app\build\outputs\apk\release\app-release.apk
echo.
echo Cleaning up...
cd /d "%ORIGINAL_DIR%"
rmdir /s /q "%TEMP_BUILD_DIR%"

echo Done.
pause
