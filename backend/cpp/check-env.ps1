$ErrorActionPreference = 'Stop'

function Find-FirstMatch {
  param(
    [string[]]$Candidates,
    [string]$RelativePath
  )

  foreach ($candidate in $Candidates) {
    if (-not $candidate) {
      continue
    }

    $fullPath = Join-Path $candidate $RelativePath
    if (Test-Path $fullPath) {
      return $candidate
    }
  }

  return $null
}

function Write-Status {
  param(
    [string]$Name,
    [bool]$Ok,
    [string]$Value
  )

  $prefix = if ($Ok) { '[OK]' } else { '[MISSING]' }
  Write-Host "$prefix $Name"
  if ($Value) {
    Write-Host "  $Value"
  }
}

$cppDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Split-Path -Parent $cppDir
$envPath = Join-Path $backendDir '.env'
$envExamplePath = Join-Path $backendDir '.env.cpp.example'
$exePath = Join-Path $cppDir 'offerpilot_backend.exe'
$runtimeLibDir = Join-Path $cppDir 'lib'

$opensslIncludeCandidates = @(
  $env:OPENSSL_INCLUDE_DIR,
  'C:\msys64\ucrt64\include',
  'C:\msys64\mingw64\include',
  'C:\Program Files\Git\usr\include',
  'C:\Program Files\Git\mingw64\include'
)

$opensslLibCandidates = @(
  $env:OPENSSL_LIB_DIR,
  'C:\msys64\ucrt64\lib',
  'C:\msys64\mingw64\lib',
  'C:\Program Files\Git\usr\lib',
  'C:\Program Files\Git\mingw64\lib'
)

$mysqlIncludeCandidates = @(
  $env:MYSQL_INCLUDE_DIR,
  'C:\Program Files\MySQL\MySQL Server 9.0\include',
  'C:\Program Files\MySQL\MySQL Server 8.4\include',
  'C:\Program Files\MySQL\MySQL Server 8.0\include',
  'C:\Program Files\MariaDB 11.4\include',
  'C:\Program Files\MariaDB 11.3\include'
)

$mysqlLibCandidates = @(
  $env:MYSQL_LIB_DIR,
  'C:\Program Files\MySQL\MySQL Server 9.0\lib',
  'C:\Program Files\MySQL\MySQL Server 8.4\lib',
  'C:\Program Files\MySQL\MySQL Server 8.0\lib',
  'C:\Program Files\MariaDB 11.4\lib',
  'C:\Program Files\MariaDB 11.3\lib'
)

$gpp = Get-Command g++ -ErrorAction SilentlyContinue
$opensslIncludeDir = Find-FirstMatch -Candidates $opensslIncludeCandidates -RelativePath 'openssl\err.h'
$opensslLibDir = Find-FirstMatch -Candidates $opensslLibCandidates -RelativePath 'libssl.dll.a'
$mysqlIncludeDir = Find-FirstMatch -Candidates $mysqlIncludeCandidates -RelativePath 'mysql.h'
$mysqlLibDir = Find-FirstMatch -Candidates $mysqlLibCandidates -RelativePath 'libmysql.lib'

Write-Host '== C++ backend local env check =='
Write-Host "Project: $cppDir"
Write-Host ''

Write-Status -Name 'g++ compiler' -Ok ([bool]$gpp) -Value ($(if ($gpp) { $gpp.Source } else { '' }))
Write-Status -Name 'OpenSSL include dir' -Ok ([bool]$opensslIncludeDir) -Value $opensslIncludeDir
Write-Status -Name 'OpenSSL lib dir' -Ok ([bool]$opensslLibDir) -Value $opensslLibDir
Write-Status -Name 'MySQL include dir' -Ok ([bool]$mysqlIncludeDir) -Value $mysqlIncludeDir
Write-Status -Name 'MySQL lib dir' -Ok ([bool]$mysqlLibDir) -Value $mysqlLibDir
Write-Status -Name 'C++ runtime lib dir' -Ok (Test-Path $runtimeLibDir) -Value $runtimeLibDir
Write-Status -Name 'backend .env' -Ok (Test-Path $envPath) -Value $envPath
Write-Status -Name 'backend .env.cpp.example' -Ok (Test-Path $envExamplePath) -Value $envExamplePath
Write-Status -Name 'offerpilot_backend.exe' -Ok (Test-Path $exePath) -Value $exePath

Write-Host ''
Write-Host 'Recommended env vars for build-local.bat:'
Write-Host "  OPENSSL_INCLUDE_DIR=$opensslIncludeDir"
Write-Host "  OPENSSL_LIB_DIR=$opensslLibDir"
Write-Host "  MYSQL_INCLUDE_DIR=$mysqlIncludeDir"
Write-Host "  MYSQL_LIB_DIR=$mysqlLibDir"
Write-Host ''
Write-Host 'Next step:'
Write-Host '  1. Fill backend/.env from backend/.env.cpp.example'
Write-Host '  2. Run backend/cpp/build-local.bat'
Write-Host '  3. Run backend/cpp/run-local.bat'
