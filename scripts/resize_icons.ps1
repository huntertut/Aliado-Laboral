param(
    [string]$sourcePath = "C:\Users\Save Company\.gemini\antigravity\brain\6d51d958-0c78-4126-bb17-6b655e3ec180\media__1776103194661.png",
    [string]$resPath = "C:\dev\aliado-laboral\frontend\android\app\src\main\res"
)

Add-Type -AssemblyName System.Drawing

$sizes = @{
    "mipmap-mdpi" = 48
    "mipmap-hdpi" = 72
    "mipmap-xhdpi" = 96
    "mipmap-xxhdpi" = 144
    "mipmap-xxxhdpi" = 192
}

try {
    $sourceImg = [System.Drawing.Image]::FromFile($sourcePath)

    foreach ($folder in $sizes.Keys) {
        $size = $sizes[$folder]
        $folderPath = Join-Path $resPath $folder
        if (-not (Test-Path $folderPath)) {
            New-Item -ItemType Directory -Force -Path $folderPath | Out-Null
        }

        # Create bitmap with the precise size
        $bitmap = New-Object System.Drawing.Bitmap $size, $size
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        
        # High quality resizing
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        
        $graphics.DrawImage($sourceImg, 0, 0, $size, $size)

        # Remove existing icons
        $oldWebps = Get-ChildItem -Path $folderPath -Filter "ic_launcher*.webp" -ErrorAction SilentlyContinue
        foreach ($f in $oldWebps) { Remove-Item $f.FullName -Force }
        $oldPngs = Get-ChildItem -Path $folderPath -Filter "ic_launcher*.png" -ErrorAction SilentlyContinue
        foreach ($f in $oldPngs) { Remove-Item $f.FullName -Force }

        # Save new images
        $bitmap.Save((Join-Path $folderPath "ic_launcher.png"), [System.Drawing.Imaging.ImageFormat]::Png)
        $bitmap.Save((Join-Path $folderPath "ic_launcher_round.png"), [System.Drawing.Imaging.ImageFormat]::Png)
        $bitmap.Save((Join-Path $folderPath "ic_launcher_foreground.png"), [System.Drawing.Imaging.ImageFormat]::Png)

        $graphics.Dispose()
        $bitmap.Dispose()
        
        Write-Host "Generated $size x $size for $folder"
    }

    $sourceImg.Dispose()
    Write-Host "Android icons fully regenerated."
} catch {
    Write-Error "Error resizing image: $_"
}
