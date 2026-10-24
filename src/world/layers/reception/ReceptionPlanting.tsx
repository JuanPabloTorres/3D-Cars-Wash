import { PottedPlant } from '../../prefabs/Planter'

/** Placement is local; vessel, soil and plant anchoring belong to the shared prefab. */
export function ReceptionPlanting(){
 return <group name="ReceptionPlanting">
  {[-1,1].map(sign=><group key={sign}>
   <PottedPlant position={[sign*3.03,0,-.38]} asset="/models/layer02/warmBroadleaf.glb" plantHeight={.83} rotation={sign<0?.4:2.2}/>
   {/* Low rear planting leaves the wall information clear; vessel/materials stay shared. */}
   <PottedPlant position={[sign*2.7,0,-1.55]} height={.43} asset="/models/layer02/warmShrub.glb" plantHeight={.72} rotation={sign<0?1.4:3.2}/>
  </group>)}
 </group>
}
