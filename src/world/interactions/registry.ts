import type { Interaction } from '../../app/store'
import type { Point } from '../navigation/layout'
import { BAY_IDS,bayCenter } from '../../domain/sitePlan'
export interface InteractionPoint {id:Interaction;anchor:Point;radiusMeters:number;label:string;allowedBy:'public';targetId:string}
export const interactions:InteractionPoint[]=[
  {id:'reception',anchor:[-6,-.8],radiusMeters:3.6,label:'Hablar con recepción',allowedBy:'public',targetId:'receptionist'},
  {id:'services',anchor:[-9.9,2.1],radiusMeters:2.2,label:'Conocer los servicios',allowedBy:'public',targetId:'service-station'},
  ...BAY_IDS.map(id=>({id:'viewing' as const,anchor:[bayCenter(id)[0]-1.6,2.5] as Point,radiusMeters:3,label:'Ver servicio DEMO',allowedBy:'public' as const,targetId:`bay:${id}`})),
]
