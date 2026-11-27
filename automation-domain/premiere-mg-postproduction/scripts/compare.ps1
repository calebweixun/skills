<#
.SYNOPSIS
    Places the same crop from several frames side by side (before / after ...).

.EXAMPLE
    pwsh -File compare.ps1 -Images before.png,after.png -Crop 1330,250,440,380 -Out cmp.png

    Crop is x,y,width,height in source pixels, drawn at 1:1 so sharpness
    differences stay visible. Omit -Crop to compare whole frames scaled to 640x360.
#>
param(
    [Parameter(Mandatory)] [string[]] $Images,
    [int[]] $Crop,
    [Parameter(Mandatory)] [string] $Out,
    [int] $Gap = 10
)
Add-Type -AssemblyName System.Drawing
$whole = -not $Crop
if ($whole) { $w = 640; $h = 360 } else { $w = $Crop[2]; $h = $Crop[3] }
$canvas = New-Object System.Drawing.Bitmap (($w + $Gap) * $Images.Count - $Gap), $h
$g = [System.Drawing.Graphics]::FromImage($canvas)
$g.Clear([System.Drawing.Color]::Gray)
$i = 0
foreach ($f in $Images) {
    $img = [System.Drawing.Image]::FromFile((Resolve-Path $f).Path)
    $dst = New-Object System.Drawing.Rectangle ($i * ($w + $Gap)), 0, $w, $h
    if ($whole) { $g.DrawImage($img, $dst) }
    else { $g.DrawImage($img, $dst, (New-Object System.Drawing.Rectangle $Crop[0], $Crop[1], $w, $h), [System.Drawing.GraphicsUnit]::Pixel) }
    $img.Dispose(); $i++
}
$fmt = if ($Out -match '\.jpe?g$') { [System.Drawing.Imaging.ImageFormat]::Jpeg } else { [System.Drawing.Imaging.ImageFormat]::Png }
$canvas.Save([System.IO.Path]::GetFullPath($Out), $fmt)
$g.Dispose(); $canvas.Dispose()
Write-Host "saved $Out"
