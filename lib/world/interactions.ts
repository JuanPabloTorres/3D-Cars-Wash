import * as T from "three";
export type HitRegion = {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  enabled?: boolean;
};
export function actionAtUV(
  regions: HitRegion[],
  uv: T.Vector2,
  pixelWidth: number,
  pixelHeight: number,
) {
  const x = uv.x * pixelWidth,
    y = (1 - uv.y) * pixelHeight;
  return [...regions]
    .reverse()
    .find(
      (r) =>
        r.enabled !== false &&
        x >= r.x &&
        x <= r.x + r.width &&
        y >= r.y &&
        y <= r.y + r.height,
    );
}
export function isVisible(object: T.Object3D) {
  let current: T.Object3D | null = object;
  while (current) {
    if (!current.visible) return false;
    current = current.parent;
  }
  return true;
}
/** One registry for physical objects and UV actions. Invisible and occluded objects cannot activate. */
export class InteractionRegistry {
  private targets = new Map<
    T.Object3D,
    {
      id: string;
      label: string;
      resolve?: (uv: T.Vector2) => string | undefined;
    }
  >();
  register(
    object: T.Object3D,
    id: string,
    label: string,
    resolve?: (uv: T.Vector2) => string | undefined,
  ) {
    this.targets.set(object, { id, label, resolve });
    return () => this.targets.delete(object);
  }
  pick(ray: T.Raycaster, scene: T.Scene): string | undefined {
    scene.updateMatrixWorld(true);
    const intersections = ray.intersectObjects(scene.children, true);
    for (const hit of intersections) {
      if (!isVisible(hit.object) || hit.object.userData.ignorePicking) continue;
      if (hit.object instanceof T.Points || hit.object instanceof T.Line)
        continue;
      let current: T.Object3D | null = hit.object;
      while (current) {
        const target = this.targets.get(current);
        if (target) {
          const id = target.resolve
            ? hit.uv
              ? target.resolve(hit.uv)
              : undefined
            : target.id;
          if (id) return id;
        }
        current = current.parent;
      }
      // Solid scenery blocks selections behind it. Transparent panes and effects do not.
      if (hit.object instanceof T.Mesh) {
        const materials = Array.isArray(hit.object.material)
          ? hit.object.material
          : [hit.object.material];
        if (materials.some((m) => !m.transparent && m.opacity > 0.2)) return;
      }
    }
  }
  clear() {
    this.targets.clear();
  }
}
