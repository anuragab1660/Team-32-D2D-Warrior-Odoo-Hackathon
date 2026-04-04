const { spawn } = require('node:child_process')

const mode = process.argv[2]
const nextBinary = require.resolve('next/dist/bin/next')

if (mode !== 'dev' && mode !== 'start') {
  console.error('Usage: node scripts/next-run.js <dev|start>')
  process.exit(1)
}

const configuredPort = process.env.PORT ? Number(process.env.PORT) : undefined

function resolveHostname() {
  if (process.env.HOST) {
    return process.env.HOST
  }

  if (process.env.HOSTNAME === '0.0.0.0' || process.env.HOSTNAME === '127.0.0.1' || process.env.HOSTNAME === 'localhost') {
    return process.env.HOSTNAME
  }

  return '127.0.0.1'
}

async function main() {
  const hostname = resolveHostname()
  const port = Number.isFinite(configuredPort) ? configuredPort : 0
  const child = spawn(process.execPath, [nextBinary, mode, '-p', String(port), '-H', hostname], {
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: String(port),
      HOSTNAME: hostname,
    },
  })

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal)
      return
    }

    process.exit(code ?? 0)
  })
}

main().catch((error) => {
  console.error(error.message || error)
  process.exit(1)
})