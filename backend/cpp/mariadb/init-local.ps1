$ErrorActionPreference = 'Stop'

$rootDir = Split-Path -Parent $PSScriptRoot
$mariaRoot = Get-ChildItem -LiteralPath $PSScriptRoot -Directory | Where-Object { $_.Name -like 'mariadb-*' } | Select-Object -First 1
if (-not $mariaRoot) {
  throw 'MariaDB package folder not found.'
}

$sourceBaseDir = $mariaRoot.FullName
$asciiRoot = Join-Path ([System.IO.Path]::GetTempPath()) 'offerpilot-cpp-mariadb'
$baseDir = Join-Path $asciiRoot 'package'
$binDir = Join-Path $baseDir 'bin'
$dataDir = Join-Path $asciiRoot 'data'
$tmpDir = Join-Path $asciiRoot 'tmp'
$runtimeDir = Join-Path $asciiRoot 'runtime'
$installDbExe = Join-Path $binDir 'mysql_install_db.exe'
$schemaFile = Join-Path $PSScriptRoot 'schema-offerpilot.sql'
$myIniPath = Join-Path $runtimeDir 'my.ini'

$configBaseDir = $baseDir -replace '\\', '/'
$configDataDir = $dataDir -replace '\\', '/'
$configTmpDir = $tmpDir -replace '\\', '/'

New-Item -ItemType Directory -Force -Path $asciiRoot, $dataDir, $tmpDir, $runtimeDir | Out-Null
if (-not (Test-Path $baseDir)) {
  New-Item -ItemType Junction -Path $baseDir -Target $sourceBaseDir | Out-Null
}

$myIni = @"
[mysqld]
basedir=$configBaseDir
datadir=$configDataDir
port=3306
bind-address=127.0.0.1
character-set-server=utf8mb4
collation-server=utf8mb4_unicode_ci
max_connections=50
tmpdir=$configTmpDir
socket=offerpilot-mariadb

[client]
port=3306
default-character-set=utf8mb4
"@

# MariaDB on Windows is sensitive to BOM in my.ini; write plain ASCII to avoid
# "Found option without preceding group" during startup.
Set-Content -LiteralPath $myIniPath -Value $myIni -Encoding ASCII

$systemDbPath = Join-Path $dataDir 'mysql'
if (-not (Test-Path $systemDbPath)) {
  Push-Location $binDir
  try {
    & $installDbExe --datadir="$dataDir" --password="" --port=3306
  }
  finally {
    Pop-Location
  }
}

Write-Host "[OK] MariaDB local runtime prepared."
Write-Host "  baseDir=$baseDir"
Write-Host "  dataDir=$dataDir"
Write-Host "  myIni=$myIniPath"
Write-Host "  schema=$schemaFile"
