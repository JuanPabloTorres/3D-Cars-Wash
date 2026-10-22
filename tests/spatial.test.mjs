import fs from "node:fs";
import assert from "node:assert/strict";
import ts from "typescript";
import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { installDocument, Element } from "./dom-fixture.mjs";
installDocument();
const dir = new URL("../.spatial-test/", import.meta.url);
fs.mkdirSync(dir, { recursive: true });
for (const [source, destination] of [
  ["lib/world/primitives.ts", "primitives"],
  ["lib/world/interactions.ts", "interactions"],
  ["lib/world/spatial-interface.ts", "spatial-interface"],
  ["lib/domain.ts", "domain"],
  ["lib/world/assets.ts", "assets"],
  ["lib/world/environment.ts", "environment"],
  ["lib/world/material-kit.ts", "material-kit"],
  ["lib/world/shots.ts", "shots"],
]) {
  let code = ts.transpileModule(
    fs.readFileSync(new URL("../" + source, import.meta.url), "utf8"),
    {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ES2022,
      },
    },
  ).outputText;
  code = code
    .replace(/(["'])\.\/primitives\1/g, '"./primitives.js"')
    .replace(/(["'])\.\/interactions\1/g, '"./interactions.js"')
    .replace(/(["'])\.\.\/domain\1/g, '"./domain.js"');
  code = code.replace(/(["'])\.\/material-kit\1/g, '"./material-kit.js"');
  code=code.replace(/(["'])\.\.\/appearance\1/g, '"./appearance.js"');
  fs.writeFileSync(new URL(destination + ".js", dir), code);
}
fs.writeFileSync(new URL("appearance.js", dir), ts.transpileModule(fs.readFileSync(new URL("../lib/appearance.ts",import.meta.url),"utf8"),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText);
try {
  const { InteractionRegistry, actionAtUV } = await import(
    new URL("interactions.js", dir)
  );
  const { WorldSurface, SpatialInterface } = await import(
    new URL("spatial-interface.js", dir)
  );
  let checks = 0;
  const test = (name, fn) => {
    fn();
    checks++;
    console.log("PASS", name);
  };
  const cast = (registry, scene, point, eye) => {
    scene.updateMatrixWorld(true);
    const ray = new T.Raycaster(eye, point.clone().sub(eye).normalize());
    return registry.pick(ray, scene);
  };
  test("Una pared opaca impide activar objetos que están detrás", () => {
    const scene = new T.Scene(),
      registry = new InteractionRegistry(),
      target = new T.Mesh(
        new T.BoxGeometry(1, 1, 0.2),
        new T.MeshBasicMaterial(),
      );
    scene.add(target);
    registry.register(target, "car", "Carro");
    const eye = new T.Vector3(0, 0, 4);
    assert.equal(cast(registry, scene, target.position, eye), "car");
    const wall = new T.Mesh(
      new T.BoxGeometry(3, 3, 0.2),
      new T.MeshBasicMaterial(),
    );
    wall.position.z = 2;
    scene.add(wall);
    assert.equal(cast(registry, scene, target.position, eye), undefined);
  });
  test("Un objeto dentro de un grupo oculto no recibe selecciones", () => {
    const scene = new T.Scene(),
      registry = new InteractionRegistry(),
      group = new T.Group(),
      target = new T.Mesh(
        new T.BoxGeometry(1, 1, 1),
        new T.MeshBasicMaterial(),
      );
    group.add(target);
    scene.add(group);
    registry.register(target, "hidden", "Oculto");
    group.visible = false;
    assert.equal(
      cast(registry, scene, new T.Vector3(), new T.Vector3(0, 0, 3)),
      undefined,
    );
  });
  test("Los puntos UV convierten el contacto en una acción habilitada", () => {
    const regions = [
      { id: "save", label: "Guardar", x: 50, y: 800, width: 355, height: 100 },
    ];
    assert.equal(
      actionAtUV(regions, new T.Vector2(0.2, 0.15), 760, 1000)?.id,
      "save",
    );
    assert.equal(
      actionAtUV(
        [{ ...regions[0], enabled: false }],
        new T.Vector2(0.2, 0.15),
        760,
        1000,
      ),
      undefined,
    );
    assert.equal(
      actionAtUV(regions, new T.Vector2(0.9, 0.9), 760, 1000),
      undefined,
    );
  });
  test("Un botón sobre una tablilla inclinada recibe la acción desde su geometría 3D", () => {
    const scene = new T.Scene(),
      registry = new InteractionRegistry(),
      surface = new WorldSurface(
        0.76,
        1.02,
        760,
        1000,
        registry,
        new Element(),
        () => {},
      );
    surface.position.set(10.75, 1.32, 11.65);
    surface.rotation.x = -0.9;
    scene.add(surface);
    surface.paint();
    surface.action("accept", "Aceptar", 50, 800, 355, 100);
    surface.commit();
    scene.updateMatrixWorld(true);
    const local = new T.Vector3((0.2 - 0.5) * 0.76, (0.5 - 0.85) * 1.02, 0.021),
      point = surface.localToWorld(local);
    assert.equal(
      cast(registry, scene, point, new T.Vector3(10.95, 1.95, 13.2)),
      "accept",
    );
  });
  test("Un área sin botón puede seleccionar el objeto físico padre", () => {
    const scene = new T.Scene(),
      registry = new InteractionRegistry(),
      object = new T.Group(),
      surface = new WorldSurface(
        1,
        1,
        400,
        400,
        registry,
        new Element(),
        () => {},
      );
    object.add(surface);
    scene.add(object);
    registry.register(object, "compass", "Brújula");
    assert.equal(
      cast(registry, scene, new T.Vector3(0, 0, 0.021), new T.Vector3(0, 0, 3)),
      "compass",
    );
  });
  const make = (mobile = false) => {
    const scene = new T.Scene(),
      host = new Element(),
      registry = new InteractionRegistry(),
      displays = [
        "complete",
        "lights",
        "interior",
        "exterior",
        "polish",
        "engine",
      ].map((id, i) => {
        const object = new T.Group();
        object.position.set(2 + (i % 3) * 3.6, 0, 17);
        scene.add(object);
        return { id, object };
      });
    const assets = {
      vehicle: () => {
        const root = new T.Group();
        root.add(
          new T.Mesh(new T.BoxGeometry(2, 1.8, 4.7), new T.MeshBasicMaterial()),
        );
        return { root };
      },
    };
    return {
      scene,
      registry,
      displays,
      ui: new SpatialInterface(
        scene,
        host,
        registry,
        () => {},
        assets,
        displays,
        mobile,
      ),
    };
  };
  const view = {
    panel: "services",
    intro: false,
    selected: ["complete"],
    vehicle: { kind: "SUV", color: "Plata", plate: "DEMO" },
    total: 3500,
    items: [{ name: "Lavado completo", price: 3500 }],
    tasks: [],
    demo: false,
    busy: false,
    session: false,
    admin: false,
    saved: [],
  };
  test("En escritorio solo hay tres expositores activos por página", () => {
    const { ui, displays } = make();
    ui.setView(view);
    assert.deepEqual(
      displays.filter((d) => d.object.visible).map((d) => d.id),
      ["complete", "lights", "interior"],
    );
    ui.toggleServicePage();
    assert.deepEqual(
      displays.filter((d) => d.object.visible).map((d) => d.id),
      ["exterior", "polish", "engine"],
    );
    ui.dispose();
  });
  test("En móvil hay un expositor por encuadre y los seis servicios son alcanzables", () => {
    const { ui, displays } = make(true);
    ui.setView(view);
    const seen = new Set();
    for (let i = 0; i < 6; i++) {
      const active = displays.filter((d) => d.object.visible);
      assert.equal(active.length, 1);
      seen.add(active[0].id);
      assert.equal(active[0].object.position.x, 5.6);
      ui.toggleServicePage();
    }
    assert.equal(seen.size, 6);
    ui.dispose();
  });
  test("Guardar queda desactivado mientras la solicitud se procesa", () => {
    const { ui, scene } = make();
    ui.setView({ ...view, panel: "quote", busy: true });
    const surfaces = [];
    scene.traverse((o) => {
      if (o instanceof WorldSurface && o.visible) surfaces.push(o);
    });
    const quote = surfaces.find((s) =>
      s.regions.some((r) => r.id === "save-order"),
    );
    assert.equal(
      quote.regions.find((r) => r.id === "save-order").enabled,
      false,
    );
    ui.dispose();
  });
  test("El letrero junto al carro conserva estado y oculta su control mientras el carro se mueve", () => {
    const { ui, scene } = make();
    ui.setView({
      ...view,
      panel: null,
      orderId: "F-0104",
      status: "working",
      bay: 4,
      tasks: [{ name: "Interior", status: "pending" }],
    });
    ui.update(new T.Vector3(6, 0.1, -6), false, 0);
    const boards = [];
    scene.traverse((o) => {
      if (
        o instanceof WorldSurface &&
        o.visible &&
        o.regions.some((r) => r.id === "order-details")
      )
        boards.push(o);
    });
    assert.equal(boards.length, 1);
    assert.ok(boards[0].position.x > 8);
    ui.update(new T.Vector3(6, 0.1, -5), true, 0.1);
    assert.equal(boards[0].visible, false);
    ui.dispose();
  });
  const { WorldAssets, MODEL_FILES } = await import(new URL("assets.js", dir));
  const { buildEnvironment } = await import(new URL("environment.js", dir));
  const { shotFor } = await import(new URL("shots.js", dir));
  globalThis.createImageBitmap = async () => ({
    width: 512,
    height: 512,
    close() {},
  });
  globalThis.ProgressEvent = class {
    constructor(type, props) {
      Object.assign(this, { type }, props);
    }
  };
  const models = new Map(),
    loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  for (const name of MODEL_FILES) {
    const bytes = fs.readFileSync(
      new URL("../public/models/studio/" + name + ".glb", import.meta.url),
    );
    models.set(
      name,
      await loader.parseAsync(
        bytes.buffer.slice(
          bytes.byteOffset,
          bytes.byteOffset + bytes.byteLength,
        ),
        "",
      ),
    );
  }
  const assets = new WorldAssets(models),
    scene = new T.Scene(),
    registry = new InteractionRegistry(),
    environment = buildEnvironment(scene, false, assets),
    ui = new SpatialInterface(
      scene,
      new Element(),
      registry,
      () => {},
      assets,
      environment.serviceObjects,
    );
  const surfaces = () => {
    const result = [];
    scene.traverse((o) => {
      if (o instanceof WorldSurface) result.push(o);
    });
    return result;
  };
  const actionPoint = (surface, id) => {
    const r = surface.regions.find((r) => r.id === id);
    return surface.mesh.localToWorld(
      new T.Vector3(
        ((r.x + r.width / 2) / surface.pixelWidth - 0.5) *
          surface.mesh.geometry.parameters.width,
        (0.5 - (r.y + r.height / 2) / surface.pixelHeight) *
          surface.mesh.geometry.parameters.height,
        0,
      ),
    );
  };
  test("La entrada permite cruzar la puerta y el mapa completo cabe sin recortar zonas",()=>{
    ui.setView({...view,panel:null,intro:true});scene.updateMatrixWorld(true);
    const entry=surfaces().find(s=>s.visible&&s.regions.some(r=>r.id==="enter"));
    assert.equal(cast(registry,scene,actionPoint(entry,"enter"),shotFor("entrance",false).eye),"enter");
    for(const mobile of [false,true]){
      const shot=shotFor("overview",mobile),camera=new T.PerspectiveCamera(shot.fov,mobile?9/16:16/9,0.1,220);
      camera.position.copy(shot.eye);camera.lookAt(shot.target);camera.updateMatrixWorld(true);
      for(const x of [-21,21])for(const z of [-13,25]){
        const p=new T.Vector3(x,0,z).project(camera);
        assert.ok(Math.abs(p.x)<0.98&&Math.abs(p.y)<0.98,`map clipped ${mobile} ${x} ${z}`);
      }
    }
  });
  test("Los expositores no ocupan la entrada ni el mapa general",()=>{
    ui.setView({...view,panel:null,intro:false});
    assert.ok(environment.serviceObjects.every(d=>!d.object.visible));
    assert.ok(environment.roofs.length>=7);
    assert.equal(environment.bayTargets.length,5);
    assert.equal(environment.doors.length,2);
  });
  test("Las tres opciones del mostrador se pueden tocar en el local completo", () => {
    ui.setView({ ...view, panel: "reception" });
    scene.updateMatrixWorld(true);
    const shot = shotFor("reception", false);
    for (const id of ["services", "vehicle", "my-orders"]) {
      const surface = surfaces().find(
        (s) => s.visible && s.regions.some((r) => r.id === id),
      );
      assert.ok(surface, id);
      assert.equal(
        cast(registry, scene, actionPoint(surface, id), shot.eye),
        id,
      );
    }
  });
  test("Los botones de la tablilla quedan visibles delante del mostrador real", () => {
    ui.setView({ ...view, panel: "quote" });
    scene.updateMatrixWorld(true);
    const surface = surfaces().find((s) =>
        s.regions.some((r) => r.id === "save-order"),
      ),
      shot = shotFor("clipboard", false);
    for (const id of ["save-order", "change-services"])
      assert.equal(
        cast(registry, scene, actionPoint(surface, id), shot.eye),
        id,
      );
  });
  test("Los expositores y la revisión no se tapan entre sí desde el encuadre de servicios", () => {
    ui.setView({ ...view, panel: "services" });
    scene.updateMatrixWorld(true);
    const shot = shotFor("services", false);
    for (const id of [
      "service:complete",
      "service:lights",
      "service:interior",
      "review",
    ]) {
      const surface = surfaces().find(
        (s) => s.visible && s.regions.some((r) => r.id === id),
      );
      assert.equal(
        cast(registry, scene, actionPoint(surface, id), shot.eye),
        id,
        id,
      );
    }
  });
  test("La tableta y la tablilla completas caben en el encuadre de móvil", () => {
    for (const intent of ["tablet", "clipboard"]) {
      const shot = shotFor(intent, true),
        camera = new T.PerspectiveCamera(shot.fov, 9 / 16, 0.1, 220);
      camera.position.copy(shot.eye);
      camera.lookAt(shot.target);
      camera.updateMatrixWorld(true);
      const object = new T.Object3D();
      object.position.copy(
        intent === "tablet"
          ? new T.Vector3(0.55, 1.52, 18.532)
          : new T.Vector3(10.75, 1.32, 11.65),
      );
      object.rotation.x = intent === "tablet" ? -0.23 : -0.9;
      object.updateMatrixWorld(true);
      const width = intent === "tablet" ? 0.81 : 0.76,
        height = intent === "tablet" ? 1.08 : 1.02;
      for (const x of [-width / 2, width / 2])
        for (const y of [-height / 2, height / 2]) {
          const p = new T.Vector3(x, y, 0.021)
            .applyMatrix4(object.matrixWorld)
            .project(camera);
          assert.ok(
            Math.abs(p.x) < 0.96 && Math.abs(p.y) < 0.96,
            intent + " corner is clipped",
          );
        }
    }
  });
  test("Los controles del expositor móvil permanecen dentro de la pantalla", () => {
    const { ui, scene } = make(true);
    ui.setView({ ...view, panel: "services" });
    scene.updateMatrixWorld(true);
    const shot = shotFor("services", true),
      camera = new T.PerspectiveCamera(shot.fov, 9 / 16, 0.1, 220);
    camera.position.copy(shot.eye);
    camera.lookAt(shot.target);
    camera.updateMatrixWorld(true);
    const controls = [];
    scene.traverse((o) => {
      if (
        o instanceof WorldSurface &&
        o.visible &&
        o.regions.some((r) => r.id === "review")
      )
        controls.push(o);
    });
    const surface = controls[0];
    for (const region of surface.regions)
      for (const x of [region.x, region.x + region.width])
        for (const y of [region.y, region.y + region.height]) {
          const point = new T.Vector3(
            (x / surface.pixelWidth - 0.5) *
              surface.mesh.geometry.parameters.width,
            (0.5 - y / surface.pixelHeight) *
              surface.mesh.geometry.parameters.height,
            0,
          );
          surface.mesh.localToWorld(point);
          const p = point.project(camera);
          assert.ok(
            Math.abs(p.x) < 0.98 && Math.abs(p.y) < 0.98,
            "mobile review control clipped",
          );
        }
    ui.dispose();
  });
  ui.dispose();
  environment.reflector.getRenderTarget().dispose();
  assets.dispose();
  console.log(checks + " pruebas de interacción espacial verificadas.");
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}
