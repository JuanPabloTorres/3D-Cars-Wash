import * as T from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { WorldAssets } from "./world/assets";
import { Car, Person, WaterEffect } from "./world/entities";
import { buildEnvironment, type Environment } from "./world/environment";
import { v, box, cylinder, materials as m } from "./world/primitives";
import { bayPosition } from "./visit-view";
import { CATALOG, STATUS_LABEL, type OrderStatus } from "./domain";
export type Destination =
  "overview" | "reception" | "services" | "vehicle" | "lounge" | "exit";
export type WorldCallbacks = {
  onReady: () => void;
  onSelect: (id: string) => void;
  onError: (message: string) => void;
};
type Pin = {
  id: string;
  name: string;
  sub: string;
  position: T.Vector3;
  el: HTMLButtonElement;
};
type Ambient = {
  car: Car;
  worker: Person;
  water: WaterEffect;
  bay: number;
  phase: "wash" | "out" | "in";
  next: number;
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
  pinLayer: HTMLDivElement;
  pins: Pin[] = [];
  ring: T.Mesh;
  resizeObserver: ResizeObserver;
  ray = new T.Raycaster();
  pointer = new T.Vector2();
  destination: Destination = "overview";
  selected: string[] = [];
  orderStatus = "";
  orderBay: number | null = null;
  taskName = "";
  plate = "Tu vehículo";
  currentTarget = v(1, 1.7, -1);
  goalTarget = v(1, 1.7, -1);
  goalPos = v(-6, 4, 24);
  animating = true;
  interactionOpen = false;
  lastFrame = 0;
  frameAverage = 16;
  qualityFrames = 0;
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
    this.renderer.toneMappingExposure = 0.95;
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
    this.scene.background = new T.Color("#bdd9e4");
    this.scene.fog = new T.Fog("#cedfe1", 65, 160);
    this.camera = new T.PerspectiveCamera(this.mobile ? 61 : 48, 1, 0.1, 220);
    this.camera.position.copy(this.goalPos);
    this.scene.add(new T.HemisphereLight("#fff3e0", "#7a8792", 1.7));
    const sun = new T.DirectionalLight("#fff1d8", 3);
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
    this.avatar = new Person(0, 18, false, "#e5e4df", assets);
    this.avatar.group.rotation.y = Math.PI;
    this.avatar.group.visible = false; // first-person visit: no avatar blocks the customer's car.
    this.persons.push(this.avatar);
    this.scene.add(this.avatar.group);
    this.receptionist = new Person(11.1, 10, true, "#454248", assets);
    this.receptionist.mode = "wave";
    this.persons.push(this.receptionist);
    this.scene.add(this.receptionist.group);
    // Environmental actors never mutate business orders.
    for (let i = 0; i < 5; i++) {
      if (i === 3) continue;
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
    this.customer = new Car(-2.5, 17, "#bdc5c9", "SUV", assets);
    this.customer.group.rotation.y = Math.PI * 0.18;
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
    visitor.group.rotation.y = Math.PI;
    this.scene.add(visitor.group);
    this.persons.push(visitor);
    const visitor2 = new Person(-14, 12.7, true, "#b6663a", assets);
    visitor2.group.rotation.y = Math.PI * 0.6;
    this.scene.add(visitor2.group);
    this.persons.push(visitor2);
    const ringMat = new T.MeshBasicMaterial({
      color: "#e8c47c",
      transparent: true,
      opacity: 0.85,
      side: T.DoubleSide,
    });
    this.ring = new T.Mesh(new T.RingGeometry(1.5, 1.55, 64), ringMat);
    this.ring.rotation.x = -Math.PI / 2;
    this.scene.add(this.ring);
    this.pinLayer = document.createElement("div");
    this.pinLayer.className = "world-pins";
    host.appendChild(this.pinLayer);
    this.addPin(
      "reception",
      "Recepción",
      "Habla con tu anfitriona",
      v(11.1, 2.1, 10.4),
    );
    this.addPin("vehicle", "Tu vehículo", "Prepara tu visita", v(-2.5, 3, 17));
    this.addPin(
      "lounge",
      "Zona lounge",
      "Espera con tranquilidad",
      v(-12, 2, 12),
    );
    for (const service of this.environment.serviceObjects)
      this.addPin(
        "service:" + service.id,
        CATALOG.find((s) => s.id === service.id)?.name ?? service.id,
        "Selecciona el objeto",
        service.object.position.clone().add(v(0, 2.8, 0)),
      );
    this.canvas.addEventListener("pointerdown", this.down);
    this.canvas.addEventListener("pointerup", this.up);
    this.canvas.addEventListener("webglcontextlost", this.contextLost);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);
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
    const targets = [
      { id: "vehicle", object: this.customer.group },
      { id: "reception", object: this.receptionist.group },
      { id: "lounge", object: this.environment.lounge },
      ...this.environment.serviceObjects.map((s) => ({
        id: "service:" + s.id,
        object: s.object,
      })),
    ];
    const hits = targets
      .flatMap((target) =>
        this.ray
          .intersectObject(target.object, true)
          .slice(0, 1)
          .map((hit) => ({ id: target.id, distance: hit.distance })),
      )
      .sort((a, b) => a.distance - b.distance);
    if (hits[0]) this.activate(hits[0].id);
  };
  private activate(id: string) {
    if (id.startsWith("task:")) {
      this.callbacks.onSelect("vehicle");
      return;
    }
    if (id.startsWith("service:")) {
      this.callbacks.onSelect(id);
      return;
    }
    this.navigate(id as Destination);
    this.callbacks.onSelect(id);
  }
  private addPin(id: string, name: string, sub: string, position: T.Vector3) {
    const el = document.createElement("button");
    el.className = "world-pin " + (id === "reception" ? "red" : "");
    el.setAttribute("aria-label", name);
    const icon = document.createElement("span");
    icon.className = "pin-dot";
    icon.textContent =
      id === "reception"
        ? "✦"
        : id === "vehicle"
          ? "↗"
          : id === "lounge"
            ? "☕"
            : "+";
    const title = document.createElement("span");
    title.className = "pin-name";
    title.textContent = name;
    const description = document.createElement("small");
    description.textContent = sub;
    [icon, title, description].forEach((child) => el.appendChild(child));
    el.onclick = () => this.activate(id);
    this.pinLayer.appendChild(el);
    this.pins.push({ id, name, sub, position, el });
  }
  navigate(destination: Destination) {
    this.destination = destination;
    this.animating = true;
    this.followOffset = null;
    const views: Record<
      Destination,
      {
        p: T.Vector3;
        t: T.Vector3;
        a: T.Vector3;
      }
    > = {
      overview: { p: v(-6, 4, 24), t: v(1, 1.7, -1), a: v(0, 0.08, 18) },
      reception: {
        p: v(8.9, 2.15, 16.6),
        t: v(11.15, 1.5, 10.6),
        a: v(8, 0.08, 13.3),
      },
      services: {
        p: v(3.3, 2.7, 23),
        t: v(5.6, 1.35, 17),
        a: v(4.8, 0.08, 20),
      },
      vehicle: { p: v(-2, 3.7, 24), t: v(-9, 1.2, 17), a: v(-5.5, 0.08, 17) },
      lounge: {
        p: v(-14.8, 2.4, 16),
        t: v(-2, 1.6, -4),
        a: v(-10, 0.08, 13.8),
      },
      exit: { p: v(10, 3.4, 18), t: v(16, 1.5, 11), a: v(10, 0.08, 16) },
    };
    const view = views[destination];
    if (destination === "vehicle") {
      const car = this.customer.group.position;
      this.followOffset = v(4.8, 2.6, 6.2);
      view.p = car.clone().add(this.followOffset);
      view.t = car.clone().add(v(0, 1.2, 0));
      view.a = v(Math.min(15, car.x + 3.5), 0.08, Math.max(2, car.z + 4));
    }
    if (this.mobile) {
      view.p.y += 1;
      view.p.z += 3;
    }
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
      this.animating = false;
    }
  }
  focusService(id: string) {
    this.destination = "services";
    this.followOffset = null;
    const display = this.environment.serviceObjects.find((s) => s.id === id);
    if (!display) return;
    this.goalTarget.copy(display.object.position).add(v(0, 1.45, 0));
    this.goalPos
      .copy(display.object.position)
      .add(v(-2.3, 2.7, this.mobile ? 7.7 : 6.3));
  }
  setInteraction(open: boolean) {
    this.interactionOpen = open;
  }
  setSelected(ids: string[]) {
    this.selected = ids;
    for (const pin of this.pins) {
      if (!pin.id.startsWith("service:")) continue;
      const selected = ids.includes(pin.id.slice(8));
      pin.el.classList.toggle("selected-service", selected);
      pin.el.querySelector(".pin-dot")!.textContent = selected ? "✓" : "+";
      pin.el.querySelector("small")!.textContent = selected
        ? "Agregado a tu visita"
        : "Selecciona el objeto";
    }
  }
  resetVisit() {
    if (!this.orderStatus) return;
    this.orderStatus = "";
    this.orderBay = null;
    this.customer.route = [];
    this.customer.group.position.set(-2.5, 0.1, 17);
    this.customerWater.active = false;
    this.customerWorker.group.visible = false;
    this.updateVehiclePin();
  }
  setVehicleColor(color: string) {
    const colors: Record<string, string> = {
      Plata: "#bdc5c9",
      Rojo: "#b92b25",
      Azul: "#256faa",
      Negro: "#232b35",
      Blanco: "#f2eee3",
    };
    this.customer.paint.color.set(colors[color] ?? colors.Plata);
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
    this.updateVehiclePin();
  }
  private updateVehiclePin() {
    const pin = this.pins.find((p) => p.id === "vehicle");
    if (!pin) return;
    pin.el.querySelector(".pin-name")!.textContent = this.plate;
    pin.el.querySelector("small")!.textContent =
      this.orderStatus === "working"
        ? this.taskName + " · Cubículo " + (this.orderBay ?? 4)
        : (STATUS_LABEL[this.orderStatus as OrderStatus] ??
          "Prepara tu visita");
    pin.el.classList.toggle("vehicle-working", this.orderStatus === "working");
  }
  setOrderStatus(status: string, bay?: number | null) {
    const key = status + ":" + bay;
    if (key === this.orderStatus + ":" + this.orderBay) return;
    this.orderStatus = status;
    this.orderBay = bay ?? null;
    const p = this.customer.group.position;
    const x = bayPosition(bay);
    const route: Record<string, T.Vector3[]> = {
      requested: [v(-2.5, 0.1, 17)],
      waiting: [v(-2.5, 0.1, 9)],
      working: [v(p.x, 0.1, 2), v(x, 0.1, 2), v(x, 0.1, -6)],
      ready: [v(p.x, 0.1, 2), v(17, 0.1, 2), v(17, 0.1, 10)],
      delivered: [v(18, 0.1, 12), v(18, 0.1, 27)],
      cancelled: [v(-2.5, 0.1, 17)],
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
    this.updateVehiclePin();
    if (this.destination === "vehicle") this.navigate("vehicle");
  }
  resize() {
    const w = this.host.clientWidth,
      h = this.host.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }
  private updateAmbient(t: number, dt: number) {
    for (const visit of this.ambient) {
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
    if (!this.trafficOwner) this.customer.update(dt);
    const isWorking =
      this.orderStatus === "working" &&
      this.customer.group.position.z < -3 &&
      !this.customer.route.length;
    this.customerWorker.group.visible = isWorking;
    this.customerWater.active =
      isWorking && /lavado|shampoo|limpieza del motor/i.test(this.taskName);
    this.customerWater.update(t);
    this.persons.forEach((p, i) => p.update(t + i * 0.7, dt));
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
          ? this.trafficOwner?.phase === "in"
          : this.trafficOwner?.phase === "out" ||
            this.orderStatus === "delivered";
      gate.rotation.z +=
        ((open ? -Math.PI * 0.44 : 0) - gate.rotation.z) * Math.min(1, dt * 2);
    });
    this.ring.position.copy(this.customer.group.position);
    this.ring.position.y = 0.07;
    this.ring.scale.set(1, 1.65, 1);
    this.ring.visible =
      this.destination === "vehicle" && this.orderStatus !== "delivered";
    if (this.destination === "vehicle" && this.followOffset) {
      this.goalPos.copy(this.customer.group.position).add(this.followOffset);
      if (this.mobile) this.goalPos.z += 3;
      this.goalTarget.copy(this.customer.group.position).add(v(0, 1.2, 0));
    }
    const ease = this.reducedMotion ? 1 : 1 - Math.exp(-dt * 2.4);
    this.camera.position.lerp(this.goalPos, ease);
    this.currentTarget.lerp(this.goalTarget, ease);
    this.camera.lookAt(
      this.currentTarget.clone().add(v(0, this.interactionOpen ? -0.7 : 0, 0)),
    );
    this.renderer.render(this.scene, this.camera);
    this.updatePins();
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
  private updatePins() {
    for (const pin of this.pins) {
      if (pin.id.startsWith("task:")) {
        const i = Number(pin.id.slice(5));
        pin.position
          .copy(this.customer.group.position)
          .add(v(i % 2 ? 2.5 : -2.5, 1.8 - i * 0.35, 0.5 + i * 0.7));
      }
      if (pin.id === "vehicle")
        pin.position.copy(this.customer.group.position).add(v(0, 2.15, 0));
      const projected = pin.position.clone().project(this.camera);
      const visible =
        projected.z < 1 &&
        projected.z > -1 &&
        Math.abs(projected.x) < 0.97 &&
        Math.abs(projected.y) < 0.95;
      const service = pin.id.startsWith("service:");
      const relevant =
        (this.destination === "overview" &&
          (pin.id === "reception" ||
            (pin.id === "vehicle" && !!this.orderStatus))) ||
        (this.destination === "services"
          ? service
          : pin.id === this.destination) ||
        (this.destination === "vehicle" && pin.id.startsWith("task:")) ||
        (this.destination === "lounge" && pin.id === "vehicle");
      pin.el.hidden = !visible || !relevant;
      pin.el.style.left =
        (projected.x + 1) * 0.5 * this.host.clientWidth + "px";
      pin.el.style.top =
        (1 - projected.y) * 0.5 * this.host.clientHeight + "px";
    }
  }
  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.resizeObserver.disconnect();
    this.canvas.removeEventListener("pointerdown", this.down);
    this.canvas.removeEventListener("pointerup", this.up);
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
    this.pinLayer.remove();
  }
}
