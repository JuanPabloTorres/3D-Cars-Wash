/* Serves compiled client assets and the local API. Host validation precedes routes; shutdown closes operation and HTTP resources. */
import { createServer } from 'node:http'
import { createReadStream, statSync } from 'node:fs'
import { resolve, extname, sep } from 'node:path'
import { createApi } from './demoApi.ts'
import { localTransportAllowed } from './localTransport.ts'

const root = resolve('dist'),
  api = createApi(),
  container = process.env.CARWASH_CONTAINER === '1'
const types: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.glb': 'model/gltf-binary',
  '.woff2': 'font/woff2',
  '.hdr': 'application/octet-stream',
}
const server = createServer((req, res) => {
  if (!localTransportAllowed(req, container)) {
    res.writeHead(403)
    res.end()

    return
  }
  if (req.url === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end('{"status":"ok","mode":"local-demo"}')

    return
  }
  void api
    .middleware(req, res, () => {
      if (!['GET', 'HEAD'].includes(req.method || '')) {
        res.writeHead(405)
        res.end()

        return
      }
      try {
        const pathname = decodeURIComponent(new URL(req.url || '/', 'http://localhost').pathname)
        let file = resolve(root, '.' + pathname)

        if (file !== root && !file.startsWith(root + sep)) {
          res.writeHead(403)
          res.end()

          return
        }
        if (!extname(file)) file = resolve(root, 'index.html')

        const stat = statSync(file)

        if (!stat.isFile()) throw new Error('Not a file')
        res.writeHead(200, {
          'Content-Type': types[extname(file)] || 'application/octet-stream',
          'Content-Length': stat.size,
          'X-Content-Type-Options': 'nosniff',
          'Cache-Control': file.includes(sep + 'assets' + sep)
            ? 'public, max-age=31536000, immutable'
            : 'no-cache',
        })
        if (req.method === 'HEAD') res.end()
        else createReadStream(file).pipe(res)
      } catch {
        res.writeHead(404)
        res.end('Not found')
      }
    })
    .catch(() => {
      if (!res.headersSent) res.writeHead(500)
      res.end()
    })
})

server.listen(Number(process.env.PORT || 4173), container ? '0.0.0.0' : '127.0.0.1', () =>
  console.log('Carwash local MVP ready'),
)

let stopping = false

function shutdown() {
  if (stopping) return
  stopping = true
  api.dispose()
  server.close()
  server.closeAllConnections()
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
