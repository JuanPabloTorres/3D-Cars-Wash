import { useEffect, useMemo, useRef, useState } from 'react'
import { useAnimations } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Group,Vector3,type Object3D } from 'three'
import { NPCAnimationController } from '../animation/NPCAnimationController'
import { useModel } from './Model'
import { useApp } from '../../app/store'
import { diagnostics } from '../diagnostics'
import {useCommerce} from '../../app/commerceStore'
export function StaffPrefab({role,position,rotation=0,staffId=role,serviceActive=false,activity}:{role:'receptionist'|'worker';position:[number,number,number];rotation?:number;staffId?:string;serviceActive?:boolean;activity?:string}){
  const {model,animations}=useModel(role,role==='receptionist'?1.72:1.78)
  const group=useRef<Group>(null)
  const {actions,mixer,names}=useAnimations(animations,group)
  const controller=useMemo(()=>new NPCAnimationController(actions,mixer),[actions,mixer])
  const talking=useApp(s=>s.dialogue),nearby=useApp(s=>s.interaction==='reception'),paused=useApp(s=>s.paused)
  const [greeted,setGreeted]=useState(false)
  const step=useCommerce(s=>s.draft.step),[explained,setExplained]=useState(false),[pointed,setPointed]=useState(false)
  useEffect(()=>{setExplained(false);setPointed(false)},[step])
  useEffect(()=>{const finished=(event:{action:{getClip:()=>{name:string}}})=>{const name=event.action.getClip().name;if(name==='Greet')setGreeted(true);if(name==='Talk')setExplained(true);if(name.startsWith('Point'))setPointed(true)};mixer.addEventListener('finished',finished);return()=>mixer.removeEventListener('finished',finished)},[mixer])
  const workClip=activity==='interior'?'ServiceInterior':activity==='lights'?'ServiceLights':activity==='inspection'?'ServiceInspect':'Service'
  // Use one complete greeting clip, then settle into a calm listening pose. The old
  // Talk loop repeated a hand-only gesture and read as a mechanical wave.
  const reduced=window.matchMedia('(prefers-reduced-motion:reduce)').matches
  const presenting=nearby&&talking&&['services','vehicle','review','information'].includes(step)
  // Only the catalogue has a corresponding pointing clip. The former order
  // terminal was retired; forms/information use a brief explanation, then rest.
  const pointingAtCatalogue=presenting&&step==='services'&&!pointed
  const clip=role==='worker'?(serviceActive?workClip:'Idle'):reduced?'Idle':nearby&&!greeted?'Greet':pointingAtCatalogue?'PointServices':presenting&&!explained?'Talk':'Idle'
  useEffect(()=>{if(!nearby)setGreeted(false)},[nearby])
  useEffect(()=>{
    controller.play(clip)
    diagnostics.animations[staffId]={clips:names,active:clip,time:0}
  },[clip,controller,names,staffId])
  useEffect(()=>()=>{controller.dispose();delete diagnostics.animations[staffId]},[controller,staffId])
  useEffect(()=>{controller.pause(role==='worker'&&paused)},[paused,controller,role])
  useFrame((_,dt)=>{
    if(role!=='receptionist'||!group.current)return
    const p=diagnostics.position
    const target=nearby||talking?Math.max(-.35,Math.min(.35,Math.atan2(p[0]-position[0],p[1]-position[2]))):0
    const diff=Math.atan2(Math.sin(target-group.current.rotation.y),Math.cos(target-group.current.rotation.y))
    group.current.rotation.y+=diff*(1-Math.exp(-2*Math.min(dt,.05)))
  })
  useFrame(()=>{if(diagnostics.animations[staffId])diagnostics.animations[staffId].time=actions[clip]?.time||0})
  return <group ref={group} position={position} rotation-y={rotation}><primitive object={model} dispose={null}/>{role==='worker'&&serviceActive&&['exterior','interior','lights'].includes(activity||'')&&<StaffTool character={model} activity={activity!} staffId={staffId}/>}</group>
}
/** Professional prop attached to the imported wrist, following the same mixer. */
function StaffTool({character,activity,staffId}:{character:Object3D;activity:string;staffId:string}){
 const id=activity==='lights'?'sander':activity==='interior'?'vacuumNozzle':'sprayWand'
 const {model}=useModel(id,activity==='lights'?.156:activity==='interior'?.05:.5)
 const anchor=useRef<Group|null>(null),tip=useMemo(()=>new Vector3(),[]),hand=useMemo(()=>new Vector3(),[])
 useEffect(()=>{
  const wrist=character.getObjectByName('DEF-Wrist.R')||character.getObjectByName('DEF-WristR')
  if(!wrist)return
  const grip=new Group();grip.position.set(0,.07,0);if(activity==='lights')grip.rotation.x=Math.PI
  grip.add(model);wrist.add(grip);anchor.current=grip
  return()=>{wrist.remove(grip);grip.remove(model);anchor.current=null;delete diagnostics.toolAnchors[staffId]}
 },[character,model,activity])
 useFrame(()=>{if(!anchor.current)return;anchor.current.updateWorldMatrix(true,true);anchor.current.getWorldPosition(hand);tip.set(0,activity==='exterior'?.5:.08,0);anchor.current.localToWorld(tip);diagnostics.toolAnchors[staffId]={tip:tip.toArray(),grip:hand.toArray(),activity,attached:true}})
 return null
}
