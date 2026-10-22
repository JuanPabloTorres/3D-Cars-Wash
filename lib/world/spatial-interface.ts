import * as T from "three";
import {
  CSS3DObject,
  CSS3DRenderer,
} from "three/addons/renderers/CSS3DRenderer.js";
import { box, cylinder, tube, sign, materials as m, v } from "./primitives";
import {
  actionAtUV,
  type HitRegion,
  InteractionRegistry,
} from "./interactions";
import type { WorldAssets } from "./assets";
import { CATALOG, money, STATUS_LABEL, type OrderStatus } from "../domain";
export type SpatialView = {
  panel: string | null;
  intro: boolean;
  selected: string[];
  vehicle: { kind: string; color: string; plate: string };
  total: number;
  items: { name: string; price: number }[];
  tasks: { name: string; status: string }[];
  orderId?: string;
  status?: string;
  bay?: number | null;
  paid?: boolean;
  demo: boolean;
  busy: boolean;
  catalog?: readonly {
    id: string;
    name: string;
    price: number;
    minutes: number;
  }[];
  activeOrder?: { plate: string; tasks: { name: string; status: string }[] };
  session: boolean;
  admin: boolean;
  saved: { id: string; plate: string; status: string }[];
};
const initial: SpatialView = {
  panel: null,
  intro: true,
  selected: [],
  vehicle: { kind: "SUV", color: "Plata", plate: "" },
  total: 0,
  items: [],
  tasks: [],
  demo: false,
  busy: false,
  session: false,
  admin: false,
  saved: [],
};
export class WorldSurface extends T.Group {
  canvas = document.createElement("canvas");
  context: CanvasRenderingContext2D;
  texture: T.CanvasTexture;
  mesh: T.Mesh;
  regions: HitRegion[] = [];
  pixelWidth: number;
  pixelHeight: number;
  private semantic: HTMLDivElement;
  constructor(
    width: number,
    height: number,
    pixelWidth: number,
    pixelHeight: number,
    registry: InteractionRegistry,
    a11y: HTMLElement,
    private select: (id: string) => void,
  ) {
    super();
    this.pixelWidth = pixelWidth;
    this.pixelHeight = pixelHeight;
    this.canvas.width = pixelWidth;
    this.canvas.height = pixelHeight;
    this.context = this.canvas.getContext("2d")!;
    this.texture = new T.CanvasTexture(this.canvas);
    this.texture.colorSpace = T.SRGBColorSpace;
    this.texture.anisotropy = 8;
    this.mesh = new T.Mesh(
      new T.PlaneGeometry(width, height),
      new T.MeshStandardMaterial({
        map: this.texture,
        roughness: 0.62,
        metalness: 0,
        side: T.FrontSide,
      }),
    );
    this.mesh.position.z = 0.021;
    this.add(this.mesh);
    registry.register(
      this.mesh,
      "surface",
      "Superficie interactiva",
      (uv) => actionAtUV(this.regions, uv, pixelWidth, pixelHeight)?.id,
    );
    this.semantic = document.createElement("div");
    a11y.appendChild(this.semantic);
  }
  paint(background = "#f5efe2") {
    const c = this.context;
    c.clearRect(0, 0, this.pixelWidth, this.pixelHeight);
    c.fillStyle = background;
    c.fillRect(0, 0, this.pixelWidth, this.pixelHeight);
    this.regions = [];
    this.semantic.replaceChildren();
    return c;
  }
  text(
    text: string,
    x: number,
    y: number,
    size = 34,
    color = "#302a24",
    align: CanvasTextAlign = "left",
    weight = 600,
  ) {
    const c = this.context;
    c.font = `${weight} ${size}px Arial`;
    c.fillStyle = color;
    c.textAlign = align;
    c.textBaseline = "middle";
    c.fillText(text, x, y, this.pixelWidth - 40);
  }
  action(
    id: string,
    label: string,
    x: number,
    y: number,
    width: number,
    height: number,
    options: {
      color?: string;
      text?: string;
      font?: number;
      enabled?: boolean;
    } = {},
  ) {
    const c = this.context;
    c.fillStyle = options.color ?? "#be342a";
    c.beginPath();
    c.roundRect(x, y, width, height, Math.min(18, height / 3));
    c.fill();
    this.text(
      label,
      x + width / 2,
      y + height / 2,
      options.font ?? Math.min(80, height * 0.42),
      options.text ?? "#fff",
      "center",
    );
    this.regions.push({
      id,
      label,
      x,
      y,
      width,
      height,
      enabled: options.enabled,
    });
    const button = document.createElement("button");
    button.textContent = label;
    button.disabled = options.enabled === false;
    button.onclick = () => this.select(id);
    this.semantic.appendChild(button);
  }
  commit() {
    this.texture.needsUpdate = true;
  }
  show(visible: boolean) {
    this.visible = visible;
    this.semantic.hidden = !visible;
  }
}
/** UI objects live in the same scene as the vehicles; only editable tablet fields use CSS3D. */
export class SpatialInterface {
  root = new T.Group();
  domRenderer: CSS3DRenderer;
  portal: HTMLDivElement;
  private tablet: T.Group;
  private cssTablet: CSS3DObject;
  private a11y: HTMLDivElement;
  private surfaces: WorldSurface[] = [];
  private menu = new T.Group();
  private menuObjects: T.Group[] = [];
  private quotation: WorldSurface;
  private orderBoard: WorldSurface;
  private statusBoard: WorldSurface;
  private serviceLabels = new Map<string, WorldSurface>();
  private serviceControls: WorldSurface;
  private welcome: WorldSurface;
  private speech: WorldSurface;
  private operations: WorldSurface;
  private view: SpatialView = initial;
  private page = 0;
  constructor(
    private scene: T.Scene,
    host: HTMLElement,
    private registry: InteractionRegistry,
    private select: (id: string) => void,
    assets: WorldAssets,
    private displays: { id: string; object: T.Object3D }[],
    private mobile = false,
  ) {
    scene.add(this.root);
    this.a11y = document.createElement("div");
    this.a11y.className = "spatial-a11y";
    host.appendChild(this.a11y);
    this.domRenderer = new CSS3DRenderer();
    this.domRenderer.domElement.className = "spatial-dom";
    host.appendChild(this.domRenderer.domElement);
    this.portal = document.createElement("div");
    this.portal.className = "world-tablet-portal";
    this.portal.style.width = "600px";
    this.portal.style.height = "800px";
    this.cssTablet = new CSS3DObject(this.portal);
    this.cssTablet.scale.setScalar(0.00135);
    this.cssTablet.position.set(0.55, 1.52, 18.5);
    this.cssTablet.rotation.x = -0.23;
    scene.add(this.cssTablet);
    this.tablet = new T.Group();
    this.tablet.position.copy(this.cssTablet.position);
    this.tablet.rotation.copy(this.cssTablet.rotation);
    this.root.add(this.tablet);
    box(this.tablet, 0.88, 1.16, 0.055, m.black, 0, 0, 0, 0.045);
    box(this.tablet, 0.34, 0.09, 0.44, m.steel, 0, -0.64, -0.08, 0.035);
    this.cssTablet.position.z += 0.032;
    this.welcome = this.surface(1.5, 1.9, 640, 800);
    this.welcome.position.set(-5.7, 1.4, 20.4);
    box(this.welcome, 1.66, 2.07, 0.15, m.stone, 0, 0, -0.08, 0.045);
    cylinder(this.root, 0.07, 0.7, m.steel, -5.7, 0.35, 20.4);
    const wc = this.welcome.paint("#252d30");
    this.welcome.text("FEBLES", 320, 130, 80, "#fff", "center", 800);
    this.welcome.text("CAR WASH", 320, 210, 34, "#e74034", "center", 700);
    this.welcome.text("Bienvenido", 320, 360, 55, "#efe1c8", "center");
    this.welcome.action(
      "reception",
      "Acércate a recepción  →",
      45,
      480,
      550,
      105,
      { color: "#b83229" },
    );
    this.welcome.action("demo", "Recorrido de ejemplo", 70, 650, 500, 65, {
      color: "#414746",
    });
    this.welcome.commit();
    // Three tangible choices on the reception counter, as in the concept art.
    this.menu.position.set(11.2, 1.005, 11.52);
    this.root.add(this.menu);
    for (const [index, id, label] of [
      [0, "services", "Explorar"],
      [1, "vehicle", "Mi visita"],
      [2, "my-orders", "Mi orden"],
    ] as const) {
      const pedestal = new T.Group();
      pedestal.position.x = (index - 1) * 1.45;
      this.menu.add(pedestal);
      this.menuObjects.push(pedestal);
      box(pedestal, 1.26, 0.18, 0.92, m.wood, 0, 0.09, 0, 0.04);
      box(pedestal, 1.12, 0.06, 0.8, m.steel, 0, 0.21, 0, 0.025);
      const plaque = this.surface(1.15, 0.29, 700, 180);
      plaque.position.set(0, 0.12, 0.47);
      pedestal.add(plaque);
      plaque.paint("#c18d59");
      plaque.action(id, label, 0, 0, 700, 180, {
        color: "#c18d59",
        text: "#31271c",
      });
      plaque.commit();
      if (index === 0) {
        const compass = new T.Group();
        compass.position.y = 0.58;
        compass.rotation.x = -0.3;
        pedestal.add(compass);
        const ring = new T.Mesh(
          new T.TorusGeometry(0.28, 0.035, 12, 48),
          m.gold,
        );
        compass.add(ring);
        const dial = this.surface(0.49, 0.49, 400, 400);
        dial.paint("#e4d6af");
        dial.text("N", 200, 64, 58, "#b9322b", "center");
        dial.text("S", 200, 332, 42, "#65543f", "center");
        dial.text("✦", 200, 200, 155, "#514333", "center");
        dial.commit();
        compass.add(dial);
        registry.register(compass, id, label);
      }
      if (index === 1) {
        const miniature = assets.vehicle("SUV", new T.Color("#bec7cd")).root;
        miniature.scale.setScalar(0.115);
        miniature.position.y = 0.25;
        miniature.rotation.y = -0.3;
        pedestal.add(miniature);
        registry.register(miniature, id, label);
      }
      if (index === 2) {
        const paper = this.surface(0.52, 0.67, 400, 520);
        paper.position.set(0, 0.62, 0);
        paper.rotation.x = -0.23;
        paper.paint("#f5eddc");
        paper.text("MI ORDEN", 200, 85, 37, "#645543", "center");
        for (let i = 0; i < 6; i++)
          paper.text("────────", 200, 175 + i * 45, 23, "#bcac91", "center");
        paper.commit();
        registry.register(paper, id, label);
        pedestal.add(paper);
      }
    }
    this.speech = this.surface(1.45, 0.54, 720, 270);
    this.speech.position.set(11.1, 2.33, 10.02);
    const bubble = this.speech.paint("#fff8e8");
    bubble.clearRect(0, 0, 720, 270);
    bubble.fillStyle = "#fff8e8";
    bubble.beginPath();
    bubble.roundRect(5, 5, 710, 220, 45);
    bubble.fill();
    bubble.beginPath();
    bubble.moveTo(320, 220);
    bubble.lineTo(365, 268);
    bubble.lineTo(385, 220);
    bubble.closePath();
    bubble.fill();
    (this.speech.mesh.material as T.MeshStandardMaterial).transparent = true;
    this.speech.text("¡Bienvenido!", 360, 90, 52, "#332b23", "center");
    this.speech.text("¿En qué te ayudo?", 360, 175, 43, "#5b4d3e", "center");
    this.speech.commit();
    // The clipboard is a real tilted object on the desk, not a screen overlay.
    this.quotation = this.surface(0.76, 1.02, 760, 1000);
    this.quotation.position.set(10.75, 1.32, 11.65);
    this.quotation.rotation.x = -0.9;
    box(this.quotation, 0.83, 1.09, 0.04, m.wood, 0, 0, -0.022, 0.025);
    box(this.quotation, 0.31, 0.055, 0.035, m.steel, 0, 0.46, 0.035, 0.012);
    this.orderBoard = this.surface(0.76, 1.02, 760, 1000);
    this.orderBoard.position.copy(this.quotation.position);
    this.orderBoard.rotation.copy(this.quotation.rotation);
    box(this.orderBoard, 0.83, 1.09, 0.04, m.wood, 0, 0, -0.022, 0.025);
    this.statusBoard = this.surface(1.12, 1.42, 640, 800);
    box(this.statusBoard, 1.22, 1.55, 0.16, m.steel, 0, 0, -0.07, 0.035);
    cylinder(this.statusBoard, 0.055, 0.75, m.steel, 0, -1.08, -0.03);
    box(this.statusBoard, 0.65, 0.05, 0.55, m.steel, 0, -1.47, 0, 0.035);
    for (const display of displays) {
      const label = this.surface(2.42, 0.68, 900, 260);
      label.position.set(0, 0.67, 1.115);
      display.object.add(label);
      this.serviceLabels.set(display.id, label);
    }
    this.serviceControls = this.surface(
      mobile ? 2.8 : 8.4,
      mobile ? 0.65 : 0.27,
      mobile ? 1000 : 2400,
      mobile ? 220 : 110,
    );
    this.serviceControls.position.set(5.6, mobile ? 0.34 : 0.16, 18.14);
    box(
      this.serviceControls,
      mobile ? 2.9 : 8.5,
      mobile ? 0.7 : 0.32,
      0.075,
      m.wood,
      0,
      0,
      -0.04,
      0.02,
    );
    this.operations = this.surface(0.9, 0.26, 650, 200);
    this.operations.position.set(13.6, 1.55, 11.96);
    this.operations.paint("#343a34");
    this.operations.action("admin", "Operación", 0, 0, 650, 200, {
      color: "#343a34",
    });
    this.operations.commit();
    // Small permanent wooden wayfinding signs replace a navigation dock.
    const signposts = [
      { id: "lounge", label: "Zona lounge  ←", x: 8.05, y: 1.85, z: 12.12 },
      { id: "reception", label: "Recepción  →", x: -7.6, y: 1.5, z: 13.3 },
    ];
    for (const cfg of signposts) {
      const plaque = this.surface(1.15, 0.35, 750, 230);
      plaque.position.set(cfg.x, cfg.y, cfg.z);
      box(plaque, 1.25, 0.45, 0.07, m.wood, 0, 0, -0.04, 0.02);
      plaque.paint("#2b302d");
      plaque.action(cfg.id, cfg.label, 0, 0, 750, 230, {
        color: "#2b302d",
        text: "#eee3cd",
      });
      plaque.commit();
    }
    this.setView(initial);
  }
  private surface(w: number, h: number, pw: number, ph: number) {
    const surface = new WorldSurface(
      w,
      h,
      pw,
      ph,
      this.registry,
      this.a11y,
      this.select,
    );
    this.surfaces.push(surface);
    this.root.add(surface);
    return surface;
  }
  setServicePage(page: number) {
    this.page = page;
    this.refreshServices();
  }
  private refreshServices() {
    const order = [
      "complete",
      "lights",
      "interior",
      "exterior",
      "polish",
      "engine",
    ];
    const ids = this.mobile
      ? [order[this.page % 6]]
      : this.page === 0
        ? order.slice(0, 3)
        : order.slice(3);
    for (const display of this.displays) {
      display.object.visible = ids.includes(display.id);
      if (this.mobile) display.object.position.x = 5.6;
      const label = this.serviceLabels.get(display.id)!;
      label.show(ids.includes(display.id));
      if (this.mobile) label.position.y = 1.05;
      const service =
        (this.view.catalog ?? CATALOG).find((s) => s.id === display.id) ??
        CATALOG.find((s) => s.id === display.id)!;
      const selected = this.view.selected.includes(display.id);
      label.paint("#282c2d");
      label.text(service.name, 450, 55, 43, "#fff1da", "center");
      label.text(
        money(service.price) + " · ~" + service.minutes + " min",
        450,
        122,
        29,
        "#bea982",
        "center",
      );
      label.action(
        "service:" + display.id,
        selected ? "✓  Seleccionado" : "＋  Elegir",
        190,
        164,
        520,
        75,
        { color: selected ? "#46664d" : "#b53329" },
      );
      label.commit();
    }
    const s = this.serviceControls;
    s.paint("#302c25");
    if (this.mobile) {
      s.text(
        this.view.selected.length + " servicios · " + money(this.view.total),
        500,
        36,
        43,
        "#f4e5c9",
        "center",
      );
      s.action("service-page", "Siguiente →", 20, 90, 445, 115, {
        color: "#5b5b42",
      });
      s.action("review", "Revisar →", 495, 90, 485, 115, {
        enabled: this.view.selected.length > 0 && !this.view.busy,
      });
    } else {
      s.text(
        this.view.selected.length +
          " servicios · " +
          money(this.view.total) +
          " (ejemplo)",
        455,
        55,
        46,
        "#f4e5c9",
        "center",
      );
      s.action(
        "service-page",
        this.page ? "← Principales" : "Más detailing →",
        920,
        10,
        640,
        90,
        { color: "#5b5b42", font: 48 },
      );
      s.action("review", "Revisar mi visita →", 1600, 10, 770, 90, {
        font: 48,
        enabled: this.view.selected.length > 0 && !this.view.busy,
      });
    }
    s.commit();
  }
  setView(view: SpatialView) {
    this.view = view;
    const reception = view.panel === "reception",
      quote = view.panel === "quote",
      order = view.panel === "order" || view.panel === "saved",
      guarantee = view.panel === "guarantee",
      vehicle = view.panel === "vehicle";
    this.menu.visible = reception || (!view.panel && !view.intro);
    this.speech.show(reception);
    this.quotation.show(quote);
    this.orderBoard.show(order || guarantee);
    this.tablet.visible = vehicle;
    this.cssTablet.visible = vehicle;
    this.portal.style.pointerEvents = vehicle ? "auto" : "none";
    this.operations.show(view.admin);
    this.welcome.show(view.intro && !view.orderId);
    this.statusBoard.show(!!view.orderId);
    this.serviceControls.show(view.panel === "services");
    // Keep semantic controls synchronized with parent visibility.
    for (const group of this.menuObjects)
      group.traverse((o) => {
        if (o instanceof WorldSurface) o.show(this.menu.visible);
      });
    this.refreshServices();
    this.drawQuote();
    this.drawOrder(guarantee);
    this.drawStatus();
  }
  private drawQuote() {
    const s = this.quotation,
      v = this.view;
    s.paint("#fbf5e8");
    s.text("Tu cotización", 380, 120, 59, "#29251f", "center");
    s.text(
      v.vehicle.kind + " · " + (v.vehicle.plate || "Tu vehículo"),
      380,
      210,
      32,
      "#96846b",
      "center",
    );
    let y = 310;
    for (const item of v.items.slice(0, 6)) {
      s.text(item.name, 55, y, 32);
      s.text(money(item.price), 700, y, 32, "#473d30", "right");
      y += 60;
    }
    s.text("TOTAL DE EJEMPLO", 55, 720, 25, "#8e7d63");
    s.text(money(v.total), 700, 720, 58, "#32271c", "right");
    s.action(
      "save-order",
      v.busy ? "Guardando…" : "✓  Aceptar",
      50,
      800,
      355,
      100,
      { color: "#577244", enabled: !v.busy && v.items.length > 0 },
    );
    s.action("change-services", "Cambiar", 430, 800, 280, 100, {
      color: "#ded3bf",
      text: "#5b4d39",
      enabled: !v.busy,
    });
    s.text("Solicitud · sin cobro en línea", 380, 955, 25, "#aa9879", "center");
    s.commit();
  }
  private drawOrder(guarantee: boolean) {
    const s = this.orderBoard,
      v = this.view;
    s.paint("#faf3e5");
    if (v.panel === "saved") {
      s.text("Mis visitas", 380, 120, 62, "#473723", "center");
      if (!v.saved.length)
        s.text(
          "No hay solicitudes guardadas.",
          380,
          340,
          32,
          "#9e8969",
          "center",
        );
      for (const [i, order] of v.saved.slice(0, 5).entries()) {
        s.action(
          "saved:" + order.id,
          order.plate +
            " · " +
            (STATUS_LABEL[order.status as OrderStatus] ?? order.status),
          45,
          260 + i * 120,
          670,
          95,
          { color: "#ded1b7", text: "#6b5131" },
        );
      }
      s.action("vehicle", "Preparar una visita", 100, 870, 560, 80, {
        color: "#b43129",
      });
      s.commit();
      return;
    }
    if (guarantee) {
      s.text("Garantía de lluvia", 380, 140, 48, "#4f3c27", "center");
      s.text("24 HORAS", 380, 280, 76, "#b8322b", "center");
      for (const [i, line] of [
        "Confirma las condiciones",
        "y cobertura con el negocio.",
        "Tu solicitud no autoriza",
        "una reclamación automática.",
      ].entries())
        s.text(line, 380, 400 + i * 62, 32, "#806e54", "center");
      s.action("call-business", "Llamar · 787-436-6309", 50, 760, 660, 95, {
        color: "#8a6740",
      });
      s.action("order-details", "Volver a mi orden", 100, 885, 560, 75, {
        color: "#e5d8c0",
        text: "#68563e",
      });
      s.commit();
      return;
    }
    s.text(
      v.orderId?.slice(0, 12).toUpperCase() ?? "Mi visita",
      380,
      100,
      47,
      "#413323",
      "center",
    );
    s.text(
      STATUS_LABEL[v.status as OrderStatus] ?? "Prepara tu visita",
      380,
      185,
      38,
      "#a65332",
      "center",
    );
    s.text(
      v.vehicle.kind + " · " + (v.vehicle.plate || ""),
      380,
      255,
      29,
      "#957f60",
      "center",
    );
    for (const [i, task] of v.tasks.slice(0, 5).entries())
      s.text(
        (task.status === "done" ? "✓ " : "○ ") + task.name,
        55,
        340 + i * 57,
        30,
        task.status === "done" ? "#547348" : "#8b7659",
      );
    s.text(
      money(v.total) + " · " + (v.paid ? "Cobro registrado" : "Pago pendiente"),
      380,
      660,
      35,
      "#6a5133",
      "center",
    );
    if (v.demo && v.status !== "delivered")
      s.action("demo-next", "Siguiente paso del ejemplo →", 45, 730, 670, 85, {
        enabled: !v.busy,
      });
    s.action("receipt", "Comprobante", 45, 845, 320, 80, {
      color: "#e2d6be",
      text: "#695138",
    });
    s.action("guarantee", "Garantía", 395, 845, 320, 80, { color: "#b58d53" });
    s.text(
      v.demo
        ? "DEMOSTRACIÓN · no crea una venta"
        : "Estado confirmado por el personal",
      380,
      975,
      22,
      "#a89373",
      "center",
    );
    s.commit();
  }
  private drawStatus() {
    const s = this.statusBoard,
      v = this.view;
    s.paint("#272d2d");
    s.text(
      v.activeOrder?.plate ||
        v.vehicle.plate ||
        v.orderId?.slice(0, 8) ||
        "Tu carro",
      320,
      100,
      53,
      "#f0eadc",
      "center",
    );
    s.text(
      STATUS_LABEL[v.status as OrderStatus] ?? "Tu visita",
      320,
      210,
      38,
      "#e4b05d",
      "center",
    );
    if (v.bay)
      s.text(
        "Cubículo " + String(v.bay).padStart(2, "0"),
        320,
        285,
        29,
        "#b4c2b8",
        "center",
      );
    for (const [i, task] of (v.activeOrder?.tasks ?? v.tasks)
      .slice(0, 3)
      .entries())
      s.text(
        (task.status === "done" ? "✓ " : "• ") + task.name,
        45,
        390 + i * 62,
        26,
        task.status === "done" ? "#b4d398" : "#ead8b8",
      );
    s.action("order-details", "Ver mi orden  →", 60, 650, 520, 90, {
      color: "#9b7848",
    });
    s.commit();
  }
  update(car: T.Vector3, moving: boolean, time: number) {
    this.statusBoard.position.set(car.x + 2.25, 1.5, car.z + 1);
    this.statusBoard.show(
      !!this.view.orderId && !moving && this.view.status !== "delivered",
    );
    this.domRenderer.domElement.style.visibility = this.cssTablet.visible
      ? "visible"
      : "hidden";
    if (this.menu.visible) {
      this.menuObjects[1].rotation.y = Math.sin(time * 0.5) * 0.018;
    }
  }
  render(camera: T.PerspectiveCamera) {
    this.domRenderer.render(this.scene, camera);
  }
  resize(width: number, height: number) {
    this.domRenderer.setSize(width, height);
  }
  toggleServicePage() {
    this.setServicePage(this.mobile ? (this.page + 1) % 6 : this.page ? 0 : 1);
  }
  dispose() {
    this.domRenderer.domElement.remove();
    this.a11y.remove();
    this.cssTablet.removeFromParent();
    for (const s of this.surfaces) {
      s.texture.dispose();
    }
  }
}
