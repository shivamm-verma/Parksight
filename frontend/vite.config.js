import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function sampleOutputsPlugin() {
  const sampleOutputsDir = fileURLToPath(new URL('../SAMPLE_OUTPUTS', import.meta.url))
  const publicPrefix = '/sample-outputs/'
  const contentTypes = {
    '.html': 'text/html; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.csv': 'text/csv; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8',
  }

  function serveSampleOutput(req, res, next) {
    if (!req.url) {
      next()
      return
    }

    let pathname
    try {
      pathname = new URL(req.url, 'http://localhost').pathname
    } catch {
      next()
      return
    }

    if (!pathname.startsWith(publicPrefix)) {
      next()
      return
    }

    let relativePath
    try {
      relativePath = decodeURIComponent(pathname.slice(publicPrefix.length))
    } catch {
      res.statusCode = 400
      res.end('Bad request')
      return
    }

    if (!relativePath || relativePath.includes('..') || relativePath.includes('\\')) {
      res.statusCode = 403
      res.end('Forbidden')
      return
    }

    const resolvedPath = path.resolve(sampleOutputsDir, relativePath)
    const rootWithSeparator = sampleOutputsDir.endsWith(path.sep) ? sampleOutputsDir : `${sampleOutputsDir}${path.sep}`

    if (resolvedPath !== sampleOutputsDir && !resolvedPath.startsWith(rootWithSeparator)) {
      res.statusCode = 403
      res.end('Forbidden')
      return
    }

    fs.stat(resolvedPath, (statError, stats) => {
      if (statError || !stats.isFile()) {
        next()
        return
      }

      const contentType = contentTypes[path.extname(resolvedPath).toLowerCase()] || 'application/octet-stream'
      res.statusCode = 200
      res.setHeader('Content-Type', contentType)
      res.setHeader('Cache-Control', 'no-store')
      fs.createReadStream(resolvedPath).pipe(res)
    })
  }

  return {
    name: 'sample-outputs-server',
    configureServer(server) {
      server.middlewares.use(serveSampleOutput)
    },
    configurePreviewServer(server) {
      server.middlewares.use(serveSampleOutput)
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), sampleOutputsPlugin()],
})
