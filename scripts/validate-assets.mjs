import fs from 'node:fs/promises'
import validator from 'gltf-validator'

const reports = []

for (const name of await fs.readdir('public/models')) {
  if (!name.endsWith('.glb')) continue

  const bytes = await fs.readFile(`public/models/${name}`)
  const result = await validator.validateBytes(new Uint8Array(bytes), { uri: name, maxIssues: 100 })

  reports.push({
    file: name,
    errors: result.issues.numErrors,
    warnings: result.issues.numWarnings,
    infos: result.issues.numInfos,
    messages: result.issues.messages,
  })
  console.log(name, 'errors', result.issues.numErrors, 'warnings', result.issues.numWarnings)
}
await fs.writeFile('docs/asset-validation.json', JSON.stringify(reports, null, 2))
if (reports.some((r) => r.errors)) process.exitCode = 1
