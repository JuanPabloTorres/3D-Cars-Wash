import fs from 'node:fs/promises'
import crypto from 'node:crypto'

const files = [
  'dist/assets/index-DD_4_qjz.js',
  'public/models/vehicle.glb',
  'public/models/worker.glb',
  'public/models/islandTree.glb',
  'public/models/islandTreeFar.glb',
]
const manifest = {
  capturedAt: new Date().toISOString(),
  unitTests: 34,
  e2eTests: 12,
  scope: 'local DEMO commercial experience',
  files: [],
}

for (const file of files) {
  const data = await fs.readFile(file)

  manifest.files.push({
    file,
    bytes: data.length,
    sha256: crypto.createHash('sha256').update(data).digest('hex'),
  })
}
await fs.writeFile(
  'docs/evidence/commercial-polish/final/build-manifest.json',
  JSON.stringify(manifest, null, 2),
)
