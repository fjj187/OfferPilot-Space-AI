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
$serverExe = Join-Path $binDir 'mariadbd.exe'
$clientExe = Join-Path $binDir 'mysql.exe'
$adminExe = Join-Path $binDir 'mariadb-admin.exe'
$runtimeDir = Join-Path $asciiRoot 'runtime'
$myIniPath = Join-Path $runtimeDir 'my.ini'
$schemaFile = Join-Path $PSScriptRoot 'schema-offerpilot.sql'
$pidFile = Join-Path $runtimeDir 'mariadb-server.pid'

& (Join-Path $PSScriptRoot 'init-local.ps1')

try {
  & $adminExe --protocol=tcp --host=127.0.0.1 --port=3306 --user=root ping | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw 'MariaDB ping failed.'
  }
  Write-Host '[INFO] MariaDB already running on 127.0.0.1:3306'
}
catch {
  $process = Start-Process -FilePath $serverExe -ArgumentList @("--defaults-file=$myIniPath", '--standalone', '--console') -WorkingDirectory $baseDir -WindowStyle Hidden -PassThru
  Set-Content -LiteralPath $pidFile -Value $process.Id -Encoding ASCII

  $started = $false
  for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Milliseconds 500
    try {
      & $adminExe --protocol=tcp --host=127.0.0.1 --port=3306 --user=root ping | Out-Null
      if ($LASTEXITCODE -ne 0) {
        throw 'MariaDB ping failed.'
      }
      $started = $true
      break
    }
    catch {
    }
  }

  if (-not $started) {
    throw 'MariaDB did not start successfully.'
  }
}

Get-Content -LiteralPath $schemaFile -Raw | & $clientExe --protocol=tcp --host=127.0.0.1 --port=3306 --user=root
if ($LASTEXITCODE -ne 0) {
  throw 'MariaDB schema import failed.'
}

Write-Host '[OK] MariaDB local server is ready.'
Write-Host '  host=127.0.0.1'
Write-Host '  port=3306'
Write-Host '  database=offerpilot'
Write-Host '  demo users: admin/admin, user/user'
