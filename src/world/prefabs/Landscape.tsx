import { useEffect, useMemo } from 'react'
import { useTexture } from '@react-three/drei'
import { MeshStandardMaterial, RepeatWrapping, SRGBColorSpace, Vector2 } from 'three'
import { InstancedAsset } from './InstancedVegetation'
import { Block, type usePalette } from './Architecture'
import { landscapePlants, plantingBeds, plantingSurfaces, plantPlacement, vegetationModels, nearTreeModel, type PlantingZone } from '../siteLandscape'

const shrubs = landscapePlants.filter(p => p.kind === 'shrub').map(plantPlacement)
const nearTrees = landscapePlants.filter(p => p.kind === 'oak' && p.zone !== 'rear').map(plantPlacement)
const distantTrees = landscapePlants.filter(p => p.kind === 'oak' && p.zone === 'rear').map(plantPlacement)
const ornaments = landscapePlants.filter(p => p.kind === 'calathea').map(plantPlacement)
const ferns = landscapePlants.filter(p => p.kind === 'fern').map(plantPlacement)

function useSoilMaterial() {
  const sources = useTexture(['/textures/landscape/soil-color.jpg', '/textures/landscape/soil-normal.jpg', '/textures/landscape/soil-roughness.jpg'])
  const maps = useMemo(() => sources.map((source, i) => {
    const texture = source.clone()
    texture.wrapS = texture.wrapT = RepeatWrapping
    texture.repeat.setScalar(1 / 1.3)
    texture.anisotropy = 4
    if (i === 0) texture.colorSpace = SRGBColorSpace
    return texture
  }), [sources])
  const material = useMemo(() => new MeshStandardMaterial({ map: maps[0], normalMap: maps[1], roughnessMap: maps[2], normalScale: new Vector2(.4, .4), roughness: 1, color: '#e0d4c6' }), [maps])
  useEffect(() => () => { material.dispose(); maps.forEach(map => map.dispose()) }, [material, maps])
  return material
}

/** One owner for all in-ground vegetation, including the forecourt and perimeter.
 * Potted reception/table plants retain their own physical containers. */
export function Landscape({ mat }: { mat: ReturnType<typeof usePalette> }) {
  const soil = useSoilMaterial()
  return <group name="site-landscape">
    {(Object.keys(plantingBeds) as PlantingZone[]).map(id => <group key={id} name={`soil-zone:${id}`}>
      {plantingSurfaces(id).map((surface, index) => <Block key={index} at={surface.at} size={surface.size} mat={surface.material === 'soil' ? soil : mat[surface.material]} />)}
    </group>)}
    <InstancedAsset url={`/models/${nearTreeModel.id}.glb`} placements={nearTrees} height={nearTreeModel.height} canopy castShadow />
    <InstancedAsset url={`/models/${vegetationModels.oak.id}.glb`} placements={distantTrees} height={vegetationModels.oak.height} canopy castShadow />
    <InstancedAsset url={`/models/${vegetationModels.shrub.id}.glb`} placements={shrubs} height={vegetationModels.shrub.height} castShadow />
    <InstancedAsset url={`/models/${vegetationModels.calathea.id}.glb`} placements={ornaments} height={vegetationModels.calathea.height} castShadow />
    <InstancedAsset url={`/models/${vegetationModels.fern.id}.glb`} placements={ferns} height={vegetationModels.fern.height} castShadow />
  </group>
}
