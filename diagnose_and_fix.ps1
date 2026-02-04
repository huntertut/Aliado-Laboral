$ErrorActionPreference = "Stop"
$GradleCache = "$env:USERPROFILE\.gradle\caches"
$FilePattern = "graphicsConversions.h"

Write-Host "🔍 Buscando $FilePattern en Gradle Cache..."

$files = Get-ChildItem -Path $GradleCache -Filter $FilePattern -Recurse -ErrorAction SilentlyContinue

if ($files) {
    Write-Host "✅ Se encontraron $($files.Count) archivos."
    
    foreach ($file in $files) {
        $path = $file.FullName
        Write-Host "📂 Procesando: $path"
        
        $lines = Get-Content -LiteralPath $path
        $newLines = @()
        $modified = $false
        $hasInclude = $false

        foreach ($line in $lines) {
            # Check for include
            if ($line -match "folly/Format.h") { $hasInclude = $true }

            # Target line detection
            if ($line -match "return.*format.*dimension.value") {
                Write-Host "   🔴 PRE-FIX: $line"
                
                # FORCE REPLACEMENT ignoring current content
                $newLine = '    return folly::format("{}%", dimension.value).str();'
                $newLines += $newLine
                $modified = $true
                
                Write-Host "   🟢 POST-FIX: $newLine"
            }
            else {
                $newLines += $line
            }
        }

        if (-not $hasInclude) {
            $newLines = @("#include <folly/Format.h>") + $newLines
            Write-Host "   ➕ Agregado include folly"
            $modified = $true
        }

        if ($modified) {
            Set-Content -LiteralPath $path -Value $newLines
            Write-Host "   💾 Archivo guardado."
        }
        else {
            Write-Host "   ℹ️ Sin cambios necesarios."
        }
    }
}
else {
    Write-Host "⚠️ No se encontraron archivos graphicsConversions.h"
}
