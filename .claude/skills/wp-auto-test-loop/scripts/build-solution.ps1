# build-solution.ps1 — locate MSBuild via vswhere and compile the solution.
# Exit codes: 0 = build succeeded, 1 = build failed (compile errors), 2 = environment error.
param(
    [Parameter(Mandatory = $true)][string]$SolutionPath,
    [string]$Configuration = "Debug",
    [string]$MsBuildPath   # optional override; skips vswhere detection
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $SolutionPath)) {
    Write-Host "ERROR: solution not found: $SolutionPath"
    exit 2
}

if (-not $MsBuildPath) {
    $vswhere = Join-Path ${env:ProgramFiles(x86)} "Microsoft Visual Studio\Installer\vswhere.exe"
    if (-not (Test-Path $vswhere)) {
        Write-Host "ERROR: vswhere.exe not found at '$vswhere'. Is Visual Studio installed on this machine?"
        exit 2
    }
    # Prefer VS2017 (MSBuild 15) per the project stack; fall back to the newest installed.
    $MsBuildPath = & $vswhere -version "[15.0,16.0)" -products * -requires Microsoft.Component.MSBuild `
        -find "MSBuild\**\Bin\MSBuild.exe" 2>$null | Select-Object -First 1
    if (-not $MsBuildPath) {
        $MsBuildPath = & $vswhere -latest -products * -requires Microsoft.Component.MSBuild `
            -find "MSBuild\**\Bin\MSBuild.exe" 2>$null | Select-Object -First 1
    }
    if (-not $MsBuildPath) {
        Write-Host "ERROR: MSBuild not found via vswhere."
        exit 2
    }
}

Write-Host "MSBuild : $MsBuildPath"
Write-Host "Solution: $SolutionPath"
Write-Host "Config  : $Configuration"
Write-Host "----------------------------------------"

& $MsBuildPath $SolutionPath /nologo /m /v:minimal /p:Configuration=$Configuration
$buildExit = $LASTEXITCODE

Write-Host "----------------------------------------"
if ($buildExit -eq 0) {
    Write-Host "BUILD SUCCEEDED"
    exit 0
} else {
    Write-Host "BUILD FAILED (msbuild exit $buildExit) — error lines above follow the pattern: path\file.cs(line,col): error CSxxxx: message"
    exit 1
}
