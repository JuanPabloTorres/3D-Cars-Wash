import { describe, expect, it } from 'vitest'
import { BAY_IDS, bayEntryRoute, bayExitRoute, queueCenter, routeLength, sampleRoute } from '../../src/domain/sitePlan'
import { landscapePlants, plantingBeds, plantingSurfaces, plantPlacement, soilHeight, isOnSoil, vegetationModels, nearTreeModel, vegetationModel } from '../../src/world/siteLandscape'
import { destinations, segmentClear } from '../../src/world/navigation/layout'
import { WaypointPathPlanner } from '../../src/world/navigation/WaypointPathPlanner'
import { getBounds, NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { Box3, BoxGeometry, Matrix4, Mesh, MeshBasicMaterial, Raycaster, Vector3 } from 'three'

describe('shared soil and vegetation contract', () => {
  it('supports every planted base inside the visible soil at exactly its height', () => {
    for (const plant of landscapePlants) {
      const [x, y, z] = plantPlacement(plant)
      expect(isOnSoil(plant.zone, x, z, plant.kind === 'oak' ? .28 : .12)).toBe(true)
      expect(y).toBe(soilHeight(plant.zone))
    }
  })

  it('rejects road, footpath, deck and curb positions even when assigned a bed', () => {
    const bed=plantingBeds.forecourt
    for (const [x, z] of [[3.4, 12], [-8.85, 10], [-13, 8], [17, -11], [bed.x+bed.width/2-.05, bed.z]]) {
      expect(() => plantPlacement({ zone: 'forecourt', kind: 'shrub', x, z, yaw: 0, scale: 1 })).toThrow('outside soil')
    }
  })

  it('exposes soil as the first rendered surface below every planted base', () => {
    const material = new MeshBasicMaterial()
    const meshes = Object.keys(plantingBeds).flatMap(zone => plantingSurfaces(zone as keyof typeof plantingBeds).map(surface => {
      const mesh = new Mesh(new BoxGeometry(...surface.size), material)
      mesh.position.set(...surface.at)
      mesh.name = surface.material
      mesh.updateMatrixWorld(true)
      return mesh
    }))
    try {
      const ray = new Raycaster(new Vector3(), new Vector3(0, -1, 0))
      for (const plant of landscapePlants) {
        ray.ray.origin.set(plant.x, 20, plant.z)
        const hit = ray.intersectObjects(meshes, false)[0]
        expect(hit.object.name, `Visible support for ${plant.zone}`).toBe('soil')
        expect(hit.point.y).toBeCloseTo(soilHeight(plant.zone), 6)
      }
    } finally {
      meshes.forEach(mesh => mesh.geometry.dispose())
      material.dispose()
    }
  })

  it('places the actual lower GLB geometry on soil, including rotated roots', async () => {
    const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
    const models = [...Object.entries(vegetationModels), ['oak', nearTreeModel] as const]
    for (const [kind, { id, height }] of models) {
      const document = await io.read(`public/models/${id}.glb`)
      const bounds = getBounds(document.getRoot().listScenes()[0])
      const normalScale = height / (bounds.max[1] - bounds.min[1])
      const base: Vector3[] = []
      for (const node of document.getRoot().listNodes()) {
        const matrix = new Matrix4().fromArray(node.getWorldMatrix())
        for (const primitive of node.getMesh()?.listPrimitives() || []) {
          const positions = primitive.getAttribute('POSITION')!
          for (let i = 0; i < positions.getCount(); i++) {
            const vertex = new Vector3().fromArray(positions.getElement(i, [])).applyMatrix4(matrix)
            if ((vertex.y - bounds.min[1]) * normalScale > .025) continue
            base.push(vertex)
          }
        }
      }
      expect(base.length, `${id} has measured base vertices`).toBeGreaterThan(0)
      const root = new Box3().setFromPoints(base).getCenter(new Vector3())
      root.y = bounds.min[1]
      base.forEach(vertex => vertex.sub(root).multiplyScalar(normalScale))
      for (const plant of landscapePlants.filter(p => p.kind === kind && vegetationModel(p).id === id)) for (const vertex of base) {
        const x = plant.x + (vertex.x * Math.cos(plant.yaw) + vertex.z * Math.sin(plant.yaw)) * plant.scale
        const z = plant.z + (-vertex.x * Math.sin(plant.yaw) + vertex.z * Math.cos(plant.yaw)) * plant.scale
        expect(isOnSoil(plant.zone, x, z), `${id} base outside ${plant.zone}`).toBe(true)
      }
    }
  })

  it('keeps soil and planter walls out of the swept truck body on every bay/queue route', () => {
    // Largest admitted body: 2.95m wide, 8.4m long. Include a 10cm margin.
    const halfWidth = 2.95 / 2 + .1, halfLength = 8.4 / 2 + .1
    const paths = BAY_IDS.flatMap(id => [bayExitRoute(id), ...[0, 1, 2].map(slot => bayEntryRoute(slot, id))])
    const samples = paths.flatMap(path => {
      const length = routeLength(path)
      return Array.from({ length: Math.ceil(length / .2) + 1 }, (_, i) => sampleRoute(path, Math.min(length, i * .2)))
    })
    samples.push(...[0, 1, 2].map(slot => ({ position: queueCenter(slot), yaw: 0 })))
    for (const { position: [x, z], yaw } of samples) for (const [id, bed] of Object.entries(plantingBeds)) {
      // Separating axes for the oriented vehicle rectangle and axis-aligned bed.
      const right = [Math.cos(yaw), -Math.sin(yaw)], forward = [Math.sin(yaw), Math.cos(yaw)]
      const dx = bed.x - x, dz = bed.z - z
      const overlap = [[1, 0], [0, 1], right, forward].every(([ax, az]) => {
        const gap = Math.abs(dx * ax + dz * az)
        const vehicle = halfWidth * Math.abs(right[0] * ax + right[1] * az) + halfLength * Math.abs(forward[0] * ax + forward[1] * az)
        const planter = bed.width / 2 * Math.abs(ax) + bed.depth / 2 * Math.abs(az)
        return gap < vehicle + planter
      })
      expect(overlap, `${id} overlaps truck near ${x.toFixed(2)},${z.toFixed(2)}`).toBe(false)
    }
  })

  it('preserves the pedestrian approach and camera paths between reception and lounge', () => {
    expect(segmentClear([-8.65, 13.8], [-8.65, 6.2])).toBe(true)
    const planner = new WaypointPathPlanner()
    for (const [from, to] of [['reception', 'lounge'], ['viewing', 'lounge'], ['lounge', 'reception']] as const) {
      const path = planner.findPath(destinations[from].point, destinations[to].point)
      expect(path).not.toBeNull()
      for (let i = 1; i < path!.length; i++) expect(segmentClear(path![i - 1], path![i])).toBe(true)
    }
  })
})
