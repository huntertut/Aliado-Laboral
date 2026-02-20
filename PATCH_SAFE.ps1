$ErrorActionPreference = "Stop"
$GradleCache = "$env:USERPROFILE\.gradle\caches"
$FileName = "graphicsConversions.h"

Write-Host "🔍 SAFE PATCHER: Buscando $FileName..."

$files = Get-ChildItem -Path $GradleCache -Filter $FileName -Recurse -ErrorAction SilentlyContinue

if (-not $files) {
    Write-Host "⚠️ No se encontraron archivos."
    # No fallamos, quizas limpio cache recientemente
    exit 0
}

foreach ($file in $files) {
    Write-Host "👉 Procesando: $($file.FullName)"
    $content = Get-Content -LiteralPath $file.FullName -Raw
    $modified = $false

    # FIX 1: Include
    # Usamos -notmatch que es mas seguro que .Contains()
    if ($content -notmatch "include <folly/Format.h>") {
        $content = "#include <folly/Format.h>`r`n" + $content
        $modified = $true
        Write-Host "   + Include agregado"
    }

    # FIX 2: std::format -> folly::format
    if ($content -match "return std::format") {
        $content = $content -replace "return std::format", "return folly::format"
        $modified = $true
        Write-Host "   + Reemplazo base aplicado"
    }

    # FIX 3: .str()
    # Regex: Busca 'folly::format(...)' que NO tenga .str() despues
    if ($content -match "folly::format" -and $content -notmatch "\.str\(\)") {
        $content = $content -replace '(folly::format\([^;]+)\)', '$1).str()'
        $modified = $true
        Write-Host "   + Conversion .str() aplicada"
    }

    if ($modified) {
        Set-Content -LiteralPath $file.FullName -Value $content -NoNewline
        Write-Host "   💾 Guardado."
    }
}
