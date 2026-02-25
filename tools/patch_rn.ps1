$ErrorActionPreference = "Stop"

function Patch-File($path) {
    Write-Host "   Patching: $path"
    try {
        if ((Get-ItemProperty $path).Attributes -match "ReadOnly") {
            Set-ItemProperty -Path $path -Name Attributes -Value ([IO.FileAttributes]::Normal)
        }
        $content = Get-Content $path -Raw
        
        # Check specifically for the failing line with loose matching
        if ($content -match 'std::format\s*\(') {
            Write-Host "   >> [INFO] Found std::format usage. Patching..."
            # Replace the specific known bad pattern
            $content = $content -replace 'return std::format\("{}%", dimension.value\);', 'return std::to_string(dimension.value) + "%";'
            
            # Double check if replacement worked (in case whitespace mismatch)
            if ($content -match 'std::format') {
                Write-Host "   >> [WARN] Regex strict match failed. Attempting brute force..."
                $content = $content.Replace('return std::format("{}%", dimension.value);', 'return std::to_string(dimension.value) + "%";')
            }
            
            Set-Content -Path $path -Value $content -NoNewline -Force
            Write-Host "   >> [SUCCESS] Patch Applied."
            return $true
        }
        elseif ($content -match 'std::to_string\(dimension\.value\)') {
            Write-Host "   >> [INFO] Already Patched (Verified)."
            return $false
        }
        else {
            Write-Host "   >> [WARNING] Target code pattern not found."
            return $false
        }
    }
    catch {
        Write-Host "   >> [ERROR] $($_.Exception.Message)"
        return $false
    }
}

# 1. Patch Local Node Modules (Just in case)
Write-Host "1. Checking Local node_modules..."
$localPath = "C:\rn_safe_build\node_modules\react-native\ReactCommon\react\renderer\core\graphicsConversions.h"
if (Test-Path $localPath) { Patch-File $localPath }

# 2. SURGICAL AAR PATCHING (The "Jar" Method)
Write-Host "`n2. Surgical AAR Patching (using jar.exe)..."
$aarPathItem = Get-ChildItem -Path "$env:USERPROFILE\.gradle\caches\modules-2\files-2.1" -Recurse -Filter "react-android-0.81.5-release.aar" | Select-Object -First 1

if ($aarPathItem) {
    $aarPath = $aarPathItem.FullName
    Write-Host "   Found AAR: $aarPath"
    
    # Define internal path inside the AAR (ZIP structure)
    $internalPath = "prefab/modules/reactnative/include/react/renderer/core/graphicsConversions.h"
    
    # Create temp workspace
    $workDir = Join-Path $env:TEMP "rn_jar_patch_$(Get-Random)"
    New-Item -ItemType Directory -Force -Path $workDir | Out-Null
    
    Push-Location $workDir
    try {
        # 2a. COPY AAR to Temp to avoid "Space in Path" issues with jar.exe
        # The 'jar' tool can be finicky with spaces in arguments on Windows.
        Write-Host "   Copying AAR to temp workspace to avoid path issues..."
        $tempAarName = "target.aar"
        Copy-Item -Path $aarPath -Destination $tempAarName
        
        # 2b. EXTRACT specific file from local temp AAR
        # jar xf <file> <path-to-extract>
        Write-Host "   Extracting internal header..."
        $jarArgs = @("xf", $tempAarName, $internalPath)
        $process = Start-Process -FilePath "jar" -ArgumentList $jarArgs -NoNewWindow -PassThru -Wait
        
        if ($process.ExitCode -ne 0) {
            throw "Jar extraction failed with exit code $($process.ExitCode)"
        }

        # 2c. PATCH the extracted file
        $localHeaderPath = Join-Path $workDir $internalPath
        if (Test-Path $localHeaderPath) {
            $patched = Patch-File $localHeaderPath
             
            if ($patched) {
                # 2d. UPDATE the temp AAR with the patched file
                # jar uf <file> <input-file>
                Write-Host "   Injecting patched header back into temp AAR..."
                $jarUpdateArgs = @("uf", $tempAarName, $internalPath)
                $updateProcess = Start-Process -FilePath "jar" -ArgumentList $jarUpdateArgs -NoNewWindow -PassThru -Wait
                 
                if ($updateProcess.ExitCode -eq 0) {
                    # 2e. OVERWRITE original AAR with our patched version
                    Write-Host "   Overwriting original AAR in cache..."
                    Copy-Item -Path $tempAarName -Destination $aarPath -Force
                    Write-Host "   >> [SUCCESS] AAR Source Updated! Future extractions will be correct."
                     
                }
                else {
                    Write-Host "   [ERROR] Jar update failed: $($updateProcess.ExitCode)"
                }
            }
            else {
                Write-Host "   >> [INFO] Extracted header was already patched."
            }
        }
        else {
            Write-Host "   [ERROR] Failed to extract header from AAR."
        }
    }
    catch {
        Write-Host "   [ERROR] Jar Operation Failed: $_"
    }
    finally {
        Pop-Location
        Remove-Item $workDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}
else {
    Write-Host "   [ERROR] AAR Not Found in Gradle Cache!"
}

# 3. Patch Existing Transforms (Safety Net)
# Even if we updated the AAR, old transforms might persist. We hit them too.
Write-Host "`n3. Scanning and Patching Extracted Transforms (Safety Net)..."
$gradleCacheParams = @{
    Path        = "$env:USERPROFILE\.gradle\caches"
    Filter      = "graphicsConversions.h"
    Recurse     = $true
    ErrorAction = "SilentlyContinue"
}

$cachedInstances = Get-ChildItem @gradleCacheParams | Where-Object { $_.FullName -like "*react-android*" }
if ($cachedInstances) {
    Write-Host "   Found $($cachedInstances.Count) extracted instances."
    foreach ($item in $cachedInstances) {
        Patch-File $item.FullName | Out-Null
    }
}
else {
    Write-Host "   >> [INFO] No extracted headers found in transforms."
}

Write-Host "`n[DONE] React Native Patch Process Complete."
