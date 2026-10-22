import * as T from "three";
import { v } from "./primitives";
import type { WorldAssets } from "./assets";

/** Actor motion is independent from the imported presentation model. */
export class Person {
  group = new T.Group();
  rightArm = new T.Group();
  target = new T.Vector3();
  waypoints: T.Vector3[] = [];
  mode: "idle" | "wave" | "work" | "seated" = "idle";
  private mixer?: T.AnimationMixer;
  private rig?: T.Object3D;
  private modelRoot?: T.Group;
  private female?: boolean;
  private restPose = new Map<T.Bone, T.Quaternion>();
  constructor(
    x: number,
    z: number,
    female = false,
    private shirt = "#393b3e",
    private assets?: WorldAssets,
  ) {
    this.group.position.set(x, 0.08, z);
    this.target.copy(this.group.position);
    this.setAppearance(female);
  }
  /** Swap only the visual rig. Navigation, identity and the current route are preserved. */
  setAppearance(female: boolean) {
    if(this.female === female) return;
    this.female = female;
    this.releaseModel();
    if (this.assets) {
      const actor = this.assets.person(female, this.shirt);
      this.modelRoot = actor.root;
      this.group.add(actor.root);
      this.mixer = actor.mixer;
      this.rig = actor.rig;
      actor.rig.traverse(o => { if(o instanceof T.Bone) this.restPose.set(o,o.quaternion.clone()); });
      const hand = actor.rig.getObjectByName("hand_r");
      if(hand) {hand.add(this.rightArm);this.rightArm.scale.setScalar(0.7);}
    }
  }
  private releaseModel() {
    this.rightArm.removeFromParent();
    this.mixer?.stopAllAction();
    if(this.rig) this.mixer?.uncacheRoot(this.rig);
    // Person factories own material clones. Mesh buffers and textures belong to WorldAssets.
    const owned = new Set<T.Material>();
    this.modelRoot?.traverse(o => {
      if(o instanceof T.Mesh) {
        (Array.isArray(o.material)?o.material:[o.material]).filter(m=>m.userData.actorOwned).forEach(m=>owned.add(m));
        if(o.geometry.userData.actorOwned)o.geometry.dispose();
        if(o instanceof T.SkinnedMesh)o.skeleton.dispose();
      }
    });
    owned.forEach(m=>m.dispose());
    this.modelRoot?.removeFromParent();
    this.modelRoot=undefined;this.rig=undefined;this.mixer=undefined;this.restPose.clear();
  }
  goTo(points: T.Vector3[]) {
    this.waypoints = points.map((p) => p.clone());
    const first = this.waypoints.shift();
    if (first) this.target.copy(first);
  }
  update(t: number, dt: number) {
    let delta = this.target.clone().sub(this.group.position);
    delta.y = 0;
    if (delta.length() < 0.07 && this.waypoints.length) {
      this.target.copy(this.waypoints.shift()!);
      delta = this.target.clone().sub(this.group.position);
      delta.y = 0;
    }
    const walking = delta.length() > 0.06;
    if (walking) {
      const step = delta
        .clone()
        .normalize()
        .multiplyScalar(Math.min(dt * 2.3, delta.length()));
      this.group.position.add(step);
      this.group.rotation.y = Math.atan2(step.x, step.z);
    }
    this.restPose.forEach((pose, bone) => bone.quaternion.copy(pose));
    this.mixer?.update(dt);
    const rotate = (name: string, x = 0, y = 0, z = 0) => {
      const bone = this.rig?.getObjectByName(name);
      if (bone)
        bone.quaternion.multiply(
          new T.Quaternion().setFromEuler(new T.Euler(x, y, z)),
        );
    };
    if (walking) {
      const swing = Math.sin(t * 7) * 0.35;
      rotate("thigh_l", swing);
      rotate("thigh_r", -swing);
      rotate("calf_l", Math.max(0, -swing) * 0.7);
      rotate("calf_r", Math.max(0, swing) * 0.7);
      rotate("upperarm_l", -swing * 0.7);
      rotate("upperarm_r", swing * 0.7);
    } else if (this.mode === "work") {
      rotate("upperarm_r", -0.7, 0, -0.15);
      rotate("lowerarm_r", -0.4 + Math.sin(t * 2) * 0.18);
      rotate("upperarm_l", -0.35);
    } else if (this.mode === "wave" && Math.sin(t * 0.35) > 0.65) {
      rotate("upperarm_r", -0.1, 0, -1.3);
      rotate("lowerarm_r", -0.6, Math.sin(t * 4) * 0.18);
    }
    this.group.position.y =
      0.08 + (walking ? Math.abs(Math.sin(t * 7)) * 0.018 : 0);
  }
  dispose() {
    this.releaseModel();
  }
}

export class Car {
  group = new T.Group();
  wheels: T.Group[] = [];
  paint = new T.MeshPhysicalMaterial({ color: "#bdc5c9" });
  kind = "SUV";
  target: T.Vector3 | null = null;
  route: T.Vector3[] = [];
  routeIndex = 0;
  speed = 3;
  bay?: number;
  constructor(
    x: number,
    z: number,
    color = "#bac2ca",
    kind = "SUV",
    private assets?: WorldAssets,
  ) {
    this.paint.color.set(color);
    this.group.position.set(x, 0.1, z);
    this.kind = kind;
    this.build();
  }
  build() {
    const color = this.paint.color.clone();
    this.paint.dispose();
    this.group.clear();
    if (this.assets) {
      const model = this.assets.vehicle(this.kind, color);
      this.paint = model.paint;
      this.wheels = model.wheels;
      this.group.add(model.root);
    } else {
      // Empty actors permit deterministic simulation tests without downloading visuals.
      this.paint = new T.MeshPhysicalMaterial({ color });
      this.wheels = Array.from({ length: 4 }, () => new T.Group());
    }
  }
  setKind(kind: string) {
    if (this.kind !== kind) {
      this.kind = kind;
      this.build();
    }
  }
  update(dt: number) {
    const target = this.route[this.routeIndex] ?? this.target;
    if (!target) return;
    const delta = target.clone().sub(this.group.position);
    delta.y = 0;
    const distance = delta.length();
    if (distance < 0.12) {
      if (this.route.length) {
        this.routeIndex++;
        if (this.routeIndex >= this.route.length) {
          this.route = [];
          this.routeIndex = 0;
          this.target = null;
        }
      }
      return;
    }
    const movement = Math.min(dt * this.speed, distance);
    this.group.position.add(delta.normalize().multiplyScalar(movement));
    const desired = new T.Quaternion().setFromAxisAngle(
      v(0, 1, 0),
      Math.atan2(delta.x, delta.z),
    );
    this.group.quaternion.slerp(desired, Math.min(dt * 5, 1));
    this.wheels.forEach((w) => (w.rotation.x += movement / 0.36));
  }
}
export class WaterEffect {
  group = new T.Group();
  points: T.Points;
  foam: T.InstancedMesh;
  active = true;
  offset: number;
  constructor(x: number, z: number, offset = 0) {
    this.offset = offset;
    this.group.position.set(x, 0, z);
    const pos = new Float32Array(210 * 3);
    const geometry = new T.BufferGeometry();
    geometry.setAttribute("position", new T.BufferAttribute(pos, 3));
    this.points = new T.Points(
      geometry,
      new T.PointsMaterial({
        color: "#e5faff",
        size: 0.035,
        transparent: true,
        opacity: 0.75,
        depthWrite: false,
      }),
    );
    this.group.add(this.points);
    this.foam = new T.InstancedMesh(
      new T.SphereGeometry(0.065, 8, 6),
      new T.MeshStandardMaterial({
        color: "#fcffff",
        roughness: 0.45,
        transparent: true,
        opacity: 0.7,
      }),
      65,
    );
    this.group.add(this.foam);
    const dummy = new T.Object3D();
    for (let i = 0; i < 65; i++) {
      dummy.position.set(
        Math.sin(i * 3.1) * 0.85,
        1.08 + (i % 5) * 0.17,
        Math.cos(i * 2.2) * 1.7,
      );
      dummy.scale.setScalar(0.65 + (i % 4) * 0.2);
      dummy.updateMatrix();
      this.foam.setMatrixAt(i, dummy.matrix);
    }
  }
  update(t: number) {
    this.group.visible = this.active;
    if (!this.active) return;
    const p = this.points.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const f = (t * 1.5 + i * 0.017 + this.offset) % 1;
      const a = i * 2.399;
      p.setXYZ(
        i,
        1.7 - f * 1.9,
        2.1 - f * 1.3 + Math.sin(a) * 0.3,
        Math.cos(a) * 0.5 + Math.sin(t + i) * 0.25,
      );
    }
    p.needsUpdate = true;
    this.foam.scale.y = 0.96 + Math.sin(t * 2 + this.offset) * 0.025;
  }
}
