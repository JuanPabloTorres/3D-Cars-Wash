import { useMemo } from 'react'
import { Shape } from 'three'
import { InstancedAsset } from '../../environment/EnvironmentBoundary'
import { Block, type usePalette } from './Architecture'

type Palette = ReturnType<typeof usePalette>
type Placement = [number, number, number, number, number]

/** Presentation only: clear pedestrian paving and planting outside live lanes.
 * Queue/car routes still belong to sitePlan; no obstacle or order is added here. */
export function EntranceForecourt({ mat }: { mat: Palette }) {
  const planting = useMemo<Placement[]>(() => [
    ...[7.8, 8.65, 9.5, 10.35, 11.2, 12.05, 12.9, 13.4].flatMap((z, i) => [-.9, -.15, .6].map((x,j) => [x,.29,z+(j%2)*.13,i*1.31+j,.92+((i+j)%3)*.05] as Placement)),
    ...[11.6, 12.5, 13.4, 14.3, 15.2].flatMap((z, i) => [-11.8,-11].map(x=>[x,.29,z,i*1.9,.95] as Placement)),
  ], [])
  const ornament=useMemo<Placement[]>(()=>[[.25,.29,8.7,1,.8],[-.55,.29,11.25,2,.75],[-11.45,.29,12.7,.6,.8]],[])
  const arrow=useMemo(()=>{const shape=new Shape();shape.moveTo(-.16,-1);shape.lineTo(.16,-1);shape.lineTo(.16,.38);shape.lineTo(.55,.38);shape.lineTo(0,1);shape.lineTo(-.55,.38);shape.lineTo(-.16,.38);shape.closePath();return shape},[])
  return <group name="entrance-forecourt">
    <Block at={[-8.85, .035, 10.2]} size={[2.1, .12, 12.6]} mat={mat.pavement} />
    <Block at={[13.6, .035, 4.9]} size={[52, .12, 1.8]} mat={mat.pavement} />
    {/* Reference: continuous dark asphalt in front, pale sidewalk only at left.
        Keep subtle transverse joints on that sidewalk, never a forecourt grid. */}
    {Array.from({ length: 8 }, (_, i) => <Block key={`slab-${i}`} at={[-8.85, .098, 5 + i * 1.6]} size={[2.06, .003, .008]} mat={mat.joint} />)}
    {[-7.72, -9.98].map(x => <Block key={`curb-${x}`} at={[x, .065, 10.2]} size={[.16, .19, 12.7]} mat={mat.plaster} />)}
    <Block at={[19.7, .065, 5.88]} size={[39.5, .19, .16]} mat={mat.plaster} />
    {/* Borders leave 1.6m clearance to the largest vehicle's queue envelope. */}
    {[{ x: -.15, z: 10.5, w: 2.4, d: 6.4 }, { x: -11.4, z: 13.5, w: 1.8, d: 5.2 }].map(bed => <group key={bed.x}>
      <Block at={[bed.x, .12, bed.z]} size={[bed.w, .3, bed.d]} mat={mat.plaster} />
      <Block at={[bed.x, .275, bed.z]} size={[bed.w - .22, .025, bed.d - .22]} mat={mat.soil} />
    </group>)}
    <InstancedAsset url="/models/coherentShrub.glb" placements={planting} height={.58} castShadow />
    <InstancedAsset url="/models/coherentCalathea.glb" placements={ornament} height={.75} castShadow />
    {[-12.6, -10.5].map((x, i) => <group key={`lamp-${x}`}>
      <Block at={[x, .46, 11.5 + i * 3]} size={[.16, .86, .16]} mat={mat.graphite} />
      <Block at={[x, .83, 11.5 + i * 3]} size={[.19, .16, .19]} mat={mat.light} />
    </group>)}
    {[8.1, 12.6].map(z => <group key={`light-${z}`}>
      <Block at={[-1.2, .46, z]} size={[.16, .86, .16]} mat={mat.graphite} />
      <Block at={[-1.2, .83, z]} size={[.19, .16, .19]} mat={mat.light} />
    </group>)}
    {/* Painted directional arrow on the vehicle lane, never on the footpath. */}
    <Block at={[3.4, -.017, 29.5]} size={[.3, .015, 1.6]} mat={mat.marking} />
    {[-1, 1].map(sign => <Block key={`arrow-${sign}`} at={[3.4 + sign * .29, -.017, 28.65]} size={[.24, .015, .85]} rotation={[0, sign * Math.PI / 4, 0]} mat={mat.marking} />)}
    <mesh position={[-5.2,-.014,8.5]} rotation-x={-Math.PI/2} material={mat.marking}><shapeGeometry args={[arrow]}/></mesh>
    <Block at={[-1.55,-.014,10.4]} size={[.08,.018,6.4]} mat={mat.yellow}/>
    {[8.9,10.35,11.8].map(z=><Block key={`stop-${z}`} at={[-1.62,.025,z]} size={[.19,.11,.85]} mat={mat.yellow}/>)}
  </group>
}
