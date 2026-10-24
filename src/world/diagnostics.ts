import type { Point } from './navigation/layout'
export const diagnostics = {
  position: [-7,14.5] as Point, yaw:0, pitch:0, walking:false, route:[] as Point[],
  vehiclePosition:[3.4,-4.2] as Point, vehicleCount:1, vehicleDistance:0,
  frames:[] as number[], drawCalls:0, triangles:0, geometries:0, textures:0,
  animations:{} as Record<string,{clips:string[];active:string;time:number}>,
  contextLost:false, quality:window.matchMedia('(max-width: 600px)').matches?'mobile':'desktop',
  modelBounds:{} as Record<string,unknown>,
  renderer:'' as string,
  sightLines:{} as Record<string,boolean>,
  weather:{} as Record<string,unknown>,
  toolAnchors:{} as Record<string,{tip:[number,number,number];grip:[number,number,number];activity:string;attached:boolean}>,
  vehicles:{} as Record<string,{position:Point;yaw:number;stage:string;moving:boolean;observedAt:number;wheels?:{wheelAngle:number;steering:number;radius:number;count:number}}>,
}
