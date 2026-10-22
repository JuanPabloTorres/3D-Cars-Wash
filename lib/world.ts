import * as T from "three";
import type { AvatarSex } from "./appearance";
import { VEHICLE_COLORS } from "./appearance";
import { visualKey, visitSpace, activityMode, type OperationSnapshot } from "./operation-view";
import { OperationFleet } from "./world/operation-fleet";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { WorldAssets } from "./world/assets";
import { SpatialInterface, type SpatialView } from "./world/spatial-interface";
import { InteractionRegistry } from "./world/interactions";
import { Car, Person, WaterEffect } from "./world/entities";
import { buildEnvironment, type Environment } from "./world/environment";
import { v, box, cylinder, materials as m } from "./world/primitives";
import { bayPosition } from "./visit-view";
import { CATALOG, STATUS_LABEL, type OrderStatus } from "./domain";
import { shotFor, type Destination } from "./world/shots";
export type { Destination } from "./world/shots";
export type WorldCallbacks = {
  onReady: () => void;
  onSelect: (id: string) => void;
  onError: (message: string) => void;
};
type Ambient = {
  car: Car;
  worker: Person;
  water: WaterEffect;
  bay: number;
  phase: "wash" | "out" | "in";
  next: number;
  liveOccupied?:boolean;
};
/** Presentation director: users choose an intention; camera and actors execute it. */
export class CarWashWorld {
  renderer: T.WebGLRenderer;
  scene = new T.Scene();
  camera: T.PerspectiveCamera;
  host: HTMLElement;
  callbacks: WorldCallbacks;
  canvas: HTMLCanvasElement;
  environment: Environment;
  clock = new T.Clock();
  frame = 0;
  disposed = false;
  reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  mobile = window.innerWidth < 650;
  customer: Car;
  avatar: Person;
  receptionist: Person;
  persons: Person[] = [];
  ambient: Ambient[] = [];
  customerWorker: Person;
  customerWater: WaterEffect;
  interactions = new InteractionRegistry();
  interface: SpatialInterface;
  private lastPanel: string | null = null;
  resizeObserver: ResizeObserver;
  ray = new T.Raycaster();
  pointer = new T.Vector2();
  destination: Destination = "overview";
  orderStatus = "";
  orderBay: number | null = null;
  taskName = "";
  plate = "Tu vehículo";
  currentTarget = v(2, 1.55, 3);
  goalTarget = v(2, 1.55, 3);
  goalPos = v(-2, 2.65, 25);
  goalFov = this.mobile ? 61 : 48;
  qualityFrames = 0;
  private entered = false;
  private entryTransition=false;
  private avatarMarker = new T.Group();
  private carHalo = new T.Group();
  private viewingMap = false;
  private operation?: OperationSnapshot;
  private fleet:OperationFleet;
  private activityFocus?:string;
  private queueTarget="";
  private ownVisualKey?:string;
  private ownOrderId?:string;
  private demoScene = false;
  trafficOwner: Ambient | null = null;
  followOffset: T.Vector3 | null = null;
  private environmentMap: T.WebGLRenderTarget;
  static async create(host: HTMLElement, callbacks: WorldCallbacks) {
    const assets = await WorldAssets.load();
    try {
      return new CarWashWorld(host, callbacks, assets);
    } catch (error) {
      assets.dispose();
      throw error;
    }
  }
  private constructor(
    host: HTMLElement,
    callbacks: WorldCallbacks,
    private assets: WorldAssets,
  ) {
    this.host = host;
    this.callbacks = callbacks;
    this.renderer = new T.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, this.mobile ? 1.25 : 1.5),
    );
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    const generator = new T.PMREMGenerator(this.renderer);
    const room = new RoomEnvironment();
    this.environmentMap = generator.fromScene(room, 0.04);
    this.scene.environment = this.environmentMap.texture;
    room.dispose();
    generator.dispose();
    this.canvas = this.renderer.domElement;
    this.canvas.setAttribute(
      "aria-label",
      "Local 3D animado de Febles. Selecciona recepción, servicios o tu carro para dirigir la visita.",
    );
    this.canvas.setAttribute("role", "img");
    host.appendChild(this.canvas);
    this.scene.background = new T.Color("#dbe6d8");
    this.scene.fog = new T.Fog("#dbe6d8", 135, 220);
    this.camera = new T.PerspectiveCamera(this.mobile ? 61 : 48, 1, 0.1, 220);
    this.camera.position.copy(this.goalPos);
    this.scene.add(new T.HemisphereLight("#fff3e0", "#879b91", 2.2));
    const sun = new T.DirectionalLight("#fff0dc", 2.4);
    sun.position.set(-22, 35, 18);
    sun.castShadow = true;
    sun.shadow.mapSize.set(
      this.mobile ? 1024 : 2048,
      this.mobile ? 1024 : 2048,
    );
    Object.assign(sun.shadow.camera, {
      left: -28,
      right: 28,
      top: 28,
      bottom: -28,
      near: 1,
      far: 85,
    });
    sun.shadow.normalBias = 0.045;
    sun.shadow.bias = -0.0001;
    sun.shadow.radius = 3;
    this.scene.add(sun);
    const fill = new T.DirectionalLight("#cfefff", 1);
    fill.position.set(15, 10, -10);
    this.scene.add(fill);
    this.environment = buildEnvironment(this.scene, this.mobile, assets);
    this.fleet=new OperationFleet(this.scene,assets,(car,key)=>this.interactions.register(car.group,"activity:"+key,"Vehículo del local"));
    this.avatar = new Person(0, 25.5, false, "#e5e4df", assets);
    this.avatar.group.rotation.y = Math.PI;
    this.avatar.group.visible = true;
    this.persons.push(this.avatar);
    this.scene.add(this.avatar.group);
    const marker = new T.Mesh(new T.OctahedronGeometry(0.15),new T.MeshStandardMaterial({color:"#80bd9e",emissive:"#4d8e79",emissiveIntensity:0.15,roughness:0.6}));
    this.avatarMarker.add(marker);this.scene.add(this.avatarMarker);
    const ring = new T.Mesh(new T.RingGeometry(2.7,2.74,80),new T.MeshBasicMaterial({color:"#eaf7e7",side:T.DoubleSide,transparent:true,opacity:0.75}));
    ring.rotation.x=-Math.PI/2;this.carHalo.add(ring);this.scene.add(this.carHalo);
    this.receptionist = new Person(11.1, 10, true, "#454248", assets);
    this.receptionist.mode = "wave";
    this.persons.push(this.receptionist);
    this.scene.add(this.receptionist.group);
    // Environmental actors never mutate business orders.
    for (let i = 0; i < 5; i++) {

      const x = (i - 2) * 6,
        car = new Car(
          x,
          -6,
          ["#2778a6", "#b42d28", "#d5d5ca", "#485664", "#315d6a"][i],
          i % 2 ? "Sedán" : "SUV",
          assets,
        );
      car.bay = i + 1;
      car.group.rotation.y = 0;
      this.scene.add(car.group);
      const worker = new Person(x + 1.6, -4.8, false, "#37383b", assets);
      worker.group.rotation.y = -Math.PI / 2;
      worker.mode = "work";
      box(worker.rightArm, 0.1, 0.13, 0.3, m.red, 0, 0, 0.02, 0.025);
      box(worker.rightArm, 0.05, 0.05, 0.65, m.steel, 0, 0, 0.4, 0.02);
      this.scene.add(worker.group);
      this.persons.push(worker);
      const water = new WaterEffect(x, -6, i);
      this.scene.add(water.group);
      this.ambient.push({
        car,
        worker,
        water,
        bay: i + 1,
        phase: "wash",
        next: 8 + i * 9,
      });
    }
    this.customer = new Car(-6, 24, "#bdc5c9", "SUV", assets);
    this.customer.group.rotation.y = Math.PI * 0.18;
    this.customer.group.visible=false;
    this.scene.add(this.customer.group);
    this.customerWorker = new Person(7.6, -4.8, false, "#37383b", assets);
    this.customerWorker.group.rotation.y = -Math.PI / 2;
    this.customerWorker.mode = "work";
    this.customerWorker.group.visible = false;
    this.scene.add(this.customerWorker.group);
    this.persons.push(this.customerWorker);
    this.customerWater = new WaterEffect(6, -6);
    this.customerWater.active = false;
    this.scene.add(this.customerWater.group);
    // A visitor walks between reception and lounge, while two visitors relax.
    const visitor = new Person(-9.8, 13, false, "#647c9b", assets);
    visitor.group.visible=false;
    visitor.group.rotation.y = Math.PI;
    this.scene.add(visitor.group);
    this.persons.push(visitor);
    const visitor2 = new Person(-14, 12.7, true, "#b6663a", assets);
    visitor2.group.visible=false;
    visitor2.group.rotation.y = Math.PI * 0.6;
    this.scene.add(visitor2.group);
    this.persons.push(visitor2);
    this.interface = new SpatialInterface(
      this.scene,
      host,
      this.interactions,
      (id) => this.activate(id),
      assets,
      this.environment.serviceObjects,
      this.mobile,
    );
    this.interactions.register(this.environment.reception,"reception","Recepción y bienvenida");
    this.interactions.register(this.environment.entrance,"enter","Entrar al local");
    this.interactions.register(this.customer.group, "vehicle", "Tu vehículo");
    this.interactions.register(
      this.receptionist.group,
      "reception",
      "Tu anfitriona",
    );
    this.interactions.register(
      this.environment.lounge,
      "lounge",
      "Zona lounge",
    );
    for (const service of this.environment.serviceObjects)
      this.interactions.register(
        service.object,
        "service:" + service.id,
        "Elegir " + service.id,
      );
    this.canvas.addEventListener("pointerdown", this.down);
    this.canvas.addEventListener("pointerup", this.up);
    this.canvas.addEventListener("pointermove", this.hover);
    this.canvas.addEventListener("webglcontextlost", this.contextLost);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);
    const entryShot = shotFor(
      "entrance",
      this.mobile,
      this.customer.group.position,
    );
    this.goalPos.copy(entryShot.eye);
    this.goalTarget.copy(entryShot.target);
    this.currentTarget.copy(entryShot.target);
    this.camera.position.copy(entryShot.eye);
    this.resize();
    this.camera.lookAt(this.currentTarget);
    this.animate();
    callbacks.onReady();
  }
  private contextLost = (e: Event) => {
    e.preventDefault();
    this.callbacks.onError(
      "La escena perdió la conexión gráfica. Recarga la página para continuar.",
    );
  };
  private pointerDown = { x: 0, y: 0 };
  private down = (e: PointerEvent) => {
    this.pointerDown = { x: e.clientX, y: e.clientY };
  };
  private up = (e: PointerEvent) => {
    if (
      Math.hypot(
        e.clientX - this.pointerDown.x,
        e.clientY - this.pointerDown.y,
      ) > 8
    )
      return;
    const bounds = this.canvas.getBoundingClientRect();
    this.pointer.set(
      ((e.clientX - bounds.left) / bounds.width) * 2 - 1,
      (-(e.clientY - bounds.top) / bounds.height) * 2 + 1,
    );
    this.ray.setFromCamera(this.pointer, this.camera);
    const selected = this.interactions.pick(this.ray, this.scene);
    if (selected) this.activate(selected);
  };
  private hoverTime = 0;
  private hover = (event: PointerEvent) => {
    if (performance.now() - this.hoverTime < 80) return;
    this.hoverTime = performance.now();
    const bounds = this.canvas.getBoundingClientRect();
    this.pointer.set(
      ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
      (-(event.clientY - bounds.top) / bounds.height) * 2 + 1,
    );
    this.ray.setFromCamera(this.pointer, this.camera);
    this.canvas.style.cursor = this.interactions.pick(this.ray, this.scene)
      ? "pointer"
      : "default";
  };
  private activate(id: string) {
    if(id.startsWith("activity:")){
      const key=id.slice(9),actor=this.fleet.inspect(key);if(!actor)return;
      this.callbacks.onSelect("world-focus");
      this.activityFocus=key;this.followOffset=null;this.viewingMap=false;
      this.goalFov=this.mobile?58:48;
      this.environment.roofs.forEach(roof=>{roof.visible=false;});
      this.interface.inspectVisit(actor.visit,actor.car.group.position);
      return;
    }
    if (id === "service-page") {
      this.interface.toggleServicePage();
      return;
    }
    this.callbacks.onSelect(id);
  }
  enter() {
    this.entered=true;
    if(this.reducedMotion){this.navigate("overview");return;}
    this.entryTransition=true;
    this.goalPos.set(0,2.4,18.8);this.goalTarget.set(0,1.7,2);
    this.avatar.goTo([v(0,0.08,22),v(0,0.08,18)]);
  }
  setAvatarSex(sex: AvatarSex) { this.avatar.setAppearance(sex === "female"); }
  navigate(destination: Destination) {
    this.entryTransition=false;
    this.activityFocus=undefined;this.interface?.clearInspection();
    this.entered=true;
    this.viewingMap=destination === "overview";
    this.environment.roofs.forEach(roof=>{roof.visible=!this.viewingMap;});
    this.interface.setMapMode(this.viewingMap);
    this.destination = destination;
    this.goalFov = this.mobile ? 61 : 48;
    this.followOffset = null;
    const shot = shotFor(
      destination,
      this.mobile,
      this.customer.group.position,
    );
    const view = { p: shot.eye, t: shot.target, a: shot.avatar };
    this.goalFov = shot.fov;
    if (destination === "vehicle")
      this.followOffset = shot.eye.clone().sub(this.customer.group.position);
    this.goalPos.copy(view.p);
    this.goalTarget.copy(view.t);
    const start = this.avatar.group.position;
    const path =
      destination === "vehicle" && this.orderStatus === "working"
        ? [v(-4.5, 0.08, 20), v(-4.5, 0.08, 2), view.a]
        : [v(start.x, 0.08, 20), v(view.a.x, 0.08, 20), view.a];
    this.avatar.goTo(path);
    if (this.reducedMotion) {
      this.camera.position.copy(this.goalPos);
      this.currentTarget.copy(this.goalTarget);
      this.avatar.waypoints = [];
      this.avatar.target.copy(view.a);
      this.avatar.group.position.copy(view.a);
    }
  }
  setExperienceView(view: SpatialView) {
    this.interface.setView(view);
    this.operation=view.operation;
    if(view.orderId!==this.ownOrderId){
      this.ownOrderId=view.orderId;this.ownVisualKey=undefined;
      if(view.orderId){const id=view.orderId;visualKey(id).then(key=>{if(!this.disposed&&this.ownOrderId===id){this.ownVisualKey=key;if(this.operation&&!this.demoScene)this.fleet.sync(this.operation,key);this.placeOwnVisit();}});}
    }
    if(view.operation&&!view.demo&&(!view.orderId||this.ownVisualKey))this.fleet.sync(view.operation,this.ownVisualKey);
    if(view.demo)this.fleet.hide();else this.fleet.show();
    this.customer.group.visible=!!view.orderId||["vehicle","profile"].includes(view.panel??"");
    this.placeOwnVisit();
    if(view.demo!==this.demoScene){
      this.trafficOwner=null;
      this.ambient.forEach(visit=>{
        visit.car.route=[];visit.car.target=null;visit.phase="wash";visit.liveOccupied=undefined;
        visit.car.group.position.set((visit.bay-3)*6,0.1,-6);visit.car.group.rotation.y=0;
        visit.next=this.clock.elapsedTime+8+visit.bay*8;
      });
    }
    this.demoScene=view.demo;
    if(view.avatarSex) this.setAvatarSex(view.avatarSex);
    if (view.panel !== this.lastPanel) {
      const preview=["vehicle","profile"].includes(view.panel??"");
      const wasPreview=["vehicle","profile"].includes(this.lastPanel??"");
      if(!this.orderStatus||["requested","cancelled"].includes(this.orderStatus)){
        if(preview){this.customer.route=[];this.customer.group.position.set(-2.5,0.1,17);}
        else if(wasPreview){this.customer.group.position.set(-6,0.1,24);}
      }
      if (["quote", "order", "guarantee", "saved"].includes(view.panel ?? "")) {
        const shot = shotFor(
          "clipboard",
          this.mobile,
          this.customer.group.position,
        );
        this.followOffset = null;
        this.goalFov = shot.fov;
        this.goalPos.copy(shot.eye);
        this.goalTarget.copy(shot.target);
        this.receptionist.goTo([v(12, 0.08, 10.3)]);
      }
      if (view.panel === "vehicle" || view.panel === "profile") {
        const shot = shotFor(
          "tablet",
          this.mobile,
          this.customer.group.position,
        );
        this.followOffset = null;
        this.goalFov = shot.fov;
        this.goalPos.copy(shot.eye);
        this.goalTarget.copy(shot.target);
        this.avatar.goTo([v(-4.6,0.08,20.2)]);
      }
      if (view.panel === "reception")
        this.receptionist.goTo([v(11.1, 0.08, 10)]);
      this.lastPanel = view.panel;
    }
    this.avatar.group.visible = ![
      "reception",
      "quote",
      "order",
      "guarantee",
      "login",
      "admin",
    ].includes(view.panel ?? "");
  }
  private placeOwnVisit(){
    const ownVisit=this.operation?.visits.find(visit=>visit.key===this.ownVisualKey);
    if(ownVisit&&["waiting","ready"].includes(ownVisit.status)&&this.orderStatus===ownVisit.status){
      const space=visitSpace(ownVisit,this.operation!);
      const key=space?ownVisit.status+":"+space.x+":"+space.z:"";
      if(space&&key!==this.queueTarget){
        this.queueTarget=key;const p=this.customer.group.position;
        this.customer.route=ownVisit.status==="ready"?[v(p.x,0.1,2),v(19.7,0.1,2),v(19.7,0.1,space.z),v(space.x,0.1,space.z)]:[v(p.x,0.1,2),v(space.x,0.1,2),v(space.x,0.1,space.z)];this.customer.routeIndex=0;
      }
    }
  }
  getTabletHost() {
    return this.interface.portal;
  }
  resetVisit() {
    if (!this.orderStatus) return;
    this.orderStatus = "";
    this.orderBay = null;
    this.customer.route = [];
    this.customer.group.position.set(-6, 0.1, 24);
    this.customerWater.active = false;
    this.customerWorker.group.visible = false;
  }
  setVehicleColor(color: string) {
    this.customer.paint.color.set(VEHICLE_COLORS[color] ?? VEHICLE_COLORS.Plata);
  }

  setVehicleKind(kind: string) {
    this.customer.setKind(kind);
  }
  setVisitDetails(
    plate: string,
    tasks: {
      name: string;
      status: string;
    }[],
  ) {
    this.plate = plate || "Tu vehículo";
    this.taskName =
      tasks.find((t) => t.status !== "done")?.name ?? "Revisión completada";
  }
  setOrderStatus(status: string, bay?: number | null) {
    const key = status + ":" + bay;
    if (key === this.orderStatus + ":" + this.orderBay) return;
    this.orderStatus = status;
    this.orderBay = bay ?? null;
    const p = this.customer.group.position;
    const x = bayPosition(bay);
    const route: Record<string, T.Vector3[]> = {
      requested: [v(-6, 0.1, 24)],
      waiting: [v(-3, 0.1, 7)],
      working: [v(p.x, 0.1, 2), v(x, 0.1, 2), v(x, 0.1, -6)],
      ready: [v(p.x, 0.1, 2), v(19.7, 0.1, 2), v(19.7, 0.1, 8),v(17,0.1,8)],
      delivered: [v(19.7,0.1,p.z), v(19.7, 0.1, 29)],
      cancelled: [v(-6, 0.1, 24)],
    };
    this.customer.route = route[status] ?? [];
    this.customer.routeIndex = 0;
    if (this.reducedMotion && this.customer.route.length) {
      this.customer.group.position.copy(this.customer.route.at(-1)!);
      this.customer.route = [];
    }
    this.customerWorker.group.position.x = x + 1.6;
    this.customerWorker.target.copy(this.customerWorker.group.position);
    this.customerWater.group.position.x = x;
    this.environment.signals.forEach((signal,index)=>{
      const ownBay=index+1===(bay??4),occupied=ownBay?status==="working":this.ambient.some(a=>a.bay===index+1&&a.phase==="wash");
      signal.color.set(occupied?"#edb76a":"#86bfa3");signal.emissive.copy(signal.color);
    });
    if (this.destination === "vehicle") this.navigate("vehicle");
  }
  resize() {
    const w = this.host.clientWidth,
      h = this.host.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.interface?.resize(w, h);
  }
  private updateAmbient(t: number, dt: number) {
    for (const visit of this.ambient) {
      if(!this.demoScene){
        const activity=this.operation?.bays.find(b=>b.bay===visit.bay);
        const isOwn=this.orderStatus==="working"&&visit.bay===(this.orderBay??4);
        visit.car.group.visible=false;
        visit.worker.group.visible=!!activity&&!isOwn;visit.worker.mode=activity?"work":"idle";
        const settled=[...this.fleet.actors.values()].find(actor=>actor.visit.bay===visit.bay&&actor.visit.status==="working"&&!actor.car.route.length&&!actor.plan);
        visit.water.active=!!settled&&!isOwn&&activityMode(activity?.task??"")==="wash";visit.water.update(t);
        continue;
      }
      const reserved =
        this.orderStatus === "working" && visit.bay === (this.orderBay ?? 4);
      visit.car.group.visible = !reserved;
      visit.worker.group.visible = !reserved;
      visit.water.active = !reserved && visit.phase === "wash";
      if (reserved) {
        if (this.trafficOwner === visit) this.trafficOwner = null;
        continue;
      }
      visit.car.update(dt);
      if (
        visit.phase === "wash" &&
        t > visit.next &&
        !this.trafficOwner &&
        !this.customer.route.length
      ) {
        visit.phase = "out";
        this.trafficOwner = visit;
        visit.water.active = false;
        visit.car.route = [
          v((visit.bay - 3) * 6, 0.1, 2),
          v(18, 0.1, 2),
          v(18, 0.1, 28),
        ];
        visit.car.routeIndex = 0;
      } else if (visit.phase === "out" && !visit.car.route.length) {
        visit.phase = "in";
        visit.car.group.position.set(-17, 0.1, 27);
        visit.car.group.rotation.y = Math.PI;
        visit.car.route = [
          v(-17, 0.1, 1),
          v((visit.bay - 3) * 6, 0.1, 1),
          v((visit.bay - 3) * 6, 0.1, -6),
        ];
        visit.car.routeIndex = 0;
      } else if (visit.phase === "in" && !visit.car.route.length) {
        visit.phase = "wash";
        this.trafficOwner = null;
        visit.next = t + 28 + visit.bay * 3;
        visit.car.group.rotation.y = 0;
      }
      visit.worker.mode = visit.phase === "wash" ? "work" : "idle";
      visit.water.update(t);
    }
  }
  private animate = () => {
    if (this.disposed) return;
    this.frame = requestAnimationFrame(this.animate);
    const dt = Math.min(this.clock.getDelta(), 0.05),
      t = this.clock.elapsedTime;
    if (document.hidden) return;
    this.updateAmbient(t, dt);
    if(!this.demoScene)this.fleet.update(dt,!!this.customer.route.length);
    this.environment.signals.forEach((signal,index)=>{
      const occupied=this.demoScene||this.operation?.bays.some(b=>b.bay===index+1);
      signal.color.set(!this.operation&&!this.demoScene?"#a4a99e":occupied?"#e4b569":"#7eaf95");signal.emissive.copy(signal.color);
      const deck=this.environment.bayTargets[index].children[0] as T.Mesh;
      (deck.material as T.MeshStandardMaterial).color.set(!this.operation&&!this.demoScene?"#c7ccc2":occupied?"#b9cbbd":"#d8e2cc");
    });
    if (!this.trafficOwner&&(this.demoScene||!this.fleet.busy)) this.customer.update(dt);
    const isWorking =
      this.orderStatus === "working" &&
      this.customer.group.position.z < -3 &&
      !this.customer.route.length;
    this.customerWorker.group.visible = isWorking;
    this.customerWater.active =
      isWorking && activityMode(this.taskName)==="wash";
    this.customerWater.update(t);
    this.avatarMarker.position.copy(this.avatar.group.position).add(v(0,2.12+Math.sin(t*2)*0.025,0));
    this.avatarMarker.visible=this.avatar.group.visible;
    this.avatarMarker.rotation.y=t*0.5;
    this.carHalo.position.copy(this.customer.group.position);this.carHalo.position.y=0.13;
    this.carHalo.visible=this.customer.group.visible&&(this.viewingMap || this.destination==="vehicle");
    this.environment.doors.forEach((door,i)=>{const target=this.entered?(i===0?-1:1)*Math.PI*0.47:0;door.rotation.y+=(target-door.rotation.y)*Math.min(1,dt*3);});
    this.persons.forEach((p, i) => p.update(t + i * 0.7, dt));
    const receptionistDelta = this.receptionist.target
      .clone()
      .sub(this.receptionist.group.position)
      .setY(0);
    if (
      receptionistDelta.length() < 0.08 &&
      !this.receptionist.waypoints.length
    ) {
      const delta = this.camera.position
        .clone()
        .sub(this.receptionist.group.position);
      const heading = new T.Quaternion().setFromAxisAngle(
        v(0, 1, 0),
        Math.atan2(delta.x, delta.z),
      );
      this.receptionist.group.quaternion.slerp(heading, Math.min(1, dt * 4));
    }
    if (!this.reducedMotion) {
      this.environment.palms.forEach((p, i) => {
        p.rotation.z = Math.sin(t * 0.7 + i) * 0.025;
        p.rotation.x = Math.cos(t * 0.6 + i) * 0.018;
      });
      this.environment.clouds.position.x = Math.sin(t * 0.015) * 8;
    }
    this.environment.gates.forEach((gate, i) => {
      const open =
        i === 0
          ? this.trafficOwner?.phase === "in" || this.fleet.incoming
          : this.trafficOwner?.phase === "out" || this.fleet.outgoing ||
            this.orderStatus === "delivered";
      gate.rotation.z +=
        ((open ? -Math.PI * 0.44 : 0) - gate.rotation.z) * Math.min(1, dt * 2);
    });
    if(this.activityFocus){
      const actor=this.fleet.inspect(this.activityFocus);
      if(actor){
        this.goalPos.copy(actor.car.group.position).add(v(4.5,2.8,this.mobile?9:6.8));
        this.goalTarget.copy(actor.car.group.position).add(v(0,1.1,0));
        this.interface.inspectVisit(actor.visit,actor.car.group.position);
      }else{this.activityFocus=undefined;this.navigate("overview");}
    }
    if (!this.activityFocus&&this.destination === "vehicle" && this.followOffset) {
      this.goalPos.copy(this.customer.group.position).add(this.followOffset);
      this.goalTarget.copy(this.customer.group.position).add(v(0, 1.2, 0));
    }
    if (!this.activityFocus&&this.destination === "lounge")
      this.goalTarget.copy(this.customer.group.position).add(v(0, 1.1, 0));
    const ease = this.reducedMotion ? 1 : 1 - Math.exp(-dt * 2.4);
    this.camera.position.lerp(this.goalPos, ease);
    if(this.entryTransition&&this.camera.position.distanceTo(this.goalPos)<0.25)this.navigate("overview");
    if (Math.abs(this.camera.fov - this.goalFov) > 0.01) {
      this.camera.fov += (this.goalFov - this.camera.fov) * ease;
      this.camera.updateProjectionMatrix();
    }
    this.currentTarget.lerp(this.goalTarget, ease);
    this.camera.lookAt(this.currentTarget);
    this.interface.update(this.customer.group.position,!!this.customer.route.length,t);
    this.renderer.render(this.scene, this.camera);
    this.interface.render(this.camera);
    if (++this.qualityFrames === 90) {
      const elapsed = this.clock.elapsedTime;
      const fps = this.qualityFrames / elapsed;
      if (fps < 24) {
        this.renderer.setPixelRatio(1);
        this.environment.reflector.visible = false;
      }
      this.qualityFrames = -999999;
    }
  };
  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.resizeObserver.disconnect();
    this.canvas.removeEventListener("pointerdown", this.down);
    this.canvas.removeEventListener("pointerup", this.up);
    this.canvas.removeEventListener("pointermove", this.hover);
    this.fleet.dispose();
    this.interface.dispose();
    this.interactions.clear();
    this.canvas.removeEventListener("webglcontextlost", this.contextLost);
    this.environment.reflector.getRenderTarget().dispose();
    this.environmentMap.dispose();
    this.persons.forEach((p) => p.dispose());
    this.assets.dispose();
    const geometries = new Set<T.BufferGeometry>(),
      materials = new Set<T.Material>(),
      textures = new Set<T.Texture>();
    this.scene.traverse((obj) => {
      if (obj instanceof T.Mesh || obj instanceof T.Points) {
        geometries.add(obj.geometry);
        for (const material of Array.isArray(obj.material)
          ? obj.material
          : [obj.material]) {
          materials.add(material);
          const map = (material as T.MeshStandardMaterial).map;
          if (map) textures.add(map);
        }
      }
    });
    geometries.forEach((g) => g.dispose());
    textures.forEach((t) => t.dispose());
    materials.forEach((m) => m.dispose());
    this.renderer.dispose();
    this.canvas.remove();
  }
}
