import * as T from "three";
import type { WorldAssets } from "./assets";
import { Reflector } from "three/addons/objects/Reflector.js";
import {
  box,
  sphere,
  cylinder,
  tube,
  sign,
  brand,
  batch,
  mat,
  materials as m,
  v,
} from "./primitives";
export type Environment = {
  root: T.Group;
  palms: T.Group[];
  clouds: T.Group;
  reflector: Reflector;
  floor: T.Mesh;
  serviceObjects: {
    id: string;
    object: T.Object3D;
  }[];
  gates: T.Group[];
  lounge: T.Group;
  reception: T.Group;
  entrance: T.Group;
  doors: T.Group[];
  roofs: T.Object3D[];
  bayTargets: T.Group[];
  signals: T.MeshStandardMaterial[];
};
function leafGeometry(length: number, width: number) {
  const pos: number[] = [],
    uv: number[] = [],
    idx: number[] = [];
  const count = 12;
  for (let i = 0; i <= count; i++) {
    const t = i / count,
      w = Math.sin(Math.PI * t) * width;
    for (const side of [-1, 1]) {
      pos.push(side * w, -t * t * length * 0.42, t * length);
      uv.push((side + 1) / 2, t);
    }
    if (i < count) {
      const k = i * 2;
      idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
    }
  }
  const g = new T.BufferGeometry();
  g.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
function palm(
  root: T.Group,
  canopies: T.Group[],
  x: number,
  z: number,
  height = 6,
  assets?: WorldAssets,
) {
  if (assets) {
    const tree = assets.palm(height);
    tree.position.set(x, 0, z);
    root.add(tree);
    canopies.push(tree);
    return;
  }
  const trunk = cylinder(root, 0.18, height, m.trunk, x, height / 2, z, 0.12);
  trunk.rotation.z = 0.04;
  for (let j = 0; j < 14; j++)
    cylinder(root, 0.19, 0.035, m.woodLight, x, (height * j) / 14, z, 0.18);
  const canopy = new T.Group();
  canopy.position.set(x + 0.2, height, z);
  for (let i = 0; i < 10; i++) {
    const leaf = new T.Mesh(
      leafGeometry(2.7 + (i % 3) * 0.25, 0.27),
      i % 2 ? m.leaf : m.green,
    );
    leaf.material.side = T.DoubleSide;
    leaf.rotation.y = (i * Math.PI) / 5;
    leaf.rotation.x = -0.18;
    canopy.add(leaf);
  }
  for (let i = 0; i < 3; i++)
    sphere(
      canopy,
      0.16,
      m.trunk,
      Math.sin(i * 2) * 0.2,
      -0.12,
      Math.cos(i * 2) * 0.2,
    );
  batch(canopy);
  root.add(canopy);
  canopies.push(canopy);
}
function plant(root: T.Group, x: number, z: number, size = 1) {
  for (let i = 0; i < 8; i++) {
    const leaf = new T.Mesh(
      leafGeometry(0.8 * size, 0.16 * size),
      i % 2 ? m.leafLight : m.green,
    );
    leaf.position.set(x, 0.4, z);
    leaf.rotation.set(-0.6 - (i % 3) * 0.15, (i * Math.PI) / 4, 0);
    root.add(leaf);
  }
  for (let i = 0; i < 3; i++)
    sphere(
      root,
      0.08,
      m.flower,
      x + Math.sin(i * 2) * 0.24,
      0.9 * size,
      z + Math.cos(i * 2) * 0.24,
    );
}
function planter(root: T.Group, x: number, z: number, w: number, d: number) {
  box(root, w, 0.42, d, m.stone, x, 0.21, z, 0.1);
  box(root, w - 0.15, 0.05, d - 0.15, mat("#3a3a29"), x, 0.44, z, 0.01);
  const length = Math.max(w, d);
  for (let i = 0; i < length; i += 0.8)
    plant(
      root,
      x + (w > d ? i - w / 2 + 0.4 : 0),
      z + (d >= w ? i - d / 2 + 0.4 : 0),
      0.75 + (i % 2) * 0.2,
    );
}
function roof(
  root: T.Group,
  x: number,
  z: number,
  w: number,
  d: number,
  y: number,
) {
  // Pitched clay canopy: a coherent life-simulation silhouette rather than stacked slabs.
  const slope=0.17, half=d/2, length=Math.hypot(half,slope*half);
  for(const side of [-1,1]){
    const panel=box(root,w,0.16,length,m.roof,x,y+slope*half/2,z+side*half/2,0.035);
    panel.rotation.x=side*Math.atan(slope);
    for(let i=0;i<w;i+=0.42){
      const ridge=box(root,0.11,0.07,length,m.red,x-w/2+i,y+slope*half/2+0.12,z+side*half/2,0.035);
      ridge.rotation.x=side*Math.atan(slope);
    }
  }
  box(root,w,0.22,0.22,m.cream,x,y-0.06,z+d/2,0.035);
  box(root,w,0.18,0.28,m.red,x,y+slope*half+0.1,z,0.06);
  for (const xx of [-w / 2 + 0.2, w / 2 - 0.2])
    for (const zz of [-d / 2 + 0.2, d / 2 - 0.2])
      box(root, 0.18, y, 0.18, m.steel, x + xx, y / 2, z + zz, 0.015);
}
/** Keep cutaway covers separate while batching stationary supports by material. */
function cutawayRoof(group:T.Group,height:number){
  const cover=new T.Group();
  for(const child of [...group.children]) if(child.position.y>height-0.1) cover.add(child);
  batch(group);batch(cover);group.add(cover);return cover;
}
function lantern(root: T.Group, x: number, y: number, z: number) {
  cylinder(root, 0.015, 0.6, m.black, x, y + 0.4, z);
  const shade = sphere(root, 0.25, m.gold, x, y, z, 1, 0.7, 1);
  sphere(root, 0.14, m.light, x, y - 0.1, z);
  return shade;
}
export function buildEnvironment(
  scene: T.Scene,
  mobile: boolean,
  assets?: WorldAssets,
): Environment {
  // A deliberately bounded, cutaway game world. No distant scenery or billboard backdrop.
  const gates: T.Group[] = [];
  const root = new T.Group(),
    palms: T.Group[] = [],
    clouds = new T.Group(),
    serviceObjects: {
      id: string;
      object: T.Object3D;
    }[] = [];
  scene.add(root);
  const fixed = new T.Group();
  root.add(fixed);
  const roofs: T.Object3D[] = [], bayTargets: T.Group[] = [], signals: T.MeshStandardMaterial[] = [];
  const paving = mat("#d0d3c6", 0.92, 0);
  const lawn = mat("#a4c58b", 1, 0);
  const curb = mat("#ece7d9", 0.9, 0);
  // Continuous courtyard grounded in its neighborhood, with a readable site boundary.
  box(fixed, 110, 0.3, 105, mat("#b7c9a6", 1, 0), 0, -0.35, 6, 0.05);
  box(fixed, 45.6, 0.25, 43.6, lawn, 0, -0.08, 6, 0.35);
  const floor = new T.Mesh(new T.PlaneGeometry(39, 34), paving);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0.045, 5);
  floor.receiveShadow = true;
  scene.add(floor);
  // A reflection is restricted to the wash apron instead of a mirror across the whole site.
  const reflector = new Reflector(new T.PlaneGeometry(30, 9), {
    clipBias: 0.004, textureWidth: mobile ? 256 : 512,
    textureHeight: mobile ? 256 : 512, color: 0x869a9a, multisample: 0,
  });
  reflector.rotation.x = -Math.PI / 2;
  reflector.position.set(0, 0.05, -6);
  reflector.visible = false; // Matte game-art pavement is intentional.
  scene.add(reflector);
  box(fixed, 40, 0.12, 5, mat("#63767b", 1, 0), 0, 0.015, 28, 0.25);
  for (let x = -18; x < 20; x += 5) box(fixed, 2.1, 0.012, 0.1, curb, x, 0.085, 28);
  // Continuous pedestrian route, distinct from the one-way vehicle lanes.
  box(fixed, 2.8, 0.11, 9, curb, 0, 0.06, 20, 0.15);
  box(fixed, 25, 0.1, 2.6, curb, 0, 0.055, 14, 0.2);
  for(let z=16; z<24; z+=0.8) box(fixed,2.7,0.015,0.035,mat("#c4c1b5"),0,0.12,z);
  for(const x of [-21,21]) box(fixed,0.35,0.55,35,curb,x,0.2,4,0.1);
  box(fixed,42,0.55,0.35,curb,0,0.2,-13,0.1);
  // Entrance portal: the visitor selects the door, then the camera crosses the threshold.
  const entrance = new T.Group(), doors: T.Group[] = [];
  entrance.position.set(0,0,23.5); root.add(entrance);
  for(const side of [-1,1]) {
    box(entrance,0.55,3.8,0.6,m.red,side*2.15,1.9,0,0.1);
    const door = new T.Group();door.position.set(side*1.87,0,0);
    box(door,1.87,1.05,0.1,m.steel,-side*0.935,0.65,0,0.07);
    for(let i=0;i<6;i++) box(door,0.055,1.3,0.08,m.cream,-side*(0.2+i*0.28),0.72,0,0.01);
    entrance.add(door);doors.push(door);
  }
  box(entrance,4.9,0.72,0.7,m.red,0,3.7,0,0.12);
  sign(entrance,"FEBLES CAR WASH",4.5,0.48,0,3.7,0.36,"#fff9ec","#c72d28",83);
  scene.add(clouds);
  // Landscape frames pedestrian entrance and lounge.
  for (const side of [-1, 1]) {
    box(fixed, 0.6, 0.55, 40, m.stone, side * 21, 0.26, 2, 0.07);
    for (let z = -10; z <= 20; z += 10) {
      palm(root, palms, side * 20, z, 6.5 + Math.cos(z) * 0.7, assets);
      plant(fixed, side * 19, z, 1.2);
    }
  }
  for (const [x, z] of [
    [-17, 7],
    [16.9, 6],
    [-8.5, 17],
    [14.9, 14],
  ] as const) {
    palm(root, palms, x, z, 5.4, assets);
    plant(fixed, x + 0.7, z, 0.9);
    plant(fixed, x - 0.8, z + 0.3, 1.15);
  }
  planter(fixed, -18, -14, 5, 2);
  planter(fixed, 18, -14, 5, 2);
  planter(fixed, -18, 17, 4, 1.6);
  planter(fixed, 18, 17, 4, 1.6);

  planter(fixed, 6.4, 10, 1, 4);

  planter(fixed, 16, 9, 1, 8);
  // Three queue spaces and two delivery spaces: real records own these parking slots.
  for(const [x,z]of [[-11,5.5],[-7.7,5.5],[-4.4,5.5],[12,5.5],[15.3,5.5]]){
    box(fixed,2.8,0.018,5.1,mat(x<0?"#aebeb6":"#b9cfb9",0.96),x,0.065,z,0.12);
    for(const dx of [-1.42,1.42])box(fixed,0.06,0.02,5.1,curb,x+dx,0.08,z,0.005);
  }
  sign(fixed,"ESPERA",5,0.42,-7.7,0.17,8.4,"#4b6558","#e6e8da",100).rotation.x=-Math.PI/2;
  sign(fixed,"ENTREGA",4.8,0.42,13.6,0.17,8.4,"#4b6558","#e6e8da",100).rotation.x=-Math.PI/2;
  // Five working wash bays. Roof, steel, hoses, carts, drain channels.
  box(fixed, 31.6, 3.8, 0.3, m.stone, 0, 1.9, -11, 0.03);
  box(fixed, 31.6, 0.65, 0.15, m.cream, 0, 0.36, -10.8, 0.01);
  for (let i = 0; i < 5; i++) {
    const x = (i - 2) * 6;
    const canopy = new T.Group();root.add(canopy);
    roof(canopy, x, -6.4, 6, 9.4, 3.8);
    roofs.push(cutawayRoof(canopy,3.8));
    for(const zz of [-10.9,-1.9]) box(fixed,5.9,0.16,0.16,m.red,x,3.72,zz,0.025);
    const target = new T.Group();target.position.set(x,0,-6);root.add(target);
    box(target,5.5,0.015,8.6,mat(i===3?"#c4d4c7":"#a3b9b3",0.85,0),0,0.065,0,0.08);
    bayTargets.push(target);
    // Low dividers keep vehicles visible from the visitor camera.
    if(i<4){box(fixed,0.13,1.05,6.7,m.cream,x+3,0.55,-7.1,0.045);box(fixed,0.17,0.1,6.8,m.woodLight,x+3,1.11,-7.1,0.04);}
    for(let wet=0;wet<3;wet++){
      const puddle=new T.Mesh(new T.CircleGeometry(0.5+wet*0.24,32),new T.MeshStandardMaterial({color:"#92b7b0",roughness:0.27,transparent:true,opacity:0.35,depthWrite:false}));
      puddle.rotation.x=-Math.PI/2;puddle.scale.y=0.45;puddle.position.set(x-0.9+wet*0.7,0.09,-3.2-wet*2);fixed.add(puddle);
    }
    const signal = new T.MeshStandardMaterial({color:i===3?"#86bfa3":"#edb76a",emissive:i===3?"#86bfa3":"#edb76a",emissiveIntensity:0.15});
    sphere(root,0.14,signal,x+1.7,3.43,-1.47);signals.push(signal);
    box(fixed, 5.9, 0.83, 0.3, m.steel, x, 3.45, -1.7, 0.03);
    sign(
      fixed,
      String(i + 1),
      1,
      0.65,
      x,
      3.45,
      -1.53,
      "#fff9eb",
      "#282c30",
      360,
    );
    box(fixed, 4.6, 0.05, 0.12, m.light, x, 3.25, -5.8, 0.01);
    for (const xx of [-2.7, 2.7]) {
      box(fixed, 0.1, 0.02, 8.5, m.gold, x + xx, 0.07, -6, 0.01);
      box(fixed, 0.12, 0.3, 0.12, m.gold, x + xx, 0.2, -1.2, 0.02);
    }
    box(fixed, 5.7, 0.03, 0.4, m.black, x, 0.07, -1.1, 0.01);
    for (let j = 0; j < 16; j++)
      box(
        fixed,
        0.045,
        0.035,
        0.4,
        m.steel,
        x - 2.7 + j * 0.35,
        0.09,
        -1.1,
        0.002,
      );
    box(fixed, 0.7, 1.15, 0.4, m.red, x + 2, 0.65, -9.8, 0.07);
    const hose = new T.Mesh(new T.TorusGeometry(0.45, 0.035, 8, 32), m.black);
    hose.position.set(x - 2.1, 2, -10.6);
    fixed.add(hose);
    tube(
      fixed,
      [
        v(x - 2.1, 1.8, -10.6),
        v(x - 1.5, 0.1, -8),
        v(x + 1, 0.11, -5),
        v(x + 1.8, 1, -4),
      ],
      0.025,
      m.black,
    );
    const cart = new T.Group();
    box(cart, 0.7, 0.65, 1, m.steel, 0, 0.55, 0, 0.03);
    box(cart, 0.78, 0.05, 1.1, m.woodLight, 0, 0.9, 0, 0.02);
    for (let j = 0; j < 3; j++) {
      cylinder(
        cart,
        0.075,
        0.26,
        j % 2 ? m.red : m.white,
        -0.22 + j * 0.22,
        1.06,
        0,
        0.06,
      );
      cylinder(cart, 0.025, 0.07, m.steel, -0.22 + j * 0.22, 1.23, 0);
    }
    cart.position.set(x + 2, 0.1, -2.7);
    fixed.add(cart);
  }
  // Main sign echoes the illustrated brand without baking the scene into an image.
  sign(fixed, "FEBLES · PONCE", 11, 0.65, 0, 4.35, -10.6, "#fff4e0", "#c72d28", 100);
  const reception = new T.Group();root.add(reception);
  // Open reception: staff and other bays remain visible through the structure.
  const receptionRoof = new T.Group();root.add(receptionRoof);
  roof(receptionRoof, 11.2, 10, 7, 6, 3.5);
  roofs.push(cutawayRoof(receptionRoof,3.5));
  box(reception,6.5,2.65,0.18,m.cream,11.2,1.4,7.15,0.08);
  box(reception,6.5,0.48,0.2,m.red,11.2,2.72,7.15,0.06);
  sign(reception,"¡ESTÁS EN TU CASA!",3.6,0.45,11.2,2.15,7.26,"#4b6058","#e5dfd1",85);
  box(reception, 6, 0.2, 5.7, m.cream, 11.2, 0.1, 10, 0.05);
  box(reception, 5.9, 0.8, 1.3, m.stone, 11.2, 0.5, 11.3, 0.09);
  for (let i = 0; i < 30; i++)
    box(reception, 0.085, 0.76, 0.05, m.woodLight, 8.4 + i * 0.19, 0.49, 12, 0.015);
  box(reception, 6.1, 0.12, 1.55, m.wood, 11.2, 0.94, 11.3, 0.06);
  box(reception, 5.8, 0.035, 0.035, m.light, 11.2, 0.85, 12.01, 0.008);
  sign(
    reception,
    "RECEPCIÓN",
    3.7,
    0.55,
    11.2,
    3.15,
    13.05,
    "#f8efe0",
    "#282c30",
    120,
  );
  brand(reception, 11.2, 0.58, 12.04, 1.05);
  box(reception, 0.75, 0.48, 0.055, m.steel, 12.5, 1.42, 11.1, 0.04);
  box(reception, 0.1, 0.25, 0.2, m.steel, 12.5, 1.2, 11.1, 0.03);
  lantern(reception, 9.1, 2.9, 10.8);
  lantern(reception, 13.4, 2.9, 10.8);
  planter(reception, 14, 11.25, 0.5, 0.5);
  // Lounge furniture with cushions, lamps, coffee and waiting visitors.
  const loungeRoof = new T.Group();root.add(loungeRoof);
  roof(loungeRoof, -12, 12, 8, 7, 3.5);
  roofs.push(cutawayRoof(loungeRoof,3.5));
  box(fixed,8,0.14,7,m.cream,-12,0.08,12,0.18);
  for(let i=0;i<12;i++) box(fixed,0.065,2.8,0.12,m.woodLight,-15.6+i*0.66,1.4,8.6,0.01);
  const lounge = new T.Group();
  root.add(lounge);
  if (assets)
    for (const x of [-14.2, -9.8]) {
      const sofa = assets.sofa();
      sofa.position.set(x, 0.08, 11.5);
      lounge.add(sofa);
    }
  cylinder(fixed, 1.1, 0.13, m.wood, -12, 0.75, 13.5);
  cylinder(fixed, 0.12, 0.6, m.steel, -12, 0.4, 13.5);
  cylinder(fixed, 0.12, 0.19, m.white, -12, 0.91, 13.5);
  lantern(fixed, -12, 2.8, 12);
  sign(
    fixed,
    "LAVA · RELÁJATE · DISFRUTA",
    6,
    0.55,
    -12,
    3.4,
    9,
    "#f3e3c4",
    "#282c30",
    68,
  );
  // Entrance and exit are separate lanes with signs and barrier arms.
  for (const x of [-16.5, 18]) {
    box(fixed, 0.45, 1.4, 0.45, m.steel, x, 0.7, 20, 0.07);
    const arm = new T.Group();
    arm.position.set(x, 1.25, 20);
    box(arm, 3.7, 0.12, 0.12, m.cream, -1.7, 0, 0, 0.02);
    for (let i = 0; i < 5; i++)
      box(arm, 0.27, 0.13, 0.13, m.red, -i * 0.7, 0, 0, 0.015);
    batch(arm);
    root.add(arm);
    gates.push(arm);
  }
  sign(fixed, "ENTRADA  →", 3, 0.8, -17.5, 2.3, 16, "#fff6e4", "#282c30", 110);
  sign(fixed, "SALIDA  →", 3, 0.8, 17.5, 2.3, 15, "#fff6e4", "#282c30", 110);
  for (let z = 0; z < 20; z += 2)
    box(fixed, 0.1, 0.02, 0.9, m.gold, -17, 0.06, z);
  for (let z = 0; z < 20; z += 2)
    box(fixed, 0.1, 0.02, 0.9, m.gold, 18, 0.06, z);
  // Physical detailing displays, each is a raycast target.
  const configs = [
    { x: 2, id: "complete", label: "LAVADO COMPLETO" },
    { x: 5.6, id: "lights", label: "FOCOS" },
    { x: 9.2, id: "interior", label: "INTERIORES" },
    { x: 2, id: "exterior", label: "LAVADO EXTERIOR" },
    { x: 5.6, id: "polish", label: "PULIDO Y BRILLO" },
    { x: 9.2, id: "engine", label: "MOTOR" },
  ];
  for (const cfg of configs) {
    const display = new T.Group();
    display.position.set(cfg.x, 0, 17);
    box(display, 2.8, 0.95, 2.1, m.wood, 0, 0.55, 0, 0.08);
    box(display, 2.9, 0.12, 2.2, m.woodLight, 0, 1.08, 0, 0.05);
    box(display, 2.5, 0.62, 0.06, m.steel, 0, 0.65, 1.06, 0.035);
    if (assets && (cfg.id === "lights" || cfg.id === "interior")) {
      const part = assets.servicePart(cfg.id);
      part.position.y = 1.14;
      display.add(part);
      if (cfg.id === "interior")
        tube(
          display,
          [v(0.65, 1.16, 0.7), v(1.1, 1.4, 0.4), v(0.8, 2, 0.1)],
          0.045,
          m.black,
        );
    } else if (cfg.id === "complete" || cfg.id === "exterior") {
      const vertices: number[] = [],
        indices: number[] = [];
      const cols = 22,
        rows = 18;
      for (let y = 0; y <= rows; y++)
        for (let x = 0; x <= cols; x++) {
          const u = x / cols,
            vv = y / rows;
          vertices.push(
            (u - 0.5) * 2.22,
            1.25 + Math.sin(u * Math.PI) * 0.18 + vv * 0.14,
            (vv - 0.5) * 1.6,
          );
          if (x < cols && y < rows) {
            const i = y * (cols + 1) + x;
            indices.push(
              i,
              i + cols + 1,
              i + 1,
              i + 1,
              i + cols + 1,
              i + cols + 2,
            );
          }
        }
      const geometry = new T.BufferGeometry();
      geometry.setAttribute(
        "position",
        new T.Float32BufferAttribute(vertices, 3),
      );
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      const hood = new T.Mesh(
        geometry,
        new T.MeshPhysicalMaterial({
          color: "#bdc5cd",
          metalness: 0.7,
          roughness: 0.22,
          clearcoat: 1,
          side: T.DoubleSide,
        }),
      );
      hood.castShadow = hood.receiveShadow = true;
      display.add(hood);
      box(display, 0.55, 0.14, 0.36, m.gold, 0.4, 1.57, 0.15, 0.025);
      for (let i = 0; i < 48; i++) {
        const u = (Math.sin(i * 3.131) + 1) / 2,
          vv = (Math.cos(i * 2.77) + 1) / 2;
        sphere(
          display,
          0.025 + (i % 3) * 0.005,
          m.white,
          (u - 0.5) * 2.12,
          1.28 + Math.sin(u * Math.PI) * 0.18 + vv * 0.14,
          (vv - 0.5) * 1.5,
        );
      }
    } else if (cfg.id === "engine") {
      box(display, 1.45, 0.6, 0.85, m.steel, 0, 1.48, 0, 0.035);
      box(display, 1.5, 0.12, 0.9, m.black, 0, 1.83, 0, 0.025);
      for (let i = 0; i < 4; i++) {
        const x = -0.48 + i * 0.32;
        tube(
          display,
          [v(x, 1.75, 0.42), v(x, 1.65, 0.75), v(x, 1.35, 0.75)],
          0.055,
          m.steel,
        );
        box(display, 0.04, 0.05, 0.8, m.steel, x, 1.92, 0, 0.01);
      }
      cylinder(display, 0.13, 0.12, m.gold, 0.5, 1.96, 0);
      tube(
        display,
        [v(-0.6, 1.7, -0.4), v(-0.9, 1.8, -0.3), v(-0.85, 1.2, 0.4)],
        0.06,
        m.black,
      );
    } else if (cfg.id === "polish") {
      cylinder(display, 0.4, 0.1, m.black, 0, 1.26, 0);
      cylinder(display, 0.38, 0.07, m.gold, 0, 1.18, 0);
      box(display, 0.5, 0.3, 0.9, m.red, 0, 1.48, 0, 0.08);
      tube(
        display,
        [
          v(-0.36, 1.5, 0),
          v(-0.46, 1.83, 0),
          v(0.46, 1.83, 0),
          v(0.36, 1.5, 0),
        ],
        0.045,
        m.steel,
      );
    } else {
      box(display, 1.1, 0.3, 1.15, m.black, 0, 1.42, 0, 0.08);
      box(display, 1.1, 1.1, 0.25, m.black, 0, 1.9, -0.45, 0.08);
      box(display, 0.55, 0.38, 0.23, m.black, 0, 2.57, -0.44, 0.08);
    }
    if (!(assets && (cfg.id === "lights" || cfg.id === "interior")))
      batch(display);
    display.visible = false;
    root.add(display);
    serviceObjects.push({ id: cfg.id, object: display });
  }
  batch(fixed);
  return {
    root,
    palms,
    clouds,
    reflector,
    floor,
    serviceObjects,
    gates,
    lounge, reception, entrance, doors, roofs, bayTargets, signals,
  };
}
