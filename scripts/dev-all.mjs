import { spawn } from 'node:child_process'
import process from 'node:process'

const rootDir = process.cwd()
const isWindows = process.platform === 'win32'
const nodeCommand = process.execPath
const pnpmExecPath = process.env.npm_execpath

const spawnRawService = (command, args) => {
  return spawn(command, args, {
    cwd: rootDir,
    stdio: 'inherit'
  })
}

const spawnPnpmService = (args) => {
  // On Windows + Node 25, spawning pnpm.cmd directly may throw EINVAL.
  if (pnpmExecPath) {
    return spawnRawService(nodeCommand, [pnpmExecPath, ...args])
  }

  const command = isWindows ? 'pnpm' : 'pnpm'
  return spawn(command, args, {
    cwd: rootDir,
    stdio: 'inherit',
    shell: isWindows
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

const services = [
  {
    label: 'frontend',
    child: spawnPnpmService(['--filter', 'frontend', 'dev'])
  },
  {
    label: 'cpp-stack',
    child: spawnRawService(nodeCommand, ['./scripts/dev-cpp-with-backend.mjs'])
  }
]

for (const service of services) {
  service.child.once('error', (error) => {
    console.error(`[${ service.label }] failed to start:`, error)
  })
}

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

const result = await Promise.race(
  services.map(service => waitForExit(service.child, service.label))
)

await shutdownServices()
process.exit(result.code)
