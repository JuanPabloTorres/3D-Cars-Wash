import fs from "node:fs";
import ts from "typescript";
import assert from "node:assert/strict";
import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
// Decode actual mesh buffers and skeletons. Texture pixels need browser visual QA.
globalThis.self = globalThis;
globalThis.createImageBitmap = async () => ({
  width: 512,
  height: 512,
  close() {},
});
globalThis.ProgressEvent = class {
  constructor(type, properties) {
    Object.assign(this, { type }, properties);
  }
};
const output = new URL("../.world-test/", import.meta.url);
fs.mkdirSync(output, { recursive: true });
for (const name of ["assets", "entities", "primitives"]) {
  const code = ts
    .transpileModule(
      fs.readFileSync(
        new URL("../lib/world/" + name + ".ts", import.meta.url),
        "utf8",
      ),
      {
        compilerOptions: {
          target: ts.ScriptTarget.ES2022,
          module: ts.ModuleKind.ES2022,
        },
      },
    )
    .outputText.replace(/(["'])\.\.\/appearance\1/g, '"./appearance.js"')
    .replaceAll("'./primitives'", "'./primitives.js'")
    .replaceAll('"./primitives"', '"./primitives.js"');
  fs.writeFileSync(new URL(name + ".js", output), code);
}
fs.writeFileSync(new URL("appearance.js", output), ts.transpileModule(fs.readFileSync(new URL("../lib/appearance.ts",import.meta.url),"utf8"),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText);
try {
  const { WorldAssets, MODEL_FILES } = await import(
    new URL("assets.js", output)
  );
  const { Person, Car } = await import(new URL("entities.js", output));
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder),
    models = new Map();
  let bytesTotal = 0,
    checks = 0;
  for (const name of MODEL_FILES) {
    const bytes = fs.readFileSync(
      new URL("../public/models/studio/" + name + ".glb", import.meta.url),
    );
    bytesTotal += bytes.length;
    const gltf = await loader.parseAsync(
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
      "",
    );
    models.set(name, gltf);
  }
  const assets = new WorldAssets(models);
  const size = (root) =>
    new T.Box3().setFromObject(root).getSize(new T.Vector3());
  function test(name, fn) {
    fn();
    checks++;
    console.log("PASS", name);
  }
  test("Los vehículos detallados conservan escala, orientación y cuatro ruedas móviles", () => {
    for (const kind of ["SUV", "Sedán"]) {
      const model = assets.vehicle(kind, new T.Color("#aaaabb")),
        s = size(model.root);
      assert.ok(s.z > 4.5 && s.z < 5.1);
      assert.ok(s.x > 2 && s.x < 2.5);
      assert.ok(s.y > 1.4 && s.y < 1.9);
      assert.equal(model.wheels.length, 4);
      for (const wheel of model.wheels) {
        assert.ok(wheel.children.length > 0);
        assert.ok(Math.abs(wheel.position.x) > 0.7);
        assert.ok(Math.abs(wheel.position.z) > 1.2);
      }
      let meshes = 0;
      model.root.traverse((o) => {
        if (o instanceof T.Mesh) meshes++;
      });
      assert.ok(
        meshes < 30,
        "material batching prevents hundreds of draw calls per vehicle",
      );
    }
  });
  test("Pickup, compacto y van usan carrocerías propias con medidas y ruedas correctas", () => {
    const sizes={};
    for(const kind of ["Sedán","SUV","Pickup","Compacto","Van"]){
      const model=assets.vehicle(kind,new T.Color("red"));sizes[kind]=size(model.root);
      assert.equal(model.wheels.length,4);
      assert.ok(model.wheels.every(w=>w.children.length>0));
    }
    assert.ok(sizes.Pickup.z>5.5 && sizes.Pickup.y<2.1);
    assert.ok(sizes.Compacto.z<4.4 && sizes.Compacto.y<1.7);
    assert.ok(sizes.Van.y>2.2 && sizes.Van.z>5.4);
    assert.throws(()=>assets.vehicle("Otro-desconocido",new T.Color()),/Categoría/);
  });
  test("Cambiar el personaje mantiene su posición, su ruta y el actor", () => {
    const actor=new Person(2,18,false,"#ccccbb",assets);
    actor.goTo([new T.Vector3(2,0.08,14),new T.Vector3(8,0.08,14)]);
    actor.update(1,0.1);
    const group=actor.group,position=group.position.clone(),target=actor.target.clone(),route=actor.waypoints.map(v=>v.clone());
    actor.setAppearance(true);
    assert.equal(actor.group,group);assert.deepEqual(group.position,position);assert.deepEqual(actor.target,target);assert.deepEqual(actor.waypoints,route);
    assert.ok(Math.abs(size(group).y-1.73)<0.02);
    actor.setAppearance(false);assert.ok(Math.abs(size(group).y-1.82)<0.02);
    actor.dispose();
  });
  test("La pintura es independiente y la geometría se comparte entre vehículos", () => {
    const a = assets.vehicle("SUV", new T.Color("red")),
      b = assets.vehicle("SUV", new T.Color("blue"));
    assert.notEqual(a.paint, b.paint);
    a.paint.color.set("green");
    assert.equal(b.paint.color.getHexString(), "0000ff");
    const ga = [],
      gb = [];
    a.root.traverse((o) => {
      if (o instanceof T.Mesh) ga.push(o.geometry);
    });
    b.root.traverse((o) => {
      if (o instanceof T.Mesh) gb.push(o.geometry);
    });
    assert.deepEqual(ga, gb);
  });
  test("Los humanos tienen escala natural y esqueletos independientes", () => {
    const a = assets.person(true, "#333333"),
      b = assets.person(true, "#333333");
    assert.ok(Math.abs(size(a.root).y - 1.73) < 0.01);
    assert.notEqual(
      a.rig.getObjectByName("hand_r"),
      b.rig.getObjectByName("hand_r"),
    );
    assert.ok(
      models.get("female").animations.some((c) => c.name === "Idle_Standing"),
    );
    assert.ok(
      models.get("male").animations.some((c) => c.name === "Idle_Standing"),
    );
  });
  test("La animación del operario no acumula rotaciones ni pierde la escala", () => {
    const actor = new Person(0, 0, false, "#333333", assets);
    actor.mode = "work";
    for (let i = 0; i < 3600; i++) actor.update(i / 60, 1 / 60);
    assert.ok(size(actor.group).y > 1.5 && size(actor.group).y < 2.1);
    actor.group.traverse((o) => {
      assert.ok(o.quaternion.toArray().every(Number.isFinite));
      assert.ok(Math.abs(o.quaternion.length() - 1) < 0.001);
    });
    actor.dispose();
  });
  test("El modelo detallado conserva rutas y cambia de categoría sin perder el color", () => {
    const car = new Car(0, 3, "#b23322", "SUV", assets);
    car.route = [new T.Vector3(0, 0.1, -6)];
    for (let i = 0; i < 400; i++) car.update(1 / 60);
    assert.equal(car.route.length, 0);
    assert.ok(car.wheels.some((w) => Math.abs(w.rotation.x) > 1));
    car.setKind("Sedán");
    assert.equal(car.paint.color.getHexString(), "b23322");
    assert.ok(size(car.group).y < 1.7);
  });
  test("Mobiliario y vegetación usan modelos completos dentro del presupuesto de descarga", () => {
    assert.ok(size(assets.sofa()).x > 2.8);
    assert.ok(Math.abs(size(assets.palm(7)).y - 7) < 0.01);
    assert.ok(bytesTotal < 11_500_000);
    console.log("Modelos GLB:", (bytesTotal / 1e6).toFixed(2) + " MB");
  });
  test("Los servicios usan el asiento y el foco extraídos del SUV detallado", () => {
    const seat = assets.servicePart("interior"),
      light = assets.servicePart("lights");
    assert.ok(seat.children[0].children.length >= 3);
    assert.ok(light.children[0].children.length >= 3);
    assert.ok(Math.abs(size(seat).y - 1.32) < 0.01);
    assert.ok(Math.abs(size(light).y - 0.65) < 0.01);
  });
  assets.dispose();
  console.log(checks + " pruebas de modelos reales verificadas.");
} finally {
  fs.rmSync(output, { recursive: true, force: true });
}
