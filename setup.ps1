Write-Host "Setting up TrackSimpli frontend structure..." -ForegroundColor Cyan

$base = "frontend"

$folders = @(
    "$base/screens",
    "$base/css",
    "$base/js"
)

$files = @{
    "$base/index.html"              = "<!DOCTYPE html>`n<html><head><meta charset='utf-8'><title>TrackSimpli</title></head><body></body></html>"
    "$base/screens/dashboard.html"  = "<!-- Dashboard screen -->"
    "$base/screens/test.html"       = "<!-- Camera test screen -->"
    "$base/screens/history.html"    = "<!-- History screen -->"
    "$base/screens/settings.html"   = "<!-- Settings screen -->"
    "$base/css/base.css"            = "/* Base styles */"
    "$base/css/layout.css"          = "/* Layout styles */"
    "$base/css/components.css"      = "/* UI components */"
    "$base/js/app.js"               = "// App entry logic"
    "$base/js/storage.js"           = "// localStorage helpers"
    "$base/js/utils.js"             = "// time, math helpers"
}

# Create folders
foreach ($folder in $folders) {
    if (-not (Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder | Out-Null
        Write-Host "Created folder: $folder" -ForegroundColor Green
    } else {
        Write-Host "Folder exists: $folder" -ForegroundColor DarkGray
    }
}

# Create files if they don’t exist
foreach ($file in $files.Keys) {
    if (-not (Test-Path $file)) {
        $files[$file] | Out-File -Encoding utf8 $file
        Write-Host "Created file: $file" -ForegroundColor Green
    } else {
        Write-Host "File exists: $file" -ForegroundColor DarkGray
    }
}

Write-Host "Setup complete." -ForegroundColor Cyan
