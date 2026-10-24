import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { Box3, Mesh, Vector3 } from 'three'
import { clone } from 'three/addons/utils/SkeletonUtils.js'
import { assets, type AssetId } from '../assets/registry'
import { diagnostics } from '../diagnostics'
export function useModel(id:AssetId,height?:number){
  const {scene,animations}=useGLTF(assets[id])
  const model=useMemo(()=>{
    const result=clone(scene)
    result.traverse(o=>{if(o instanceof Mesh){o.castShadow=true;o.receiveShadow=true;o.userData.assetId=id}})
    // Precise world-space vertices avoid inflated bounds from rotated submeshes.
    const bounds=new Box3().setFromObject(result,true),size=bounds.getSize(new Vector3()),center=bounds.getCenter(new Vector3())
    // This ground-cover asset is wider than it is tall. Height-only scaling
    // previously produced leaves several metres wide, crossing planter walls.
    const scale=id==='calathea'?Math.min((height||.7)/size.y,1.35/Math.max(size.x,size.z)):height?height/size.y:1
    diagnostics.modelBounds[id]={sourceSize:size.toArray(),sourceCenter:center.toArray(),scale}
    result.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);result.scale.setScalar(scale)
    return result
  },[scene,height])
  return {model,animations}
}
export function Model({id,height,position=[0,0,0],rotation=0}:{id:AssetId;height?:number;position?:[number,number,number];rotation?:number}){
  const {model}=useModel(id,height)
  return <group position={position} rotation-y={rotation}><primitive object={model} dispose={null}/></group>
}
