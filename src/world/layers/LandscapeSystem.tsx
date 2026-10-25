import { InstancedAsset } from '../prefabs/InstancedVegetation'
import {
  accents,
  groundCover,
  landscapeAssets,
  landscapeGroups,
  palms,
  shrubs,
  trees,
} from './landscapePlan'
import { LightingLandscapeLayer } from './LightingLandscapeLayer'

/** Independent visual groups; no order state, animation authority or UI. */
export function LandscapeSystem({ sample = false }: { sample?: boolean }) {
  const groups = landscapeGroups
  const plants = (
    <>
      {groups.trees && (
        <group name="TreeLayer">
          <InstancedAsset
            {...landscapeAssets.tree}
            placements={sample ? trees.slice(0, 1) : trees}
            canopy
            castShadow
            finish="landscape"
          />
        </group>
      )}
      {!sample && groups.palms && (
        <group name="PalmLayer">
          <InstancedAsset
            {...landscapeAssets.palm}
            placements={palms}
            castShadow
            finish="landscape"
          />
        </group>
      )}
      {groups.planterFill && (
        <group name="PlanterFillLayer">
          {groups.shrubs && (
            <group name="ShrubLayer">
              <InstancedAsset
                {...landscapeAssets.shrub}
                placements={sample ? shrubs.filter((p) => p[0] < -17 && p[2] > 0) : shrubs}
                castShadow
                finish="landscape"
              />
            </group>
          )}
          {groups.accents && (
            <group name="AccentPlantsLayer">
              <InstancedAsset
                {...landscapeAssets.accent}
                placements={sample ? accents.filter((p) => p[0] < -17 && p[2] > 0) : accents}
                castShadow
                finish="landscape"
              />
            </group>
          )}
          {groups.groundCover && (
            <group name="GroundCoverLayer">
              <InstancedAsset
                {...landscapeAssets.fern}
                placements={
                  sample ? groundCover.filter((p) => p[0] < -17 && p[2] > 0) : groundCover
                }
                finish="landscape"
              />
            </group>
          )}
        </group>
      )}
    </>
  )

  return (
    <group name="LandscapeSystem">
      {plants}
      {groups.lights && !sample && <LightingLandscapeLayer />}
    </group>
  )
}
