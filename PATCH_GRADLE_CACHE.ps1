$ErrorActionPreference = "Stop"

# Ruta dinamica al cache de Gradle
$GradleCache = "$env:USERPROFILE\.gradle\caches"
$FileName = "graphicsConversions.h"

Write-Host "🕵️ Buscando $FileName en: $GradleCache"

if (-not (Test-Path $GradleCache)) {
    Write-Host "❌ No existe la carpeta de cache de Gradle."
    exit 1
}

# Buscar archivos recursivamente
$files = Get-ChildItem -Path $GradleCache -Filter $FileName -Recurse -ErrorAction SilentlyContinue

if ($files.Count -eq 0) {
    Write-Host "❌ No se encontró el archivo en ninguna subcarpeta."
    exit 0
}

Write-Host "✅ Se encontraron $($files.Count) archivos. Procesando..."

foreach ($file in $files) {
    Write-Host ">> Editando: $($file.FullName)"
    
    # Leer contenido
    $content = Get-Content -LiteralPath $file.FullName -Raw
    $newContent = $content
    $modified = $false

    # Reemplazo principal: std::format -> folly::sformat
    if ($newContent.Contains("std::format")) {
        $newContent = $newContent.Replace("std::format", "folly::sformat")
        $modified = $true
        Write-Host "   [Corregido] std::format -> folly::sformat"
    }

    # Agregar include si falta
    if (-not $newContent.Contains("folly/Format.h")) {
        $HeaderLine = "#include <folly/Format.h>"
        $newContent = "$HeaderLine`r`n$newContent"
        $modified = $true
        Write-Host "   [Agregado] #include <folly/Format.h>"
    }

    # Guardar solo si hubo cambios
    if ($modified) {
        Set-Content -LiteralPath $file.FullName -Value $newContent -NoNewline
        Write-Host "   💾 Guardado exitosamente."
    }
    else {
        Write-Host "   ℹ️ Sin cambios pendientes."
    }
}

Write-Host "🎉 TERMINADO. Ahora puedes compilar."
