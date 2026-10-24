import {useEffect,useLayoutEffect,useRef} from 'react'
import {Color,InstancedMesh,Object3D} from 'three'

type BoxPart={at:[number,number,number];size:[number,number,number];color:string}
// Commercial volumes beyond the perimeter. Real depth preserves the horizon
// through every camera transition; the weather controller owns the shared sky.
const buildings=[
 [-14,-42,9,7,5.2],[0,-45,11,8,7.4],[17,-40,13,9,5.7],[34,-44,12,7,8],[50,-40,9,8,6],
 [-33,-17,8,12,5.6],[-34,4,9,13,7],[-34,25,10,11,5],
 [69,-10,10,12,6],[69,13,8,11,5],
 [-12,53,10,8,7],[7,55,13,9,5],[28,55,14,7,6.4],[49,55,10,9,5.6],
]
const walls:BoxPart[]=buildings.map(([x,z,w,d,h],i)=>({at:[x,h/2-.15,z],size:[w,h,d],color:['#b9b9ae','#c6c1b2','#aeb8b5'][i%3]}))
const roofs:BoxPart[]=buildings.map(([x,z,w,d,h])=>({at:[x,h-.1,z],size:[w+.3,.22,d+.3],color:'#747e7e'}))
const windows:BoxPart[]=buildings.flatMap(([x,z,w,d,h])=>[2.3,...h>6?[4.8]:[]].flatMap(y=>[
 {at:[x,y,z+d/2+.015],size:[w*.68,.75,.035],color:'#526770'},
 {at:[x,y,z-d/2-.015],size:[w*.68,.75,.035],color:'#526770'},
 {at:[x+w/2+.015,y,z],size:[.035,.75,d*.65],color:'#526770'},
 {at:[x-w/2-.015,y,z],size:[.035,.75,d*.65],color:'#526770'},
] as BoxPart[]))

function BoxBatch({parts,name}:{parts:BoxPart[];name:string}){
 const ref=useRef<InstancedMesh>(null)
 useLayoutEffect(()=>{
  const mesh=ref.current!,transform=new Object3D(),color=new Color()
  parts.forEach((part,index)=>{transform.position.set(...part.at);transform.scale.set(...part.size);transform.updateMatrix();mesh.setMatrixAt(index,transform.matrix);mesh.setColorAt(index,color.set(part.color))})
  mesh.instanceMatrix.needsUpdate=true
  if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true
  mesh.computeBoundingSphere()
 },[parts])
 useEffect(()=>{const mesh=ref.current;return()=>mesh?.dispose()},[])
 return <instancedMesh ref={ref} name={name} args={[undefined,undefined,parts.length]} receiveShadow><boxGeometry/><meshStandardMaterial roughness={.94}/></instancedMesh>
}

/** Three static batches without panorama seams or competing photographic light.
 * The previous image remains untouched on disk for comparison and rollback. */
export function SiteBackdrop(){
 return <group name="urban-surround"><BoxBatch parts={walls} name="urban-facades"/><BoxBatch parts={roofs} name="urban-rooflines"/><BoxBatch parts={windows} name="urban-window-bands"/></group>
}
