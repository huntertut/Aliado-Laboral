$ErrorActionPreference = "Stop"

# Ruta EXACTA del log de error
$TargetFile = "C:\Users\Save Company\.gradle\caches\8.14.3\transforms\1b69af101147d0cbba4072a9053d402d\transformed\react-android-0.81.5-debug\prefab\modules\reactnative\include\react\renderer\core\graphicsConversions.h"

Write-Host "🎯 Buscando archivo objetivo especifico..."
Write-Host "   $TargetFile"

if (Test-Path -LiteralPath $TargetFile) {
    Write-Host "✅ Archivo encontrado."
    
    $content = Get-Content -LiteralPath $TargetFile -Raw
    $originalLength = $content.Length
    
    # 1. Agregar Include si falta
    if (-not $content.Contains("#include <folly/Format.h>")) {
        $content = "#include <folly/Format.h>`r`n" + $content
        Write-Host "   ➕ Include agregado."
    }

    # 2. Reemplazo de la linea culpable
    # Buscamos la cadena exacta del error
    $badCode = 'return std::format("{}%", dimension.value);'
    $goodCode = 'return folly::format("{}%", dimension.value).str();'
    
    if ($content.Contains($badCode)) {
        $content = $content.Replace($badCode, $goodCode)
        Write-Host "   🔧 REEMPLAZO EXITOSO: std::format -> folly::format(...).str()"
    }
    else {
        # Fallback: Quiza hay espacios diferentes? Intentamos regex
        if ($content -match "return std::format") {
            Write-Host "   ⚠️ No coincidio texto exacto, intentando Regex..."
            $content = $content -replace 'return std::format\("\{\}%", dimension.value\);', $goodCode
            Write-Host "   🔧 REEMPLAZO REGEX APLICADO."
        }
        else {
            Write-Host "   ⚠️ No se encontro la linea de codigo problematica. Verificando si ya fue parcheada..."
            if ($content.Contains("folly::format")) {
                Write-Host "   ℹ️ Parece que YA TIENE folly::format."
                if (-not $content.Contains(".str()")) {
                    Write-Host "   🔴 PERO LE FALTA .str() !!! Corrigiendo..."
                    $content = $content -replace 'folly::format\("([^"]+)", dimension\.value\);', 'folly::format("$1", dimension.value).str();'
                }
                else {
                    Write-Host "   ✅ El codigo parece correcto."
                }
            }
        }
    }

    Set-Content -LiteralPath $TargetFile -Value $content -NoNewline
    Write-Host "💾 Archivo guardado."

    # VERIFICACION FINAL
    $finalContent = Get-Content -LiteralPath $TargetFile -Raw
    if ($finalContent.Contains(".str()")) {
        Write-Host "🎉 VERIFICACION EXITOSA: El archivo contiene .str()"
    }
    else {
        Write-Host "❌ ERROR CRITICO: El archivo NO contiene .str() despues de guardar."
    }

}
else {
    Write-Host "❌ EL ARCHIVO NO EXISTE EN ESA RUTA."
    Write-Host "   Buscando en toda la cache..."
    # Fallback search... (Omitido por brevedad, confiamos en el log)
}
