import * as T from "three";
import { vehicleModel } from "../appearance";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { clone as cloneSkeleton } from "three/addons/utils/SkeletonUtils.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

export const MODEL_FILES = [
  "suv",
  "sedan",
  "pickup",
  "compact",
  "van",
  "female",
  "male",
  "sofa",
  "palm",
] as const;
type ModelName = (typeof MODEL_FILES)[number];
export type VehicleModel = {
  root: T.Group;
  wheels: T.Group[];
  paint: T.MeshPhysicalMaterial;
};

/** Geometry and textures are shared; skeletons and vehicle paint belong to each actor. */
export class WorldAssets {
  private vehicles = new Map<string, T.Group>();
  constructor(private models: Map<ModelName, GLTF>) {
    const styled = new Set<T.Material>();
    models.forEach(model => model.scene.traverse(o => {
      if(!(o instanceof T.Mesh)) return;
      for(const material of Array.isArray(o.material)?o.material:[o.material]) {
        if(styled.has(material)) continue;styled.add(material);
        if(material instanceof T.MeshStandardMaterial) {
          material.roughness = Math.max(material.roughness,0.54);
          material.metalness = Math.min(material.metalness,0.32);
          material.envMapIntensity = 0.65;
        }
      }
    }));
    for (const kind of ["suv", "sedan", "pickup", "compact", "van"] as const)
      this.vehicles.set(kind, prepareVehicle(models.get(kind)!.scene));
  }
  static async load(): Promise<WorldAssets> {
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    const entries = await Promise.all(
      MODEL_FILES.map(
        async (name) =>
          [
            name,
            await loader.loadAsync("/models/studio/" + name + ".glb"),
          ] as const,
      ),
    );
    return new WorldAssets(new Map(entries));
  }
  vehicle(kind: string, color: T.Color): VehicleModel {
    const root = this.vehicles
      .get(vehicleModel(kind))!
      .clone(true);
    const paint = new T.MeshPhysicalMaterial({
      color,
      roughness: 0.48,
      metalness: 0.25,
      clearcoat: 0.45,
      clearcoatRoughness: 0.16,
      envMapIntensity: 1.15,
    });
    root.traverse((o) => {
      if (o instanceof T.Mesh && /paint/i.test(o.material.name))
        o.material = paint;
    });
    return {
      root,
      wheels: root.children.filter((o) =>
        o.name.startsWith("wheel-"),
      ) as T.Group[],
      paint,
    };
  }
  person(female: boolean, shirt: string) {
    const model = this.models.get(female ? "female" : "male")!;
    const root = new T.Group(),
      rig = cloneSkeleton(model.scene);
    root.add(rig);
    rig.traverse((o) => {
      if (o instanceof T.Mesh) {
        if (/accessory|briefcase|phone/i.test(o.name)) {
          o.visible = false;
          return;
        }
        o.castShadow = true;
        o.receiveShadow = true;
        const materials = Array.isArray(o.material) ? o.material : [o.material];
        const owned = materials.map((material) => {
          const m = material.clone() as T.MeshStandardMaterial;
          m.userData.actorOwned=true;
          if (/original top|tailored business fabric/i.test(m.name))
            m.color.set(shirt);
          return m;
        });
        o.material = Array.isArray(o.material) ? owned : owned[0];
        if (o instanceof T.SkinnedMesh) o.frustumCulled = false;
      }
    });
    const mixer = new T.AnimationMixer(rig);
    const idle = model.animations.find((clip) => /idle/i.test(clip.name));
    if (idle) {
      mixer.clipAction(idle).play();
      mixer.update(0);
    }
    // The source has an upright, animated MakeHuman skeleton in metres.
    const bounds = new T.Box3().setFromObject(rig),
      height = bounds.max.y - bounds.min.y;
    const scale = (female ? 1.73 : 1.82) / height;
    rig.scale.multiplyScalar(scale);
    rig.position.y -= bounds.min.y * scale;
    if (["#454248", "#37383b"].includes(shirt)) {
      const material = new T.MeshStandardMaterial({
        color: "#c7312c",
        roughness: 0.9,
        side: T.DoubleSide,
      });
      material.userData.actorOwned=true;
      for (const side of [-1, 1]) {
        const shape = new T.Shape();
        shape.moveTo(0, 0);
        shape.lineTo(side * 0.09, -0.035);
        shape.lineTo(side * 0.045, -0.115);
        shape.lineTo(0, -0.06);
        shape.closePath();
        const collar = new T.Mesh(new T.ShapeGeometry(shape), material);
        collar.geometry.userData.actorOwned=true;
        collar.position.set(side * 0.024, female ? 1.46 : 1.55, 0.115);
        root.add(collar);
      }
    }
    return { root, rig, mixer };
  }
  servicePart(id: "lights" | "interior") {
    const source = this.models.get("suv")!.scene;
    source.updateMatrixWorld(true);
    const root = new T.Group(),
      part = new T.Group();
    root.add(part);
    source.traverse((o) => {
      if (!(o instanceof T.Mesh)) return;
      const center = new T.Box3().setFromObject(o).getCenter(new T.Vector3());
      const keep =
        id === "lights"
          ? /headlamp|projector/i.test(o.name) && center.z > 0
          : /contoured.seat|adjustable.headrest/i.test(o.name) &&
            center.x < 0.5 &&
            center.z > 0;
      if (!keep) return;
      const mesh = new T.Mesh(
        o.geometry.clone().applyMatrix4(o.matrixWorld),
        o.material,
      );
      mesh.castShadow = mesh.receiveShadow = true;
      part.add(mesh);
    });
    if (!part.children.length)
      throw new Error("El recurso no contiene el componente " + id);
    part.rotation.y = Math.PI / 2;
    const bounds = new T.Box3().setFromObject(part),
      size = bounds.getSize(new T.Vector3()),
      center = bounds.getCenter(new T.Vector3());
    const scale = (id === "lights" ? 0.65 : 1.32) / size.y;
    part.scale.setScalar(scale);
    part.position.set(
      -center.x * scale,
      -bounds.min.y * scale,
      -center.z * scale,
    );
    return root;
  }
  sofa() {
    const root = new T.Group(),
      model = this.models.get("sofa")!.scene.clone(true);
    root.add(model);
    const bounds = new T.Box3().setFromObject(model),
      size = bounds.getSize(new T.Vector3());
    model.scale.multiplyScalar(2.9 / size.x);
    model.position.sub(
      bounds.getCenter(new T.Vector3()).multiplyScalar(2.9 / size.x),
    );
    model.position.y += size.y * 0.5 * (2.9 / size.x);
    model.traverse((o) => {
      if (o instanceof T.Mesh) o.castShadow = o.receiveShadow = true;
    });
    return root;
  }
  palm(height: number) {
    const root = new T.Group(),
      model = this.models.get("palm")!.scene.clone(true);
    root.add(model);
    const bounds = new T.Box3().setFromObject(model),
      size = bounds.getSize(new T.Vector3());
    const scale = height / size.y;
    model.scale.multiplyScalar(scale);
    const center = bounds.getCenter(new T.Vector3());
    model.position.set(
      -center.x * scale,
      -bounds.min.y * scale,
      -center.z * scale,
    );
    model.traverse((o) => {
      if (o instanceof T.Mesh) {
        o.castShadow = o.receiveShadow = true;
      }
    });
    return root;
  }
  dispose() {
    const geometries = new Set<T.BufferGeometry>(),
      materials = new Set<T.Material>(),
      textures = new Set<T.Texture>();
    const collect = (root: T.Object3D) =>
      root.traverse((o) => {
        if (o instanceof T.Mesh) {
          geometries.add(o.geometry);
          for (const material of Array.isArray(o.material)
            ? o.material
            : [o.material]) {
            materials.add(material);
            for (const value of Object.values(material))
              if (value instanceof T.Texture) textures.add(value);
          }
        }
      });
    this.models.forEach((model) => collect(model.scene));
    this.vehicles.forEach(collect);
    geometries.forEach((g) => g.dispose());
    textures.forEach((t) => t.dispose());
    materials.forEach((m) => m.dispose());
  }
}

/** Bake the 300+ source parts into material batches, preserving four rolling wheels. */
function prepareVehicle(source: T.Group): T.Group {
  const model = source.clone(true);
  model.rotation.y = Math.PI / 2; // source front is -X; the traffic director uses +Z.
  model.updateMatrixWorld(true);
  const bounds = new T.Box3().setFromObject(model),
    center = bounds.getCenter(new T.Vector3());
  model.position.set(-center.x, -bounds.min.y, -center.z);
  model.updateMatrixWorld(true);
  const tires: T.Vector3[] = [];
  model.traverse((o) => {
    if (o instanceof T.Mesh && /sculpted.tyre/i.test(o.name))
      tires.push(new T.Box3().setFromObject(o).getCenter(new T.Vector3()));
  });
  if (tires.length !== 4)
    throw new Error("El modelo de vehículo debe contener cuatro ruedas.");
  const root = new T.Group(),
    body = new T.Group();
  body.name = "body";
  root.add(body);
  const wheels = tires.map((position, i) => {
    const group = new T.Group();
    group.name = "wheel-" + i;
    group.position.copy(position);
    root.add(group);
    return group;
  });
  const buckets = new Map<T.Group, Map<T.Material, T.BufferGeometry[]>>();
  model.traverse((o) => {
    if (!(o instanceof T.Mesh) || Array.isArray(o.material)) return;
    let destination = body;
    if (/alloy|center.cap|lug_|sculpted.tyre|valve.stem/i.test(o.name)) {
      const position = new T.Box3().setFromObject(o).getCenter(new T.Vector3());
      const closest = tires
        .map((t, i) => ({ i, distance: t.distanceToSquared(position) }))
        .sort((a, b) => a.distance - b.distance)[0].i;
      destination = wheels[closest];
    }
    // Canonical float attributes avoid merging incompatible quantized glTF accessors.
    const geometry = new T.BufferGeometry();
    for (const name of ["position", "normal", "uv"]) {
      const attribute = o.geometry.getAttribute(name);
      if (!attribute) continue;
      const values = new Float32Array(attribute.count * attribute.itemSize);
      for (let i = 0; i < attribute.count; i++)
        for (let j = 0; j < attribute.itemSize; j++)
          values[i * attribute.itemSize + j] = attribute.getComponent(i, j);
      geometry.setAttribute(
        name,
        new T.BufferAttribute(values, attribute.itemSize),
      );
    }
    if (!geometry.getAttribute("uv"))
      geometry.setAttribute(
        "uv",
        new T.Float32BufferAttribute(
          new Float32Array(geometry.getAttribute("position").count * 2),
          2,
        ),
      );
    if (o.geometry.index) geometry.setIndex(o.geometry.index.clone());
    const matrix = new T.Matrix4()
      .makeTranslation(
        -destination.position.x,
        -destination.position.y,
        -destination.position.z,
      )
      .multiply(o.matrixWorld);
    geometry.applyMatrix4(matrix);
    if (!geometry.getAttribute("normal")) geometry.computeVertexNormals();
    const byMaterial = buckets.get(destination) ?? new Map();
    const list = byMaterial.get(o.material) ?? [];
    list.push(geometry);
    byMaterial.set(o.material, list);
    buckets.set(destination, byMaterial);
  });
  for (const [destination, byMaterial] of buckets)
    for (const [material, geometries] of byMaterial) {
      const geometry = mergeGeometries(geometries, false);
      geometries.forEach((g) => g.dispose());
      if (!geometry)
        throw new Error("No se pudo preparar la geometría del vehículo.");
      const mesh = new T.Mesh(geometry, material);
      mesh.castShadow = mesh.receiveShadow = true;
      destination.add(mesh);
    }
  return root;
}
