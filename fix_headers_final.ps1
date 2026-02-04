$ErrorActionPreference = "Stop"
$GradleCache = "$env:USERPROFILE\.gradle\caches"
$FilePattern = "graphicsConversions.h"

Write-Host "🔍 Buscando $FilePattern en TODA la cache de Gradle..."

$files = Get-ChildItem -Path $GradleCache -Filter $FilePattern -Recurse -ErrorAction SilentlyContinue

if ($files) {
    Write-Host "✅ Se encontraron $($files.Count) candidatos."
    
    foreach ($file in $files) {
        $path = $file.FullName
        $content = Get-Content -LiteralPath $path -Raw
        $newContent = $content
        $modified = $false

        # Estrategia: Reemplazar std::format por folly::format(...).str()
        
        if ($newContent.Contains("std::format")) {
            $newContent = $newContent.Replace("std::format", "folly::format")
            $newContent = $newContent -replace 'folly::format\("([^"]+)", dimension\.value\)', 'folly::format("$1", dimension.value).str()'
            $modified = $true
            Write-Host "   🔧 [FIX STD] $path"
        }
        
        if ($newContent.Contains("folly::format") -and -not $newContent.Contains(".str()")) {
            $newContent = $newContent -replace 'folly::format\("([^"]+)", dimension\.value\)', 'folly::format("$1", dimension.value).str()'
            $modified = $true
            Write-Host "   🔧 [FIX PREVIO] $path"
        }

        if (-not $newContent.Contains("folly/Format.h")) {
            $newContent = "#include <folly/Format.h>`r`n" + $newContent
            $modified = $true
        }

        if ($modified) {
            Set-Content -LiteralPath $path -Value $newContent -NoNewline
            Write-Host "      💾 Guardado."
        }
    }
}
else {
    Write-Host "⚠️ No se encontraron archivos."
}
