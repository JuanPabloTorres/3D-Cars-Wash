import fs from 'node:fs/promises'
import ts from 'typescript'
import sharp from 'sharp'

async function loadSource(file) {
  const source = await fs.readFile(file, 'utf8')
  const javascript = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
  return import(`data:text/javascript;base64,${Buffer.from(javascript).toString('base64')}`)
}
const { plantingBeds, landscapePlants } = await loadSource('src/world/siteLandscape.ts')
const { BAY_IDS, bayCenter, bayEntryRoute, bayExitRoute } = await loadSource('src/domain/sitePlan.ts')
const scale = 10, left = 75, top = 100
const px = x => left + (x + 24) * scale, py = z => top + (z + 30) * scale
const rect = (x, z, w, d, fill, stroke = 'none') => `<rect x="${px(x - w / 2)}" y="${py(z - d / 2)}" width="${w * scale}" height="${d * scale}" fill="${fill}" stroke="${stroke}"/>`
const text = (x, y, label, size = 13, fill = '#25373e', anchor = 'start') => `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" text-anchor="${anchor}">${label}</text>`
const labels = ['Frontal', 'Acceso oeste', 'Detrás del lounge', 'Lateral del lounge', 'Recepción oeste', 'Recepción posterior', 'Perímetro este', 'Franja posterior']
const svg = [
  '<svg xmlns="http://www.w3.org/2000/svg" width="1040" height="980" viewBox="0 0 1040 980"><rect width="1040" height="980" fill="#f6f4ee"/><g font-family="Segoe UI,Arial,sans-serif">',
  text(55, 45, 'CarWash · distribución de tierra y circulación', 25),
  text(55, 72, 'Plano derivado de las zonas y rutas actuales. Unidades en metros; vista superior.', 14),
  rect(18, 3.5, 84, 67, '#bdc3af'),
  rect(18, 7, 72, 58, '#3d464c'),
  rect(-8.85, 10.2, 2.1, 12.6, '#e3e0d6'),
  rect(13.6, 4.9, 52, 1.8, '#e3e0d6'),
  rect(-13.15, 7.45, 7.3, 5.7, '#b78559', '#805637'),
  rect(-6, 1, 6.9, 6.1, '#b94e50', '#7e3034'),
  text(px(-6), py(.8), 'RECEPCIÓN', 10, '#fff', 'middle'),
  text(px(-13.15), py(7.5), 'LOUNGE', 10, '#fff', 'middle'),
  ...BAY_IDS.flatMap(id => {
    const [x] = bayCenter(id)
    return [rect(x, -4.6, 7.5, 9.5, '#82939a', '#c9d0d1'), text(px(x), py(-4.1), `BAHÍA ${id}`, 10, '#fff', 'middle')]
  }),
  ...[bayEntryRoute(2, '01'), bayExitRoute('05')].map(route => `<polyline points="${route.map(([x, z]) => `${px(x)},${py(z)}`).join(' ')}" fill="none" stroke="#f5d777" stroke-width="3" stroke-dasharray="7 6"/>`),
  ...Object.values(plantingBeds).flatMap((bed, index) => [
    rect(bed.x, bed.z, bed.width, bed.depth, '#d4d0c2', '#a5a28f'),
    rect(bed.x, bed.z, bed.width - .24, bed.depth - .24, '#725541'),
    text(px(bed.x), py(bed.z) - 10, `T${index + 1}`, 11, '#fff', 'middle'),
  ]),
  ...landscapePlants.map(plant => `<circle cx="${px(plant.x)}" cy="${py(plant.z)}" r="${plant.kind === 'oak' ? 5 : 2.4}" fill="${plant.kind === 'oak' ? '#0c4939' : '#9bd173'}" stroke="#274d28" stroke-width=".5"/>`),
  text(px(3.4), py(33), 'ENTRADA', 12, '#f5d777', 'middle'),
  text(px(51), py(33), 'SALIDA', 12, '#f5d777', 'middle'),
  text(55, 805, 'Tierra autorizada', 17),
  ...labels.map((label, i) => text(55 + Math.floor(i / 4) * 325, 833 + (i % 4) * 25, `T${i + 1} · ${label}`, 13)),
  text(730, 827, '— — Ruta vehicular', 13),
  text(730, 853, 'Claro · aceras', 13),
  text(730, 879, 'Marrón · tierra / deck', 13),
  text(55, 953, 'Los puntos muestran bases de plantas (símbolos ampliados), no el tamaño de sus copas. Las macetas tienen recipiente propio.', 12),
  '</g></svg>',
].join('\n')
await fs.writeFile('docs/evidence/site-zones-lounge/site-plan.svg', svg)
await sharp(Buffer.from(svg)).png().toFile('docs/evidence/site-zones-lounge/site-plan.png')
console.log(JSON.stringify({ zones: Object.keys(plantingBeds).length, plantedBases: landscapePlants.length, output: 'docs/evidence/site-zones-lounge/site-plan.png' }))
