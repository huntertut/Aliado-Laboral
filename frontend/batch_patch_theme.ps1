
$sourceDir = "c:\Users\Save Company\.gemini\antigravity\playground\primal-expanse\derechos-laborales-mx\frontend\src"
$files = Get-ChildItem -Path $sourceDir -Recurse -Filter "*.tsx"

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw
    $originalContent = $content
    
    # 1. Replace the import statement
    # Pattern: import { theme } from '...'; -> import { AppTheme } from '...';
    if ($content -match "import\s+\{\s*theme\s*\}\s+from") {
        $content = $content -replace "import\s+\{\s*theme\s*\}\s+from", "import { AppTheme } from"
    }
    
    # 2. Replace usages of theme.
    # Pattern: theme.colors -> AppTheme.colors (but avoid AppTheme.AppTheme.colors if run twice)
    # We use a negative lookbehind just in case, but simpler is to check strict 'theme.'
    
    # Simple regex to replace 'theme.' with 'AppTheme.' where not preceded by 'App'
    # But PowerShell regex is limited. 
    # Let's simple replace 'theme.' verify it's not part of a larger word or already AppTheme.
    
    # Strategy: 
    # Find whole word 'theme' followed by dot, replace with 'AppTheme'
    # But wait, what if it's 'AppTheme'? 'AppTheme' contains 'theme'.
    # So we match word boundary \btheme\.
    
    $content = $content -replace "\btheme\.", "AppTheme."
    
    # 3. If we replaced the import but missed some 'theme' bare usages (e.g. `const { colors } = theme;`)
    # This script focuses on the standard pattern `theme.colors` or `theme.spacing`.
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content
        Write-Host "Patched: $($file.Name)"
    }
}

Write-Host "Batch patch complete."
