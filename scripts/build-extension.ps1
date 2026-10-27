# Builds the Chrome / Edge extension from the web app into dist\extension (load it with
# chrome://extensions -> Developer mode -> Load unpacked) and dist\live-translate-extension.zip.
# The extension reuses the web app files as they are; extension\ext.js adds tab-audio capture.
$root = Resolve-Path "$PSScriptRoot\.."
$dist = Join-Path $root 'dist'
$out = Join-Path $dist 'extension'
$zip = Join-Path $dist 'live-translate-extension.zip'

if (Test-Path $out) { Remove-Item -Recurse -Force $out }
New-Item -ItemType Directory -Force "$out\assets" | Out-Null

# Web app files (no service worker / PWA manifest: the extension ships its own files).
Copy-Item "$root\index.html" $out
foreach ($dir in 'css', 'js', 'icons') { Copy-Item -Recurse "$root\assets\$dir" "$out\assets\$dir" }
# Extension files: manifest, background worker, ext.js, microphone permission page.
Copy-Item "$root\extension\*" $out -Exclude 'README.md'

# Load ext.js right before app.js.
$html = Get-Content -Raw -Encoding UTF8 "$out\index.html"
$appTag = '<script src="assets/js/app.js"></script>'
if (-not $html.Contains($appTag)) { Write-Error "index.html: '$appTag' not found"; exit 1 }
$html = $html.Replace($appTag, "<script src=`"ext.js`"></script>`n  $appTag")
[System.IO.File]::WriteAllText("$out\index.html", $html, (New-Object System.Text.UTF8Encoding $false))

# Zip with forward-slash entry names (Compress-Archive on PowerShell 5.1 writes backslashes,
# which the Chrome Web Store rejects).
if (Test-Path $zip) { Remove-Item -Force $zip }
Add-Type -AssemblyName System.IO.Compression, System.IO.Compression.FileSystem
$archive = [System.IO.Compression.ZipFile]::Open($zip, 'Create')
try {
  Get-ChildItem -Recurse -File $out | ForEach-Object {
    $name = $_.FullName.Substring($out.Length + 1).Replace('\', '/')
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $_.FullName, $name) | Out-Null
  }
} finally { $archive.Dispose() }

$version = (Get-Content -Raw "$out\manifest.json" | ConvertFrom-Json).version
Write-Host "Extension $version -> $out"
Write-Host "Zip -> $zip"
