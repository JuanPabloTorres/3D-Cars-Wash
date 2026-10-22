import * as T from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
export const v = (x = 0, y = 0, z = 0) => new T.Vector3(x, y, z);
export const mat = (color: string, roughness = 0.6, metalness = 0.05) =>
  new T.MeshStandardMaterial({ color, roughness, metalness });
export const materials = {
  red: mat("#bf6150", 0.65, 0.05),
  roof: mat("#c86c53", 0.72, 0.05),
  steel: mat("#40514f", 0.68, 0.1),
  stone: mat("#b6bfb0", 0.9),
  cream: mat("#f1ead5", 0.8),
  wood: mat("#a97852", 0.8),
  woodLight: mat("#c49a70", 0.8),
  gold: mat("#e3b34f", 0.3, 0.35),
  green: mat("#416f50"),
  leaf: mat("#6c945c"),
  leafLight: mat("#99b578"),
  trunk: mat("#896342"),
  black: mat("#20242a"),
  white: mat("#f8f7e9"),
  glass: new T.MeshPhysicalMaterial({
    color: "#48717d",
    roughness: 0.12,
    metalness: 0.3,
    clearcoat: 1,
  }),
  light: new T.MeshStandardMaterial({
    color: "#fff0be",
    emissive: "#ffe5ae",
    emissiveIntensity: 2,
  }),
  flower: mat("#d5412d"),
};
export function box(
  parent: T.Object3D,
  w: number,
  h: number,
  d: number,
  material: T.Material,
  x = 0,
  y = 0,
  z = 0,
  r = 0.04,
) {
  const mesh = new T.Mesh(
    new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 3, h / 3, d / 3)),
    material,
  );
  if (material.userData.worldScale) {
    const position = mesh.geometry.getAttribute("position"),
      normal = mesh.geometry.getAttribute("normal"),
      uv = mesh.geometry.getAttribute("uv");
    for (let i = 0; i < position.count; i++) {
      const nx = Math.abs(normal.getX(i)),
        ny = Math.abs(normal.getY(i)),
        nz = Math.abs(normal.getZ(i));
      const u = nx > ny && nx > nz ? position.getZ(i) : position.getX(i);
      const vv = ny > nx && ny > nz ? position.getZ(i) : position.getY(i);
      uv.setXY(
        i,
        u * material.userData.worldScale,
        vv * material.userData.worldScale,
      );
    }
  }
  mesh.position.set(x, y, z);
  mesh.castShadow = mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
export function sphere(
  parent: T.Object3D,
  r: number,
  material: T.Material,
  x = 0,
  y = 0,
  z = 0,
  sx = 1,
  sy = 1,
  sz = 1,
) {
  const mesh = new T.Mesh(new T.SphereGeometry(r, 20, 14), material);
  mesh.position.set(x, y, z);
  mesh.scale.set(sx, sy, sz);
  mesh.castShadow = mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
export function cylinder(
  parent: T.Object3D,
  r: number,
  h: number,
  material: T.Material,
  x = 0,
  y = 0,
  z = 0,
  rt = r,
) {
  const mesh = new T.Mesh(new T.CylinderGeometry(rt, r, h, 20), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
export function tube(
  parent: T.Object3D,
  points: T.Vector3[],
  radius: number,
  material: T.Material,
) {
  const curve = new T.CatmullRomCurve3(points);
  const mesh = new T.Mesh(
    new T.TubeGeometry(curve, 20, radius, 6, false),
    material,
  );
  parent.add(mesh);
  return mesh;
}
export function sign(
  parent: T.Object3D,
  text: string,
  w: number,
  h: number,
  x: number,
  y: number,
  z: number,
  fg = "#fff5e4",
  bg = "#252a2b",
  font = 80,
) {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = Math.round((1024 * h) / w);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = fg;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `italic 800 ${font}px Arial`;
  ctx.fillText(text, 512, c.height / 2, 970);
  const tx = new T.CanvasTexture(c);
  tx.colorSpace = T.SRGBColorSpace;
  const mesh = new T.Mesh(
    new T.PlaneGeometry(w, h),
    new T.MeshStandardMaterial({ map: tx, roughness: 0.7 }),
  );
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}
export function brand(
  parent: T.Object3D,
  x: number,
  y: number,
  z: number,
  w = 7,
) {
  box(parent, w, 0.54 * w, 0.2, materials.steel, x, y, z, 0.16);
  const car = new T.CatmullRomCurve3([
    v(-w * 0.37, 0, 0.15),
    v(-w * 0.17, w * 0.12, 0.15),
    v(w * 0.08, w * 0.13, 0.15),
    v(w * 0.35, -0.02, 0.15),
  ]);
  const line = new T.Mesh(
    new T.TubeGeometry(car, 26, 0.04, 6, false),
    materials.red,
  );
  line.position.set(x, y + w * 0.18, z + 0.13);
  parent.add(line);
  sign(
    parent,
    "FEBLES",
    w * 0.9,
    w * 0.22,
    x,
    y + w * 0.02,
    z + 0.14,
    "#f7f5ee",
    "#282c30",
    195,
  );
  sign(
    parent,
    "C A R  W A S H",
    w * 0.9,
    w * 0.13,
    x,
    y - w * 0.16,
    z + 0.15,
    "#e73e32",
    "#282c30",
    100,
  );
}
/** Bake immutable meshes by material. Animated roots are merged separately. */
export function batch(root: T.Group) {
  root.updateMatrixWorld(true);
  const inverse = root.matrixWorld.clone().invert();
  const buckets = new Map<T.Material, T.BufferGeometry[]>();
  const meshes: T.Mesh[] = [];
  root.traverse((o) => {
    if (o instanceof T.Mesh && !Array.isArray(o.material)) {
      const geometry = o.geometry
        .clone()
        .applyMatrix4(inverse.clone().multiply(o.matrixWorld));
      if (geometry.index) {
        const g = geometry.toNonIndexed();
        geometry.dispose();
        meshes.push(o);
        const list = buckets.get(o.material) ?? [];
        list.push(g);
        buckets.set(o.material, list);
      } else {
        meshes.push(o);
        const list = buckets.get(o.material) ?? [];
        list.push(geometry);
        buckets.set(o.material, list);
      }
    }
  });
  meshes.forEach((m) => m.removeFromParent());
  for (const [material, geometries] of buckets) {
    const geometry = mergeGeometries(geometries, false);
    geometries.forEach((g) => g.dispose());
    if (!geometry) continue;
    const mesh = new T.Mesh(geometry, material);
    mesh.castShadow = mesh.receiveShadow = true;
    root.add(mesh);
  }
}
