import * as T from 'three';
import { box, sphere, cylinder, tube, mat, materials as m, batch, v, sign } from './primitives';
export class Person {
    group = new T.Group();
    head = new T.Group();
    leftArm = new T.Group();
    rightArm = new T.Group();
    legs: T.Group[] = [];
    target = new T.Vector3();
    mode: 'idle' | 'wave' | 'work' | 'seated' = 'idle';
    constructor(x: number, z: number, female = false, shirt = '#26282b', skin = '#bd8059') {
        this.group.position.set(x, .08, z);
        this.target.copy(this.group.position);
        const skinMat = mat(skin, .65), cloth = mat(shirt), hair = mat('#35241d');
        const body = new T.Group();
        this.group.add(body);
        box(body, .66, .85, .38, cloth, 0, 1.34, 0, .14);
        const collar = box(body, .48, .12, .43, m.red, 0, 1.73, 0, .04);
        collar.rotation.z = .02;
        sign(body, 'FEBLES', .27, .1, .15, 1.5, .202, '#faf5e9', shirt, 220);
        cylinder(body, .12, .2, skinMat, 0, 1.87, 0);
        this.head.position.set(0, 2.16, 0);
        body.add(this.head);
        sphere(this.head, .34, skinMat, 0, 0, 0, 1, 1.14, .94);
        sphere(this.head, .32, hair, 0, .14, -.08, 1.05, .8, 1);
        sphere(this.head, .08, skinMat, 0, -.04, .31, .6, .8, .7);
        for (const side of [-1, 1]) {
            sphere(this.head, .08, m.white, side * .13, .03, .285, 1, 1.15, .5);
            sphere(this.head, .043, m.black, side * .13, .025, .32, .8, 1, .4);
            sphere(this.head, .012, m.white, side * .12, .04, .338);
            box(this.head, .13, .032, .035, hair, side * .13, .15, .295, .01);
            sphere(this.head, .08, skinMat, side * .32, -.02, 0, .7, 1, .6);
        }
        const smile = tube(this.head, [v(-.09, -.14, .29), v(0, -.17, .31), v(.09, -.14, .29)], .012, mat('#733d31'));
        smile.name = 'smile';
        if (female) {
            for (let i = 0; i < 20; i++) {
                const angle = i * 2.399;
                sphere(this.head, .1 + (i % 3) * .025, hair, Math.sin(angle) * .31, .18 + Math.cos(angle * .7) * .2, -.1 + Math.cos(angle) * .16);
            }
            sphere(this.head, .23, hair, .1, .31, -.31);
        }
        else {
            for (let i = 0; i < 8; i++)
                sphere(this.head, .12, hair, -.24 + i * .065, .25 + Math.sin(i) * .035, -.02 + (i % 2) * .1);
        }
        // Merge torso and face while keeping limbs independently animated.
        batch(body);
        for (const side of [-1, 1]) {
            const arm = side === -1 ? this.leftArm : this.rightArm;
            arm.position.set(side * .43, 1.67, 0);
            this.group.add(arm);
            cylinder(arm, .115, .4, cloth, 0, -.14, 0);
            sphere(arm, .115, skinMat, 0, -.37, 0);
            cylinder(arm, .09, .32, skinMat, 0, -.51, .045);
            sphere(arm, .105, skinMat, 0, -.7, .06, .9, 1.1, 1);
            batch(arm);
            const leg = new T.Group();
            leg.position.set(side * .17, .99, 0);
            this.group.add(leg);
            cylinder(leg, .14, .78, mat('#333d43'), 0, -.33, 0);
            box(leg, .27, .16, .45, m.black, 0, -.82, .09, .07);
            batch(leg);
            this.legs.push(leg);
        }
        if (!female) {
            box(this.group, .65, .06, .4, m.red, 0, .99, 0, .02);
        }
    }
    update(t: number, dt: number) {
        const delta = this.target.clone().sub(this.group.position);
        delta.y = 0;
        const walking = delta.length() > .06;
        if (walking) {
            const distance = delta.length();
            const step = delta.normalize().multiplyScalar(Math.min(dt * 2.3, distance));
            this.group.position.add(step);
            this.group.rotation.y = Math.atan2(step.x, step.z);
        }
        const swing = walking ? Math.sin(t * 7) * .42 : 0;
        this.legs.forEach((l, i) => l.rotation.x = i ? swing : -swing);
        this.leftArm.rotation.x = walking ? swing : Math.sin(t * 2) * .035;
        this.rightArm.rotation.x = walking ? -swing : Math.sin(t * 2 + .5) * .04;
        if (this.mode === 'wave' && !walking) {
            this.rightArm.rotation.z = -2.1 + Math.sin(t * 3) * .14;
            this.rightArm.rotation.x = .2;
        }
        else if (this.mode === 'work' && !walking) {
            this.rightArm.rotation.z = -.5;
            this.rightArm.rotation.x = -.8 + Math.sin(t * 2) * .2;
            this.leftArm.rotation.x = -.65 + Math.sin(t * 2 + .4) * .12;
        }
        else
            this.rightArm.rotation.z = 0;
        this.group.position.y = .08 + (walking ? Math.abs(Math.sin(t * 7)) * .035 : Math.sin(t * 1.5) * .008);
    }
}
export class Car {
    group = new T.Group();
    body = new T.Group();
    wheels: T.Group[] = [];
    paint: T.MeshPhysicalMaterial;
    kind = 'SUV';
    target: T.Vector3 | null = null;
    route: T.Vector3[] = [];
    routeIndex = 0;
    speed = 3;
    bay?: number;
    lastPosition = new T.Vector3();
    door = new T.Group();
    doorAngle = 0;
    doorOpen = false;
    constructor(x: number, z: number, color = '#bac2ca', kind = 'SUV') { this.paint = new T.MeshPhysicalMaterial({ color, roughness: .22, metalness: .55, clearcoat: 1, clearcoatRoughness: .1 }); this.group.position.set(x, .1, z); this.kind = kind; this.build(); }
    build() {
        this.group.traverse(o => { if (o instanceof T.Mesh)
            o.geometry.dispose(); });
        this.group.clear();
        this.body = new T.Group();
        this.group.add(this.body);
        this.wheels = [];
        const suv = this.kind === 'SUV' || this.kind === 'Pickup', roof = suv ? 1.67 : 1.4;
        box(this.body, 2.13, .7, 4.3, this.paint, 0, .73, 0, .25);
        box(this.body, 1.98, .44, 1.1, this.paint, 0, .98, 1.35, .16);
        box(this.body, 1.8, .83, 2.46, this.paint, 0, roof, -.25, .23);
        const wind = box(this.body, 1.65, .69, .08, m.glass, 0, roof + .02, 1.02, .06);
        wind.rotation.x = -.23;
        const rear = box(this.body, 1.65, .59, .08, m.glass, 0, roof + .02, -1.52, .05);
        rear.rotation.x = .16;
        for (const side of [-1, 1]) {
            box(this.body, .045, .57, 2.05, m.glass, side * .91, roof + .05, -.25, .08);
            box(this.body, .06, .67, .1, m.steel, side * .94, roof, -.3, .01);
            box(this.body, .045, .035, 2.6, m.steel, side * 1.04, .62, -.1, .01);
            for (const zz of [-.7, .6])
                box(this.body, .075, .045, .22, m.steel, side * 1.055, 1.06, zz, .02);
            box(this.body, .22, .14, .35, this.paint, side * 1.1, 1.35, .85, .07);
            box(this.body, .46, .2, .08, m.light, side * .75, .94, 2.1, .06);
            box(this.body, .38, .19, .07, m.red, side * .77, .94, -2.15, .04);
            if (suv)
                box(this.body, .07, .06, 2.3, m.steel, side * .7, roof + .45, -.25, .025);
        }
        box(this.body, 1.25, .32, .1, m.black, 0, .67, 2.13, .06);
        for (let i = 0; i < 7; i++)
            box(this.body, .025, .22, .02, m.steel, -.5 + i / 6, .69, 2.19, .005);
        box(this.body, 1.65, .1, .15, m.steel, 0, .44, 2.04, .04);
        sign(this.body, 'FEBLES', .5, .16, 0, .5, 2.13, '#252729', '#f1ede2', 180);
        if (this.kind === 'Pickup')
            box(this.body, 1.65, .15, 1.2, m.black, 0, 1.22, -1.18, .04);
        batch(this.body);
        this.door = new T.Group();
        this.door.position.set(1.07, 0, .9);
        box(this.door, .09, .6, 1.1, this.paint, 0, .95, -.52, .045);
        box(this.door, .055, .55, 1, m.glass, 0, roof + .04, -.5, .045);
        this.group.add(this.door);
        for (const side of [-1, 1])
            for (const zz of [-1.35, 1.3]) {
                const wheel = new T.Group();
                wheel.position.set(side * 1.04, .47, zz);
                const tire = cylinder(wheel, .42, .24, m.black);
                tire.rotation.z = Math.PI / 2;
                const rim = cylinder(wheel, .27, .25, m.steel);
                rim.rotation.z = Math.PI / 2;
                for (let i = 0; i < 5; i++) {
                    const spoke = box(wheel, .26, .045, .32, m.cream, 0, 0, 0, .01);
                    spoke.rotation.x = i * Math.PI / 5;
                    spoke.position.x = side * .02;
                }
                batch(wheel);
                this.group.add(wheel);
                this.wheels.push(wheel);
            }
    }
    setDoorOpen(open: boolean) { this.doorOpen = open; }
    setKind(kind: string) { if (this.kind !== kind) {
        this.kind = kind;
        this.build();
    } }
    update(dt: number) { this.doorAngle += (Number(this.doorOpen) * -1.1 - this.doorAngle) * Math.min(1, dt * 3); this.door.rotation.y = this.doorAngle; const target = this.route[this.routeIndex] ?? this.target; if (!target)
        return; const delta = target.clone().sub(this.group.position); delta.y = 0; const distance = delta.length(); if (distance < .12) {
        if (this.route.length) {
            this.routeIndex++;
            if (this.routeIndex >= this.route.length) {
                this.route = [];
                this.routeIndex = 0;
                this.target = null;
            }
        }
        return;
    } const movement = Math.min(dt * this.speed, distance); this.group.position.add(delta.normalize().multiplyScalar(movement)); const desired = new T.Quaternion().setFromAxisAngle(v(0, 1, 0), Math.atan2(delta.x, delta.z)); this.group.quaternion.slerp(desired, Math.min(dt * 5, 1)); this.wheels.forEach(w => w.rotation.x += movement / .42); }
}
export class WaterEffect {
    group = new T.Group();
    points: T.Points;
    foam: T.InstancedMesh;
    active = true;
    offset: number;
    constructor(x: number, z: number, offset = 0) { this.offset = offset; this.group.position.set(x, 0, z); const pos = new Float32Array(210 * 3); const geometry = new T.BufferGeometry(); geometry.setAttribute('position', new T.BufferAttribute(pos, 3)); this.points = new T.Points(geometry, new T.PointsMaterial({ color: '#e5faff', size: .065, transparent: true, opacity: .75, depthWrite: false })); this.group.add(this.points); this.foam = new T.InstancedMesh(new T.SphereGeometry(.12, 8, 6), new T.MeshStandardMaterial({ color: '#fcffff', roughness: .45, transparent: true, opacity: .9 }), 65); this.group.add(this.foam); const dummy = new T.Object3D(); for (let i = 0; i < 65; i++) {
        dummy.position.set(Math.sin(i * 3.1) * .85, 1.08 + (i % 5) * .17, Math.cos(i * 2.2) * 1.7);
        dummy.scale.setScalar(.65 + (i % 4) * .2);
        dummy.updateMatrix();
        this.foam.setMatrixAt(i, dummy.matrix);
    } }
    update(t: number) { this.group.visible = this.active; if (!this.active)
        return; const p = this.points.geometry.attributes.position; for (let i = 0; i < p.count; i++) {
        const f = (t * 1.5 + i * .017 + this.offset) % 1;
        const a = i * 2.399;
        p.setXYZ(i, 1.7 - f * 1.9, 2.1 - f * 1.3 + Math.sin(a) * .3, Math.cos(a) * .5 + Math.sin(t + i) * .25);
    } p.needsUpdate = true; this.foam.scale.y = .96 + Math.sin(t * 2 + this.offset) * .025; }
}
