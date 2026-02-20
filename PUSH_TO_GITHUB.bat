@echo off
echo ==========================================
echo 🚀 Subiendo cambios a GitHub (Aliado Laboral) - MODO FORZADO v2
echo ==========================================
echo.
echo El repositorio remoto es: https://github.com/huntertut/Aliado-Laboral
echo.
echo ⚠️ ATENCION: Esto sobrescribira la historia del remoto con tu version local.
echo Esto es necesario porque reiniciamos el repositorio localmente.
echo.
echo Si se te solicita, ingresa tus credenciales:
echo  - Usuario: huntertut
echo  - Contrasena: TU_TOKEN_DE_GITHUB (Pegalo con clic derecho si lo copiaste)
echo.

git push -u origin main --force

echo.
if %errorlevel% neq 0 (
    echo ❌ Hubo un error al subir. Verifica tus credenciales.
) else (
    echo ✅ ¡Subida exitosa!
    echo Ahora ve a tu servidor y ejecuta los comandos de despliegue.
)
pause
