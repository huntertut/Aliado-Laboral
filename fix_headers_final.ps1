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

        $target = 'return std::format("{}%", dimension.value);'
        $replacement = 'return std::to_string(dimension.value) + "%";'

        if ($newContent.Contains($target)) {
            $newContent = $newContent.Replace($target, $replacement)
            $modified = $true
            Write-Host "   🔧 [FIX APPLIED] $path"
        }
        
        if ($modified) {
            Set-Content -LiteralPath $path -Value $newContent -NoNewline
            Write-Host "      💾 Guardado."
        }
    }
}
else {
    Write-Host "⚠️ No se encontró graphicsConversions.h"
}
