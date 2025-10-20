if (-not (Get-Command bun -ErrorAction SilentlyContinue)) {
    Write-Host "[Z-SCR-6-01] bun is not installed."
    $choice = Read-Host "Do you want to install bun? (y/n)"
    if ($choice -match "^[Yy]$") {
        Write-Host "[Z-SCR-6-02] Installing bun..."
        irm https://bun.sh/install.ps1 | iex
        $env:Path += ";$HOME\.bun\bin"
        Write-Host "[Z-SCR-6-03] Added ~/.bun/bin to PATH for current session."
        Write-Host "[Z-SCR-6-04] 💜 Don't forget to add '$HOME\.bun\bin' to your PATH environment variable."
    } else {
        Write-Host "[Z-SCR-6-05] Skipped bun installation."
        exit 1
    }
} else {
    Write-Host "[Z-SCR-6-06] 💜 bun is installed."
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "[Z-SCR-6-07] Error: git is not installed. Please install git manually."
    exit 1
} else {
    Write-Host "[Z-SCR-6-08] 💜 git is installed."
}

$zhivaPath = Join-Path $HOME ".zhiva"
$zhivaBinPath = Join-Path $zhivaPath "bin"
New-Item -ItemType Directory -Path $zhivaBinPath -Force | Out-Null

$zhivaScriptsPath = Join-Path $zhivaPath "scripts"
if (-not (Test-Path $zhivaScriptsPath)) {
    git clone https://github.com/wxn0brP/Zhiva-scripts.git $zhivaScriptsPath
} else {
    git -C $zhivaScriptsPath pull
}

Set-Location (Join-Path $zhivaScriptsPath "zhiva")
bun install --production --force
Write-Host "[Z-SCR-6-09] 💜 Zhiva-scripts is installed."

New-Item -ItemType SymbolicLink -Path (Join-Path $zhivaBinPath "zhiva-startup") -Target (Join-Path $zhivaScriptsPath "zhiva/startup.ts") -Force | Out-Null
New-Item -ItemType SymbolicLink -Path (Join-Path $zhivaBinPath "zhiva-install") -Target (Join-Path $zhivaScriptsPath "zhiva/install.ts") -Force | Out-Null

Write-Host "[Z-SCR-6-10] 💜 Zhiva-startup is installed."
