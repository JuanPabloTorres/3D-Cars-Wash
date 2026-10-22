import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
export const v = (x = 0, y = 0, z = 0) => new T.Vector3(x, y, z);
export const mat = (color: string, roughness = .6, metalness = .05) => new T.MeshStandardMaterial({ color, roughness, metalness });
export const materials = { red: mat('#c72d28', .3, .35), roof: mat('#c63128', .45, .3), steel: mat('#282c30', .4, .5), stone: mat('#797f7d', .85), cream: mat('#e5dfd1', .8), wood: mat('#996345', .5), woodLight: mat('#b47a4b', .5), gold: mat('#e3b34f', .3, .35), green: mat('#326e36'), leaf: mat('#5a8e37'), leafLight: mat('#83a740'), trunk: mat('#896342'), black: mat('#20242a'), white: mat('#f8f7e9'), glass: new T.MeshPhysicalMaterial({ color: '#48717d', roughness: .12, metalness: .3, clearcoat: 1 }), light: new T.MeshStandardMaterial({ color: '#fff0be', emissive: '#ffe5ae', emissiveIntensity: 2 }), flower: mat('#d5412d') };
export function box(parent: T.Object3D, w: number, h: number, d: number, material: T.Material, x = 0, y = 0, z = 0, r = .04) { const mesh = new T.Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 3, h / 3, d / 3)), material); mesh.position.set(x, y, z); mesh.castShadow = mesh.receiveShadow = true; parent.add(mesh); return mesh; }
export function sphere(parent: T.Object3D, r: number, material: T.Material, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) { const mesh = new T.Mesh(new T.SphereGeometry(r, 20, 14), material); mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz); mesh.castShadow = mesh.receiveShadow = true; parent.add(mesh); return mesh; }
export function cylinder(parent: T.Object3D, r: number, h: number, material: T.Material, x = 0, y = 0, z = 0, rt = r) { const mesh = new T.Mesh(new T.CylinderGeometry(rt, r, h, 20), material); mesh.position.set(x, y, z); mesh.castShadow = mesh.receiveShadow = true; parent.add(mesh); return mesh; }
export function tube(parent: T.Object3D, points: T.Vector3[], radius: number, material: T.Material) { const curve = new T.CatmullRomCurve3(points); const mesh = new T.Mesh(new T.TubeGeometry(curve, 20, radius, 6, false), material); parent.add(mesh); return mesh; }
export function sign(parent: T.Object3D, text: string, w: number, h: number, x: number, y: number, z: number, fg = '#fff5e4', bg = '#252a2b', font = 80) { const c = document.createElement('canvas'); c.width = 1024; c.height = Math.round(1024 * h / w); const ctx = c.getContext('2d')!; ctx.fillStyle = bg; ctx.fillRect(0, 0, c.width, c.height); ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `italic 800 ${font}px Arial`; ctx.fillText(text, 512, c.height / 2, 970); const tx = new T.CanvasTexture(c); tx.colorSpace = T.SRGBColorSpace; const mesh = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshStandardMaterial({ map: tx, roughness: .7 })); mesh.position.set(x, y, z); parent.add(mesh); return mesh; }
export function brand(parent: T.Object3D, x: number, y: number, z: number, w = 7) { box(parent, w, .98 * w, .2, materials.steel, x, y, z, .16); const car = new T.CatmullRomCurve3([v(-w * .37, 0, .15), v(-w * .17, w * .12, .15), v(w * .08, w * .13, .15), v(w * .35, -.02, .15)]); const line = new T.Mesh(new T.TubeGeometry(car, 26, .04, 6, false), materials.red); line.position.set(x, y + w * .27, z + .13); parent.add(line); sign(parent, 'FEBLES', w * .9, w * .22, x, y + w * .02, z + .14, '#f7f5ee', '#282c30', 195); sign(parent, 'C A R  W A S H', w * .9, w * .13, x, y - w * .19, z + .15, '#e73e32', '#282c30', 100); }
/** Bake immutable meshes by material. Animated roots are merged separately. */
export function batch(root: T.Group) { root.updateMatrixWorld(true); const inverse = root.matrixWorld.clone().invert(); const buckets = new Map<T.Material, T.BufferGeometry[]>(); const meshes: T.Mesh[] = []; root.traverse(o => { if (o instanceof T.Mesh && !Array.isArray(o.material)) {
    const geometry = o.geometry.clone().applyMatrix4(inverse.clone().multiply(o.matrixWorld));
    if (geometry.index) {
        const g = geometry.toNonIndexed();
        geometry.dispose();
        meshes.push(o);
        const list = buckets.get(o.material) ?? [];
        list.push(g);
        buckets.set(o.material, list);
    }
    else {
        meshes.push(o);
        const list = buckets.get(o.material) ?? [];
        list.push(geometry);
        buckets.set(o.material, list);
    }
} }); meshes.forEach(m => m.removeFromParent()); for (const [material, geometries] of buckets) {
    const geometry = mergeGeometries(geometries, false);
    geometries.forEach(g => g.dispose());
    if (!geometry)
        continue;
    const mesh = new T.Mesh(geometry, material);
    mesh.castShadow = mesh.receiveShadow = true;
    root.add(mesh);
} }
