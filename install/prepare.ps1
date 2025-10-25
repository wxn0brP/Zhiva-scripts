if (-not (Get-Command bun -ErrorAction SilentlyContinue)) {
    Write-Host "[Z-SCR-6-01] bun is not installed."
    irm https://bun.sh/install.ps1 | iex
    $env:Path += ";$HOME\.bun\bin"
    Write-Host "[Z-SCR-6-02] Added ~/.bun/bin to PATH for current session."
    Write-Host "[Z-SCR-6-03] 💜 Don't forget to add '$HOME\.bun\bin' to your PATH environment variable."
} else {
    Write-Host "[Z-SCR-6-04] 💜 bun is installed."
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "[Z-SCR-6-05] Error: git is not installed. Please install git manually."
    exit 1
} else {
    Write-Host "[Z-SCR-6-06] 💜 git is installed."
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
Write-Host "[Z-SCR-6-07] 💜 Zhiva-scripts is installed."

$cmdContentStartup = @"
@echo off
bun run "%USERPROFILE%\.zhiva\scripts\zhiva\startup.ts" %*
"@

$cmdContentInstall = @"
@echo off
bun run "%USERPROFILE%\.zhiva\scripts\zhiva\install.ts" %*
"@

$cmdContentStartup | Set-Content -Path (Join-Path $zhivaBinPath "zhiva-startup.cmd") -Force
$cmdContentInstall | Set-Content -Path (Join-Path $zhivaBinPath "zhiva-install.cmd") -Force

Write-Host "[Z-SCR-6-08] 💜 Zhiva-startup is installed."
