# Script de Auto-Respaldo para Derechos Laborales MX

$logFile = Join-Path $PSScriptRoot "backup_log.txt"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

function Write-Log {
    param($message)
    $logMessage = "[$timestamp] $message"
    $logMessage | Out-File -FilePath $logFile -Append
    Write-Host $logMessage
}

Write-Log "Iniciando proceso de auto-respaldo..."

# 1. Respaldo Raíz (Backend y principal)
Set-Location "c:\Users\SAVE Company\.gemini\antigravity\playground\primal-expanse\derechos-laborales-mx"
Write-Log "Procesando Raíz..."
git add .
$status = git status --porcelain
if ($status) {
    git commit -m "AUTO-BACKUP: Respaldo automático programado ($timestamp)"
    Write-Log "Commmit realizado en Raíz."
}
else {
    Write-Log "No hay cambios en Raíz."
}

# 2. Respaldo Frontend
Set-Location "frontend"
Write-Log "Procesando Frontend..."
git add .
$statusFront = git status --porcelain
if ($statusFront) {
    git commit -m "AUTO-BACKUP: Respaldo automático programado frontend ($timestamp)"
    Write-Log "Commmit realizado en Frontend."
}
else {
    Write-Log "No hay cambios en Frontend."
}

Write-Log "Proceso de auto-respaldo finalizado."
