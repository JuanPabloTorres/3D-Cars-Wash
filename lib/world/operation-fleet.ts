import * as T from 'three';
import { Car } from './entities';
import type { WorldAssets } from './assets';
import { VEHICLE_COLORS } from '../appearance';
import { visitSpace,type OperationSnapshot,type OperationVisit } from '../operation-view';
type VisualVisit={car:Car;visit:OperationVisit;destination:T.Vector3;plan:T.Vector3[]|null;leaving:boolean;unregister?:()=>void};
const v=(x:number,z:number)=>new T.Vector3(x,0.1,z);
/** Reconciles authoritative visits with actors. Animation never advances business state. */
export class OperationFleet {
  actors=new Map<string,VisualVisit>();
  private initialized=false;
  private active?:VisualVisit;
  constructor(private scene:T.Scene,private assets?:WorldAssets,private register?:(car:Car,key:string)=>()=>void){}
  get busy(){return !!this.active;}
  get incoming(){return !!this.active&&!this.active.leaving&&this.active.car.group.position.z>18;}
  get outgoing(){return !!this.active&&this.active.leaving;}
  sync(snapshot:OperationSnapshot,ownKey?:string){
    const visible=new Set<string>();
    for(const visit of snapshot.visits){
      if(visit.key===ownKey||!ownKey&&visit.mine){if(this.actors.has(visit.key))this.remove(visit.key);continue;}
      const space=visitSpace(visit,snapshot);if(!space)continue;
      visible.add(visit.key);
      const destination=v(space.x,space.z);
      let actor=this.actors.get(visit.key);
      if(!actor){
        const entering=this.initialized&&visit.status!=="ready";
        const car=new Car(entering?-17:space.x,entering?27:space.z,VEHICLE_COLORS[visit.color]??VEHICLE_COLORS.Plata,visit.kind,this.assets);
        car.group.rotation.y=entering?Math.PI:0;
        actor={car,visit,destination,plan:entering?[v(-17,2),v(space.x,2),destination.clone()]:null,leaving:false};
        actor.unregister=this.register?.(car,visit.key);this.scene.add(car.group);this.actors.set(visit.key,actor);
      }else{
        actor.car.setKind(visit.kind);actor.car.paint.color.set(VEHICLE_COLORS[visit.color]??VEHICLE_COLORS.Plata);
        actor.visit=visit;actor.leaving=false;
        if(actor.destination.distanceTo(destination)>0.1){
          const p=actor.car.group.position;
          actor.plan=visit.status==='ready'?[v(p.x,2),v(19.7,2),v(19.7,space.z),destination.clone()]:[v(p.x,2),v(space.x,2),destination.clone()];
          actor.destination=destination;
        }
      }
    }
    for(const [key,actor]of this.actors){
      if(visible.has(key)||actor.leaving)continue;
      if(snapshot.visits.some(v=>v.key===key)){this.remove(key);continue;}
      actor.leaving=true;
      const p=actor.car.group.position;
      actor.plan=p.x>15?[v(19.7,p.z),v(19.7,29)]:[v(p.x,2),v(19.7,2),v(19.7,29)];
    }
    this.initialized=true;
  }
  update(dt:number,customerMoving=false){
    if(this.active){
      this.active.car.update(dt);
      if(!this.active.car.route.length){
        const finished=this.active;this.active=undefined;
        if(finished.leaving&&!finished.plan)this.remove(finished.visit.key);
      }
    }
    if(this.active||customerMoving)return;
    const next=[...this.actors.values()].find(actor=>actor.plan);
    if(next){next.car.route=next.plan!;next.car.routeIndex=0;next.plan=null;this.active=next;}
  }
  hide(){for(const actor of this.actors.values())actor.car.group.visible=false;}
  show(){for(const actor of this.actors.values())actor.car.group.visible=true;}
  inspect(key:string){return this.actors.get(key);}
  private remove(key:string){const actor=this.actors.get(key);if(!actor)return;if(this.active===actor)this.active=undefined;actor.unregister?.();actor.car.group.removeFromParent();actor.car.paint.dispose();this.actors.delete(key);}
  dispose(){for(const key of this.actors.keys())this.remove(key);this.active=undefined;}
}
