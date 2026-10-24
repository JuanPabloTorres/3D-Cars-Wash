import { useRef, useState } from 'react'
import { Move } from 'lucide-react'
import { input } from '../world/navigation/input'
export function TouchControls(){
  const origin=useRef({x:0,y:0}),active=useRef<number|null>(null),[stick,setStick]=useState([0,0])
  const release=()=>{active.current=null;input.moveX=0;input.moveY=0;setStick([0,0])}
  return <div className="joystick" role="group" aria-label="Joystick para caminar" data-testid="joystick"
    onPointerDown={e=>{e.preventDefault();active.current=e.pointerId;origin.current={x:e.clientX,y:e.clientY};e.currentTarget.setPointerCapture(e.pointerId)}}
    onPointerMove={e=>{
      if(e.pointerId!==active.current)return
      const dx=e.clientX-origin.current.x,dy=e.clientY-origin.current.y,l=Math.max(1,Math.hypot(dx,dy)/35)
      input.moveX=dx/(l*35);input.moveY=-dy/(l*35);setStick([dx/l,dy/l])
    }} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}>
    <div className="joystick-knob" style={{transform:`translate(${stick[0]}px, ${stick[1]}px)`}}><Move size={20}/></div>
  </div>
}
