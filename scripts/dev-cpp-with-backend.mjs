import { spawn } from 'node:child_process'
import process from 'node:process'

const rootDir = process.cwd()
const isWindows = process.platform === 'win32'
const nodeCommand = process.execPath
const pnpmExecPath = process.env.npm_execpath
const powershellCommand = isWindows
  ? `${ process.env.SystemRoot ?? 'C:\\Windows' }\\System32\\WindowsPowerShell\\v1.0\\powershell.exe`
  : 'powershell'
const cmdCommand = isWindows
  ? (process.env.ComSpec ?? 'C:\\Windows\\System32\\cmd.exe')
  : 'cmd'

const spawnRawCommand = (command, args) => {
  return spawn(command, args, {
    cwd: rootDir,
    stdio: 'inherit'
  })
}

const spawnPnpmCommand = (args) => {
  // On Windows + Node 25, spawning pnpm.cmd directly may throw EINVAL.
  if (pnpmExecPath) {
    return spawnRawCommand(nodeCommand, [pnpmExecPath, ...args])
  }

  return spawn('pnpm', args, {
    cwd: rootDir,
    stdio: 'inherit',
    shell: isWindows
  })
}

const runCommand = (command, args, label) => {
  return new Promise((resolve, reject) => {
    const child = spawnRawCommand(command, args)

    child.once('error', (error) => {
      reject(new Error(`${ label } failed to start: ${ error.message }`))
    })

    child.once('exit', (code, signal) => {
      if (code === 0) {
        resolve()
        return
      }

      reject(new Error(
        `${ label } exited early, code=${ code ?? 'null' } signal=${ signal ?? 'null' }`
      ))
    })
  })
}

const waitForExit = (child, label) => {
  return new Promise((resolve) => {
    child.once('exit', (code, signal) => {
      resolve({
        code: typeof code === 'number' ? code : 1,
        label,
        signal
      })
    })
  })
}

const terminateChildTree = (child) => {
  if (!child.pid) return Promise.resolve()

  if (!isWindows) {
    child.kill('SIGTERM')
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    const killer = spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], {
      cwd: rootDir,
      stdio: 'ignore'
    })

    killer.once('error', () => resolve())
    killer.once('exit', () => resolve())
  })
}

const spawnService = (command, args) => {
  return spawnRawCommand(command, args)
}

const services = []
let isShuttingDown = false

const shutdownServices = async () => {
  if (isShuttingDown) return
  isShuttingDown = true

  await Promise.allSettled(
    services.map(service => terminateChildTree(service.child))
  )
}

process.on('SIGINT', async () => {
  await shutdownServices()
  process.exit(130)
})

process.on('SIGTERM', async () => {
  await shutdownServices()
  process.exit(143)
})

try {
  await runCommand(
    powershellCommand,
    ['-ExecutionPolicy', 'Bypass', '-File', './backend/cpp/mariadb/start-local.ps1'],
    'MariaDB'
  )

  services.push({
    label: 'backend',
    child: spawnPnpmCommand(['--filter', 'mock-interview-backend', 'dev'])
  })

  services.push({
    label: 'cpp',
    child: spawnService(cmdCommand, ['/c', 'backend\\cpp\\run-local.bat'])
  })

  for (const service of services) {
    service.child.once('error', (error) => {
      console.error(`[${ service.label }] failed to start:`, error)
    })
  }

  const result = await Promise.race(
    services.map(service => waitForExit(service.child, service.label))
  )

  await shutdownServices()
  process.exit(result.code)
} catch (error) {
  await shutdownServices()
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}
