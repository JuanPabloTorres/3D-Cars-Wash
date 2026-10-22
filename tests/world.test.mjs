import fs from "node:fs";
import ts from "typescript";
import assert from "node:assert/strict";
import { installDocument } from "./dom-fixture.mjs";
// Geometry construction uses Canvas only for signs; no renderer or browser needed.
installDocument();
const output = new URL("../.world-test/", import.meta.url);
fs.mkdirSync(output, { recursive: true });
for (const name of ["primitives", "entities", "environment", "material-kit"]) {
  const file = new URL("../lib/world/" + name + ".ts", import.meta.url);
  let code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
    },
  }).outputText;
  code = code
    .replaceAll("'./primitives'", "'./primitives.js'")
    .replaceAll('"./primitives"', '"./primitives.js"');
  code = code
    .replaceAll('"./material-kit"', '"./material-kit.js"')
    .replaceAll("'./material-kit'", "'./material-kit.js'");
  fs.writeFileSync(new URL(name + ".js", output), code);
}
try {
  const T = await import("three");
  const { Car, Person, WaterEffect } = await import(
    new URL("entities.js", output)
  );
  const { buildEnvironment } = await import(new URL("environment.js", output));
  let checks = 0;
  function test(name, fn) {
    fn();
    checks++;
    console.log("PASS", name);
  }
  test("Carro recorre entrada, cubículo y salida sin teletransporte", () => {
    const car = new Car(-17, 25);
    car.route = [
      new T.Vector3(-17, 0.1, 2),
      new T.Vector3(6, 0.1, 2),
      new T.Vector3(6, 0.1, -6),
    ];
    let prev = car.group.position.clone();
    for (let i = 0; i < 1800; i++) {
      car.update(1 / 60);
      assert.ok(car.group.position.distanceTo(prev) <= car.speed / 60 + 0.001);
      prev.copy(car.group.position);
    }
    assert.equal(car.route.length, 0);
    assert.ok(car.group.position.distanceTo(new T.Vector3(6, 0.1, -6)) < 0.13);
  });
  test("Avatar camina hasta recepción sin oscilación final", () => {
    const actor = new Person(0, 18);
    actor.target.set(8, 0.08, 13.3);
    for (let i = 0; i < 600; i++) actor.update(i / 60, 1 / 60);
    assert.ok(
      actor.group.position.clone().setY(0.08).distanceTo(actor.target) < 0.07,
    );
  });
  test("La marcha automática respeta los puntos de paso antes de llegar al mostrador", () => {
    const actor = new Person(0, 18);
    const checkpoints = [
      new T.Vector3(0, 0.08, 20),
      new T.Vector3(8, 0.08, 20),
      new T.Vector3(8, 0.08, 13.3),
    ];
    actor.goTo(checkpoints);
    let visited = 0;
    for (let i = 0; i < 1200; i++) {
      actor.update(i / 60, 1 / 60);
      const pos = actor.group.position.clone().setY(0.08);
      if (
        visited < checkpoints.length &&
        pos.distanceTo(checkpoints[visited]) < 0.08
      )
        visited++;
    }
    assert.equal(visited, 3);
    assert.equal(actor.waypoints.length, 0);
  });
  test("Las partículas de agua cambian durante la simulación", () => {
    const water = new WaterEffect(0, 0);
    water.update(0);
    const before = water.points.geometry.attributes.position.array.slice();
    water.update(0.2);
    assert.notDeepEqual(
      water.points.geometry.attributes.position.array,
      before,
    );
  });
  test("Cambiar tipo y color afecta el vehículo del cliente", () => {
    const car = new Car(0, 0);
    car.setKind("Sedán");
    assert.equal(car.kind, "Sedán");
    car.paint.color.set("#aa2222");
    assert.equal(car.paint.color.getHexString(), "aa2222");
    assert.equal(car.wheels.length, 4);
  });
  test("El local completo tiene geometría finita y objetos seleccionables", () => {
    const scene = new T.Scene();
    const env = buildEnvironment(scene, true);
    assert.equal(env.serviceObjects.length, 6);
    assert.ok(env.palms.length >= 10);
    let count = 0;
    scene.traverse((o) => {
      if (o instanceof T.Mesh) {
        count++;
        const p = o.geometry.getAttribute("position");
        for (let i = 0; i < p.array.length; i++)
          assert.ok(Number.isFinite(p.array[i]));
      }
    });
    assert.ok(count > 50);
    console.log("Meshes del entorno:", count);
    env.reflector.getRenderTarget().dispose();
  });
  console.log(checks + " pruebas de mundo 3D verificadas.");
} finally {
  fs.rmSync(output, { recursive: true, force: true });
}
