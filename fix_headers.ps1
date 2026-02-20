$ErrorActionPreference = "Stop"
$GradleCache = "$env:USERPROFILE\.gradle\caches"
$FilePattern = "graphicsConversions.h"

Write-Host "🔍 Buscando $FilePattern en TODA la cache de Gradle..."
Write-Host "   (Esto puede tomar un momento)..."

$files = Get-ChildItem -Path $GradleCache -Filter $FilePattern -Recurse -ErrorAction SilentlyContinue

if ($files) {
    Write-Host "✅ Se encontraron $($files.Count) candidatos."
    
    foreach ($file in $files) {
        $path = $file.FullName
        $content = Get-Content -LiteralPath $path -Raw
        $newContent = $content
        $modified = $false

        # Estrategia: Reemplazar std::format por folly::format(...).str()
        # Esto soluciona ambos errores: el de espacio de nombres y el de tipo de retorno.
        
        # Caso 1: Original std::format
        if ($newContent.Contains("std::format")) {
            $newContent = $newContent.Replace("std::format", "folly::format")
            # Y agregamos .str() al final de la linea si no esta
            # Asumimos que la linea termina en );
            # Reemplazo mas especifico con regex para ser seguro
            $newContent = $newContent -replace 'folly::format\("([^"]+)", dimension\.value\)', 'folly::format("$1", dimension.value).str()'
            
            $modified = $true
            Write-Host "   🔧 [FIX STD] $path"
        }
        
        # Caso 2: Intento fallido previo (solo reemplazo a folly::format o folly::sformat)
        # Si tiene folly::format pero NO tiene .str(), agregarlo.
        if ($newContent.Contains("folly::format") -and -not $newContent.Contains(".str()")) {
            $newContent = $newContent -replace 'folly::format\("([^"]+)", dimension\.value\)', 'folly::format("$1", dimension.value).str()'
            $modified = $true
            Write-Host "   🔧 [FIX PREVIO] $path"
        }

        # Asegurar include
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
    Write-Host "⚠️ No se encontraron archivos. ¿Esta vacia la cache?"
}
