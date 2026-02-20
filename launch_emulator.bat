@echo off
setlocal EnableDelayedExpansion

set "ANDROID_HOME=C:\Users\Save Company\AppData\Local\Android\Sdk"
set "EMULATOR_BIN=%ANDROID_HOME%\emulator\emulator.exe"

:: Check for emulator in strictly modern location first, then legacy
if not exist "%EMULATOR_BIN%" (
    set "EMULATOR_BIN=%ANDROID_HOME%\tools\emulator.exe"
)

if not exist "%EMULATOR_BIN%" (
    echo [ERROR] Emulator executable not found!
    echo Checked:
    echo  - %ANDROID_HOME%\emulator\emulator.exe
    echo  - %ANDROID_HOME%\tools\emulator.exe
    echo.
    echo Please verify your ANDROID_HOME path or install the Android Emulator via SDK Manager.
    pause
    exit /b 1
)

echo ==========================================
echo  Aliado Laboral - Android Emulator Launcher
echo ==========================================
echo.
echo Fetching available AVDs...
echo.

set count=0
for /f "tokens=*" %%a in ('"%EMULATOR_BIN%" -list-avds') do (
    set /a count+=1
    set "AVD[!count!]=%%a"
    echo [!count!] %%a
)

if %count%==0 (
    echo [ERROR] No AVDs found. 
    echo Please create a virtual device using Android Studio's Device Manager.
    echo.
    pause
    exit /b 1
)

echo.
set /p selection="Select an emulator to launch (1-%count%): "

if "!AVD[%selection%]!"=="" (
    echo.
    echo [ERROR] Invalid selection "%selection%".
    pause
    exit /b 1
)

set "SELECTED_AVD=!AVD[%selection%]!"
echo.
echo ==========================================
echo Launching: %SELECTED_AVD%
echo ==========================================
echo.
echo The emulator window should appear shortly.
echo You can close this window once it starts.
echo.

:: Launch in separate process
start "" "%EMULATOR_BIN%" -avd "%SELECTED_AVD%"

timeout /t 5
