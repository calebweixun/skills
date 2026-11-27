<#
.SYNOPSIS
    Measures color, brightness, clipping, and sharpness in regions of an exported frame.

.EXAMPLE
    pwsh -File measure.ps1 -Image f_90.png -Regions "face=1470,390,1570,450;shirt=1290,700,1410,850;bg=1250,150,1400,250" -Sharpness "eyes=1430,320,1610,420"

    Regions use x0,y0,x1,y1 in image pixels. Y is Rec.709 luma (0-255).
    clip% counts pixels with R and G both >= 250. Sharpness is the mean squared
    Laplacian of the green channel; compare it only before vs after on the same
    region.
#>
param(
    [Parameter(Mandatory)] [string] $Image,
    [string] $Regions = '',
    [string] $Sharpness = '',
    [int] $Step = 3
)
Add-Type -AssemblyName System.Drawing
$bmp = [System.Drawing.Bitmap]::new((Resolve-Path $Image).Path)

function Parse([string] $spec) {
    foreach ($part in ($spec -split ';' | Where-Object { $_ })) {
        $name, $coords = $part -split '=', 2
        $c = [int[]]($coords -split ',')
        [pscustomobject]@{ Name = $name; X0 = $c[0]; Y0 = $c[1]; X1 = $c[2]; Y1 = $c[3] }
    }
}

foreach ($r in Parse $Regions) {
    $sr = 0; $sg = 0; $sb = 0; $n = 0; $clip = 0
    for ($x = $r.X0; $x -lt $r.X1; $x += $Step) {
        for ($y = $r.Y0; $y -lt $r.Y1; $y += $Step) {
            $p = $bmp.GetPixel($x, $y)
            $sr += $p.R; $sg += $p.G; $sb += $p.B; $n++
            if ($p.R -ge 250 -and $p.G -ge 250) { $clip++ }
        }
    }
    $R = $sr / $n; $G = $sg / $n; $B = $sb / $n
    '{0,-10} R{1,4:N0} G{2,4:N0} B{3,4:N0}  Y{4,4:N0}  R/G {5:N2}  clip {6:P0}' -f `
        $r.Name, $R, $G, $B, (0.2126 * $R + 0.7152 * $G + 0.0722 * $B), ($R / [math]::Max($G, 1)), ($clip / $n)
}

foreach ($r in Parse $Sharpness) {
    $s = 0.0; $n = 0
    for ($y = $r.Y0 + 1; $y -lt $r.Y1 - 1; $y += 2) {
        for ($x = $r.X0 + 1; $x -lt $r.X1 - 1; $x += 2) {
            $l = 4 * $bmp.GetPixel($x, $y).G - $bmp.GetPixel($x - 1, $y).G - $bmp.GetPixel($x + 1, $y).G `
                 - $bmp.GetPixel($x, $y - 1).G - $bmp.GetPixel($x, $y + 1).G
            $s += $l * $l; $n++
        }
    }
    '{0,-10} sharpness {1:N1}' -f $r.Name, ($s / $n)
}
$bmp.Dispose()
