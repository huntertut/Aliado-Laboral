$ErrorActionPreference = "Stop"

$TargetFile = "C:\dev\aliado-laboral\frontend\node_modules\react-native\ReactCommon\react\renderer\core\graphicsConversions.h"

Write-Host "🔧 Parcheando React Native (C++ Format Fix)..."
if (Test-Path $TargetFile) {
    $content = Get-Content $TargetFile -Raw
    # Reemplazamos std::format por folly::format
    if ($content -match "std::format") {
        $newContent = $content -replace "std::format", "folly::format"
        Set-Content -Path $TargetFile -Value $newContent
        Write-Host "✅ Archivo parcheado: graphicsConversions.h"
    }
    else {
        Write-Host "⚠️ No se encontró 'std::format' en el archivo. ¿Ya fue parcheado?"
    }
}
else {
    Write-Host "❌ Error: No se encontró el archivo $TargetFile"
    Write-Host "Asegurate de haber ejecutado MIGRATE_AND_FIX.bat primero."
}

# Limpiar cache de C++ por si acaso
$CxxCache = "C:\dev\aliado-laboral\frontend\node_modules\expo-modules-core\android\.cxx"
if (Test-Path $CxxCache) {
    Write-Host "🧹 Limpiando cache C++..."
    Remove-Item -Recurse -Force $CxxCache
}

Write-Host "🎉 Listo. Ahora ejecuta: npx expo run:android --variant debug (desde C:\dev\aliado-laboral\frontend)"
