$ErrorActionPreference = "Stop"

$TargetFile = "C:\dev\aliado-laboral\frontend\node_modules\react-native\ReactCommon\react\renderer\core\graphicsConversions.h"

Write-Host "🔧 Parcheando React Native (C++ Format Fix V2)..."

if (Test-Path $TargetFile) {
    $content = Get-Content $TargetFile -Raw
    
    # Intento 1: Si tiene std::format, lo cambiamos a folly::sformat (string format)
    if ($content -match "std::format") {
        Write-Host ">> Reemplazando std::format..."
        $newContent = $content -replace "std::format", "folly::sformat"
        Set-Content -Path $TargetFile -Value $newContent
        Write-Host "✅ Archivo parcheado (std -> folly::sformat)"
    } 
    # Intento 2: Si ya tiene folly::format (del parche anterior), lo cambiamos a sformat
    elseif ($content -match "folly::format") {
        Write-Host ">> Corrigiendo folly::format a folly::sformat..."
        $newContent = $content -replace "folly::format", "folly::sformat"
        Set-Content -Path $TargetFile -Value $newContent
        Write-Host "✅ Archivo corregido (folly::format -> folly::sformat)"
    }
    else {
        Write-Host "⚠️ No se encontró 'std::format' ni 'folly::format'. Verificando si ya usa sformat..."
        if ($content -match "folly::sformat") {
            Write-Host "✅ El archivo ya usa folly::sformat. Todo correcto."
        }
        else {
            Write-Host "⚠️ Advertencia: El contenido del archivo no coincide con lo esperado."
        }
    }
}
else {
    Write-Host "❌ Error: No se encontró el archivo $TargetFile"
}

# Limpiar cache de C++ ESPECIFICO del modulo que fallo
$CxxCacheModules = "C:\dev\aliado-laboral\frontend\node_modules\expo-modules-core\android\.cxx"
if (Test-Path $CxxCacheModules) {
    Write-Host "🧹 Limpiando cache C++ (expo-modules-core)..."
    Remove-Item -Recurse -Force $CxxCacheModules -ErrorAction SilentlyContinue
}

Write-Host "🎉 Listo. Intenta compilar de nuevo: npx expo run:android --variant debug"
