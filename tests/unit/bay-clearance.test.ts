import { describe, expect, it } from 'vitest'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { getBounds, NodeIO } from '@gltf-transform/core'
import {
  BAY_IDS,
  bayEntryRoute,
  bayExitRoute,
  routeLength,
  sampleRoute,
  type XZ,
} from '../../src/domain/sitePlan'
import { plantingBeds } from '../../src/world/siteLandscape'

type Obstacle = { name: string; x: number; z: number; width: number; depth: number }
// Dimensions correspond to the current WashBayPrefab and front rails in WorldLayout.
const obstacles: Obstacle[] = BAY_IDS.flatMap((id, index) => {
  const offset = index * 8
  return [
    ...[0.8, 6].map((x) => ({
      name: `${id}-rear-${x}`,
      x: x + offset,
      z: -9.25,
      width: 2.25,
      depth: 0.24,
    })),
    ...[-0.35, 7.15].flatMap((x) =>
      [-0.2, -8.9].map((z) => ({
        name: `${id}-post-${x}-${z}`,
        x: x + offset,
        z,
        width: 0.24,
        depth: 0.24,
      })),
    ),
    { name: `${id}-rail`, x: 3.4 + offset, z: 1.45, width: 6.8, depth: 0.07 },
  ]
})
obstacles.push({ name: 'rear-soil', ...plantingBeds.rear })

function overlaps(position: XZ, yaw: number, halfWidth: number, halfLength: number, box: Obstacle) {
  const right = [Math.cos(yaw), -Math.sin(yaw)],
    forward = [Math.sin(yaw), Math.cos(yaw)]
  return [[1, 0], [0, 1], right, forward].every(([ax, az]) => {
    const distance = Math.abs((box.x - position[0]) * ax + (box.z - position[1]) * az)
    return (
      distance <
      halfWidth * Math.abs(right[0] * ax + right[1] * az) +
        halfLength * Math.abs(forward[0] * ax + forward[1] * az) +
        (box.width / 2) * Math.abs(ax) +
        (box.depth / 2) * Math.abs(az)
    )
  })
}

describe('visible vehicle clearance through bay openings', () => {
  for (const category of ['car', 'pickup', 'suv', 'truck'])
    it(`${category} enters and reverses out of every bay without crossing structure or rear soil`, async () => {
      const document = await new NodeIO()
        .registerExtensions(ALL_EXTENSIONS)
        .read(`public/models/vehicle-${category}.glb`)
      const bounds = getBounds(document.getRoot().listScenes()[0]),
        size = bounds.max.map((v, i) => v - bounds.min[i])
      const scale = Math.min(1, 6.15 / size[2], 2.52 / size[0], 2.35 / size[1])
      // Same uniform fitting contract as VehicleAppearance, plus 5cm horizontal clearance.
      const halfWidth = (size[0] * scale) / 2 + 0.05,
        halfLength = (size[2] * scale) / 2 + 0.05
      expect(size[1] * scale + 0.035 + 0.1).toBeLessThan(3.05 - 0.24 / 2)
      for (const bay of BAY_IDS)
        for (const [name, path] of [
          ['entry', bayEntryRoute(0, bay)],
          ['exit', bayExitRoute(bay)],
        ] as const) {
          const length = routeLength(path),
            count = Math.ceil(length / 0.025)
          for (let i = 0; i <= count; i++) {
            const pose = sampleRoute(path, Math.min(i * 0.025, length))
            for (const box of obstacles)
              if (overlaps(pose.position, pose.yaw, halfWidth, halfLength, box)) {
                expect.fail(
                  `${category} ${bay} ${name} intersects ${box.name} at ${pose.position.join(',')} yaw ${pose.yaw}`,
                )
              }
          }
        }
    })
})
