import * as T from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { box, sphere, cylinder, tube, sign, brand, batch, mat, materials as m, v } from './primitives';
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
};
function groundTexture() { const c = document.createElement('canvas'); c.width = c.height = 512; const ctx = c.getContext('2d')!; ctx.fillStyle = '#939b9e'; ctx.fillRect(0, 0, 512, 512); let seed = 12345; for (let i = 0; i < 24000; i++) {
    seed = (seed * 16807) % 2147483647;
    const x = seed % 512;
    seed = (seed * 16807) % 2147483647;
    const y = seed % 512;
    ctx.fillStyle = i % 2 ? '#b8bfc118' : '#30383f17';
    ctx.fillRect(x, y, 2, 2);
} ctx.strokeStyle = '#5c687535'; ctx.lineWidth = 2; ctx.strokeRect(0, 0, 512, 512); const tx = new T.CanvasTexture(c); tx.wrapS = tx.wrapT = T.RepeatWrapping; tx.repeat.set(18, 17); tx.colorSpace = T.SRGBColorSpace; return tx; }
function leafGeometry(length: number, width: number) { const pos: number[] = [], uv: number[] = [], idx: number[] = []; const count = 12; for (let i = 0; i <= count; i++) {
    const t = i / count, w = Math.sin(Math.PI * t) * width;
    for (const side of [-1, 1]) {
        pos.push(side * w, -t * t * length * .42, t * length);
        uv.push((side + 1) / 2, t);
    }
    if (i < count) {
        const k = i * 2;
        idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
    }
} const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g; }
function palm(root: T.Group, canopies: T.Group[], x: number, z: number, height = 6) { const trunk = cylinder(root, .18, height, m.trunk, x, height / 2, z, .12); trunk.rotation.z = .04; for (let j = 0; j < 14; j++)
    cylinder(root, .19, .035, m.woodLight, x, height * j / 14, z, .18); const canopy = new T.Group(); canopy.position.set(x + .2, height, z); for (let i = 0; i < 10; i++) {
    const leaf = new T.Mesh(leafGeometry(2.7 + (i % 3) * .25, .27), i % 2 ? m.leaf : m.green);
    leaf.material.side = T.DoubleSide;
    leaf.rotation.y = i * Math.PI / 5;
    leaf.rotation.x = -.18;
    canopy.add(leaf);
} for (let i = 0; i < 3; i++)
    sphere(canopy, .16, m.trunk, Math.sin(i * 2) * .2, -.12, Math.cos(i * 2) * .2); batch(canopy); root.add(canopy); canopies.push(canopy); }
function plant(root: T.Group, x: number, z: number, size = 1) { for (let i = 0; i < 8; i++) {
    const leaf = new T.Mesh(leafGeometry(.8 * size, .16 * size), i % 2 ? m.leafLight : m.green);
    leaf.position.set(x, .4, z);
    leaf.rotation.set(-.6 - i % 3 * .15, i * Math.PI / 4, 0);
    root.add(leaf);
} for (let i = 0; i < 3; i++)
    sphere(root, .08, m.flower, x + Math.sin(i * 2) * .24, .9 * size, z + Math.cos(i * 2) * .24); }
function planter(root: T.Group, x: number, z: number, w: number, d: number) { box(root, w, .42, d, m.stone, x, .21, z, .1); box(root, w - .15, .05, d - .15, mat('#3a3a29'), x, .44, z, .01); const length = Math.max(w, d); for (let i = 0; i < length; i += .8)
    plant(root, x + (w > d ? i - w / 2 + .4 : 0), z + (d >= w ? i - d / 2 + .4 : 0), .75 + (i % 2) * .2); }
function roof(root: T.Group, x: number, z: number, w: number, d: number, y: number) { box(root, w, .14, d, m.roof, x, y, z, .015); for (let i = 0; i < w; i += .3)
    box(root, .05, .07, d, m.red, x - w / 2 + i, y + .1, z, .008); box(root, w, .35, .16, m.red, x, y - .1, z + d / 2, .02); for (const xx of [-w / 2 + .2, w / 2 - .2])
    for (const zz of [-d / 2 + .2, d / 2 - .2])
        box(root, .18, y, .18, m.steel, x + xx, y / 2, z + zz, .015); }
function lantern(root: T.Group, x: number, y: number, z: number) { cylinder(root, .015, .6, m.black, x, y + .4, z); const shade = sphere(root, .25, m.gold, x, y, z, 1, .7, 1); sphere(root, .14, m.light, x, y - .1, z); return shade; }
export function buildEnvironment(scene: T.Scene, mobile: boolean): Environment {
    const gates: T.Group[] = [];
    const root = new T.Group(), palms: T.Group[] = [], clouds = new T.Group(), serviceObjects: {
        id: string;
        object: T.Object3D;
    }[] = [];
    scene.add(root);
    const fixed = new T.Group();
    root.add(fixed);
    const floor = new T.Mesh(new T.PlaneGeometry(44, 44), new T.MeshStandardMaterial({ map: groundTexture(), roughness: .27, metalness: .15, transparent: true, opacity: .84 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, .035, 2);
    floor.receiveShadow = true;
    scene.add(floor);
    const reflector = new Reflector(new T.PlaneGeometry(44, 44), { clipBias: .004, textureWidth: mobile ? 384 : 768, textureHeight: mobile ? 384 : 768, color: 0x777e85, multisample: 0 });
    reflector.rotation.x = -Math.PI / 2;
    reflector.position.set(0, .02, 2);
    scene.add(reflector);
    box(fixed, 240, .3, 240, mat('#66854b'), 0, -.22, 0);
    box(fixed, 100, .1, 9, mat('#525e64'), 0, -.02, 29);
    for (let i = -10; i < 11; i++)
        box(fixed, 3, .01, .15, m.cream, i * 6, .05, 29);
    // Backdrop is geometry: rolling mountains, town buildings and twin towers.
    for (let i = 0; i < 8; i++)
        sphere(fixed, 16, mat(i % 2 ? '#53746c' : '#668274'), -85 + i * 23, 2, -66, 1.4, .65 + (i % 3) * .18, .65);
    for (let i = 0; i < 10; i++) {
        const x = -38 + i * 8;
        box(fixed, 6, 3 + (i % 3), 5, mat(['#d8c4a6', '#cda591', '#e4d8ba'][i % 3]), x, 1.5, -30, .1);
        box(fixed, 6.4, .35, 5.4, m.roof, x, 3.3 + i % 3, -30, .02);
        for (let j = 0; j < 3; j++)
            box(fixed, .65, .9, .04, m.glass, x - 1.6 + j * 1.6, 2, -27.47, .01);
    }
    box(fixed, 8, 5, 4, mat('#e1c69c'), 20, 4, -42, .1);
    for (const x of [17, 23]) {
        box(fixed, 1.5, 10, 1.5, m.cream, x, 6, -41, .1);
        sphere(fixed, .9, m.roof, x, 11.1, -41, 1, .85, 1);
        box(fixed, .12, 1, .12, m.gold, x, 12, -41, .01);
        for (let y = 5; y < 11; y += 2)
            box(fixed, .5, .9, .02, m.black, x, y, -40.23, .05);
    }
    const cloudmat = mat('#f4f6f4', 1);
    for (let i = 0; i < 8; i++) {
        const x = -65 + i * 22;
        for (let j = 0; j < 4; j++)
            sphere(clouds, 3 + j % 2, cloudmat, x + j * 2, 26 + (i % 3) * 2, -55 + (i % 2) * 14, 1.8, .6, 1);
    }
    batch(clouds);
    scene.add(clouds);
    // Landscape frames pedestrian entrance and lounge.
    for (const side of [-1, 1]) {
        box(fixed, .6, .55, 40, m.stone, side * 21, .26, 0, .07);
        for (let z = -16; z <= 19; z += 6) {
            palm(root, palms, side * 20, z, 6.5 + Math.cos(z) * .7);
            plant(fixed, side * 19, z, 1.2);
        }
    }
    planter(fixed, -18, -14, 5, 2);
    planter(fixed, 18, -14, 5, 2);
    planter(fixed, -18, 17, 4, 1.6);
    planter(fixed, 18, 17, 4, 1.6);
    planter(fixed, -6, 13, 1.2, 9);
    planter(fixed, 6.4, 14, 1, 7);
    planter(fixed, -12, 7.4, 9, 1);
    planter(fixed, 16, 9, 1, 8);
    // Five working wash bays. Roof, steel, hoses, carts, drain channels.
    box(fixed, 31.6, 4.6, .3, m.stone, 0, 2.3, -11, .03);
    box(fixed, 31.6, 1.3, .15, m.red, 0, .7, -10.8, .01);
    for (let i = 0; i < 5; i++) {
        const x = (i - 2) * 6;
        roof(fixed, x, -6.4, 6, 9.4, 5.3);
        box(fixed, 5.9, .83, .3, m.steel, x, 4.9, -1.7, .03);
        sign(fixed, String(i + 1), 1, .65, x, 4.9, -1.53, '#fff9eb', '#282c30', 360);
        box(fixed, 4.6, .05, .12, m.light, x, 4.65, -5.8, .01);
        for (const xx of [-2.7, 2.7]) {
            box(fixed, .1, .02, 8.5, m.gold, x + xx, .07, -6, .01);
            box(fixed, .12, .3, .12, m.gold, x + xx, .2, -1.2, .02);
        }
        box(fixed, 5.7, .03, .4, m.black, x, .07, -1.1, .01);
        for (let j = 0; j < 16; j++)
            box(fixed, .045, .035, .4, m.steel, x - 2.7 + j * .35, .09, -1.1, .002);
        box(fixed, .7, 1.15, .4, m.red, x + 2, .65, -9.8, .07);
        const hose = new T.Mesh(new T.TorusGeometry(.45, .035, 8, 32), m.black);
        hose.position.set(x - 2.1, 2, -10.6);
        fixed.add(hose);
        tube(fixed, [v(x - 2.1, 1.8, -10.6), v(x - 1.5, .1, -8), v(x + 1, .11, -5), v(x + 1.8, 1, -4)], .025, m.black);
        const cart = new T.Group();
        box(cart, .7, .65, 1, m.steel, 0, .55, 0, .03);
        box(cart, .78, .05, 1.1, m.woodLight, 0, .9, 0, .02);
        for (let j = 0; j < 3; j++) {
            cylinder(cart, .075, .26, j % 2 ? m.red : m.white, -.22 + j * .22, 1.06, 0, .06);
            cylinder(cart, .025, .07, m.steel, -.22 + j * .22, 1.23, 0);
        }
        cart.position.set(x + 2, .1, -2.7);
        fixed.add(cart);
    }
    // Main sign echoes the illustrated brand without baking the scene into an image.
    brand(fixed, -12, 7.1, -4.5, 5.8);
    // Open reception: staff and other bays remain visible through the structure.
    roof(fixed, 11.2, 10, 7, 6, 4.7);
    box(fixed, 6, .2, 5.7, m.cream, 11.2, .1, 10, .05);
    box(fixed, 5.9, 1.35, 1.3, m.stone, 11.2, .84, 11.3, .09);
    for (let i = 0; i < 30; i++)
        box(fixed, .085, 1.28, .05, m.woodLight, 8.4 + i * .19, .85, 12, .015);
    box(fixed, 6.1, .16, 1.55, m.wood, 11.2, 1.58, 11.3, .06);
    box(fixed, 5.8, .035, .035, m.light, 11.2, 1.43, 12.01, .008);
    sign(fixed, 'RECEPCIÓN', 3.7, .55, 11.2, 4.2, 13.05, '#f8efe0', '#282c30', 120);
    brand(fixed, 11.2, .88, 12.04, 1.45);
    box(fixed, .75, .48, .055, m.steel, 12.5, 1.9, 11.1, .04);
    box(fixed, .1, .25, .2, m.steel, 12.5, 1.67, 11.1, .03);
    lantern(fixed, 9.1, 3.9, 10.8);
    lantern(fixed, 13.4, 3.9, 10.8);
    planter(fixed, 14, 11.25, .5, .5);
    // Interactive countertop miniatures.
    const compass = cylinder(fixed, .23, .06, m.gold, 9.4, 1.8, 11.3);
    compass.rotation.x = Math.PI * .35;
    sign(fixed, 'EXPLORAR', 1.1, .19, 9.4, 1.73, 11.95, '#302c25', '#ba8757', 160);
    // Lounge furniture with cushions, lamps, coffee and waiting visitors.
    roof(fixed, -12, 12, 8, 7, 4.4);
    for (const x of [-14.2, -9.8]) {
        box(fixed, 2.7, .35, 1.3, m.wood, x, .55, 11.5, .08);
        box(fixed, 2.5, .28, 1.2, m.cream, x, .85, 11.5, .14);
        box(fixed, 2.7, .85, .25, m.wood, x, 1.1, 10.9, .06);
        box(fixed, 2.4, .66, .24, m.cream, x, 1.24, 11, .1);
        for (const side of [-1, 1])
            box(fixed, .18, .5, 1.3, m.wood, x + side * 1.3, .98, 11.5, .04);
        box(fixed, .55, .5, .18, m.red, x + .6, 1.15, 11.2, .11);
    }
    cylinder(fixed, 1.1, .13, m.wood, -12, .75, 13.5);
    cylinder(fixed, .12, .6, m.steel, -12, .4, 13.5);
    cylinder(fixed, .12, .19, m.white, -12, .91, 13.5);
    lantern(fixed, -12, 3.6, 12);
    sign(fixed, 'LAVA · RELÁJATE · DISFRUTA', 6, .55, -12, 3.4, 9, '#f3e3c4', '#282c30', 68);
    // Entrance and exit are separate lanes with signs and barrier arms.
    for (const x of [-16.5, 18]) {
        box(fixed, .45, 1.4, .45, m.steel, x, .7, 20, .07);
        const arm = new T.Group();
        arm.position.set(x, 1.25, 20);
        box(arm, 3.7, .12, .12, m.cream, -1.7, 0, 0, .02);
        for (let i = 0; i < 5; i++)
            box(arm, .27, .13, .13, m.red, -i * .7, 0, 0, .015);
        batch(arm);
        root.add(arm);
        gates.push(arm);
    }
    sign(fixed, 'ENTRADA  →', 3, .8, -17.5, 2.3, 16, '#fff6e4', '#282c30', 110);
    sign(fixed, 'SALIDA  →', 3, .8, 17.5, 2.3, 15, '#fff6e4', '#282c30', 110);
    for (let z = 0; z < 20; z += 2)
        box(fixed, .1, .02, .9, m.gold, -17, .06, z);
    for (let z = 0; z < 20; z += 2)
        box(fixed, .1, .02, .9, m.gold, 18, .06, z);
    // Physical detailing displays, each is a raycast target.
    const configs = [{ x: -3.6, id: 'complete', label: 'LAVADO COMPLETO' }, { x: 0, id: 'lights', label: 'FOCOS' }, { x: 3.6, id: 'interior', label: 'INTERIOR' }];
    for (const cfg of configs) {
        const display = new T.Group();
        display.position.set(cfg.x, 0, 5.3);
        box(display, 2.8, .95, 2.1, m.wood, 0, .55, 0, .08);
        box(display, 2.9, .12, 2.2, m.woodLight, 0, 1.08, 0, .05);
        box(display, 2.5, .62, .06, m.steel, 0, .65, 1.06, .035);
        sign(display, cfg.label, 2.3, .38, 0, .68, 1.1, '#fff5df', '#282c30', cfg.id === 'complete' ? 66 : 125);
        if (cfg.id === 'complete') {
            box(display, 2, .18, 1.5, mat('#aabcc5', .2, .5), 0, 1.38, 0, .17);
            box(display, .57, .2, .38, m.gold, .4, 1.6, .2, .05);
            for (let i = 0; i < 15; i++)
                sphere(display, .08, m.white, Math.sin(i * 3) * .7, 1.52 + (i % 2) * .04, Math.cos(i * 3) * .5);
        }
        else if (cfg.id === 'lights') {
            box(display, 1.7, .6, .65, m.steel, 0, 1.48, 0, .14);
            for (const x of [-.43, .43]) {
                const light = cylinder(display, .24, .06, m.light, x, 1.51, .35);
                light.rotation.x = Math.PI / 2;
            }
        }
        else {
            box(display, 1.1, .3, 1.15, m.black, 0, 1.42, 0, .12);
            box(display, 1.1, 1.1, .25, m.black, 0, 1.9, -.45, .15);
            box(display, .55, .38, .23, m.black, 0, 2.57, -.44, .1);
            tube(display, [v(.6, 1.25, .6), v(1, 1.6, .3), v(.5, 2.2, .1)], .055, m.steel);
        }
        batch(display);
        root.add(display);
        serviceObjects.push({ id: cfg.id, object: display });
    }
    batch(fixed);
    return { root, palms, clouds, reflector, floor, serviceObjects, gates };
}
