import * as T from "three";
import { materials } from "./primitives";
/** Original tileable surface textures, not scene backgrounds. */
export function prepareArchitecturalMaterials() {
  let seed = 91;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const wood = document.createElement("canvas");
  wood.width = 512;
  wood.height = 1024;
  const w = wood.getContext("2d")!;
  w.fillStyle = "#ae794b";
  w.fillRect(0, 0, 512, 1024);
  for (let i = 0; i < 15000; i++) {
    const x = random() * 512,
      y = random() * 1024;
    w.fillStyle = i % 3 ? "#331c1020" : "#ffe0a029";
    w.fillRect(x, y, 0.3 + random() * 1.4, 8 + random() * 90);
  }
  for (let x = 0; x < 512; x += 8) {
    w.strokeStyle = "#42220c1d";
    w.lineWidth = 0.6;
    w.beginPath();
    for (let y = 0; y <= 1024; y += 8) {
      const xx =
        x + Math.sin(y * 0.013 + x) * 2.8 + Math.sin(y * 0.07 + x) * 0.7;
      if (y === 0) w.moveTo(xx, y);
      else w.lineTo(xx, y);
    }
    w.stroke();
  }
  const stone = document.createElement("canvas");
  stone.width = stone.height = 512;
  const s = stone.getContext("2d")!;
  s.fillStyle = "#363b3e";
  s.fillRect(0, 0, 512, 512);
  for (let row = 0; row < 8; row++)
    for (let col = -1; col < 5; col++) {
      const x = col * 128 + (row % 2) * 64,
        y = row * 64;
      const grey = 58 + Math.floor(random() * 22);
      s.fillStyle = `rgb(${grey},${grey + 2},${grey + 3})`;
      s.fillRect(x + 2, y + 2, 124, 60);
      s.fillStyle = "#ffffff0b";
      s.fillRect(x + 3, y + 2, 121, 2);
    }
  for (let i = 0; i < 25000; i++) {
    s.fillStyle = i % 2 ? "#e4e1d90e" : "#10171822";
    s.fillRect(
      random() * 512,
      random() * 512,
      1 + random() * 3,
      1 + random() * 2,
    );
  }
  const texture = (canvas: HTMLCanvasElement) => {
    const tx = new T.CanvasTexture(canvas);
    tx.colorSpace = T.SRGBColorSpace;
    tx.wrapS = tx.wrapT = T.RepeatWrapping;
    tx.anisotropy = 8;
    return tx;
  };
  const woodMap = texture(wood),
    stoneMap = texture(stone);
  for (const material of [materials.wood, materials.woodLight]) {
    material.color.set("#ffffff");
    material.map = woodMap;
    material.bumpMap = woodMap;
    material.bumpScale = 0.006;
    material.roughness = 0.38;
    material.userData.worldScale = 1;
    material.needsUpdate = true;
  }
  materials.stone.color.set("#ffffff");
  materials.stone.map = stoneMap;
  materials.stone.bumpMap = stoneMap;
  materials.stone.bumpScale = 0.025;
  materials.stone.roughness = 0.82;
  materials.stone.userData.worldScale = 1;
  materials.stone.needsUpdate = true;
}
