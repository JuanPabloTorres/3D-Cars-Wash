"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  ArrowRight,
  ArrowLeft,
  X,
  RotateCcw,
  Plus,
  Check,
  CarFront,
  Sparkles,
  Armchair,
  ShieldCheck,
  Clock,
  ChevronRight,
  LogIn,
  Settings2,
  ReceiptText,
  Headphones,
  LoaderCircle,
  CircleHelp,
  CheckCircle2,
  ClipboardList,
  Download,
} from "lucide-react";
import {
  CATALOG,
  money,
  quote,
  STATUS_LABEL,
  type OrderStatus,
} from "../lib/domain";
import type { CarWashWorld, Destination } from "../lib/world";
import { sceneForVisit, type VisitScene } from "../lib/visit-view";
type Panel =
  | "reception"
  | "vehicle"
  | "services"
  | "quote"
  | "order"
  | "login"
  | "admin"
  | "guarantee"
  | null;
type Session = {
  name: string;
  email: string;
  isAdmin: boolean;
} | null;
const STAGES = ["requested", "waiting", "working", "ready", "delivered"];
const GUIDANCE: Record<string, string> = {
  requested:
    "Tu solicitud está preparada. El personal confirma tu llegada al local.",
  waiting:
    "Tu vehículo espera asignación. Puedes salir de la web y regresar después.",
  working:
    "El carro y los empleados representan el estado confirmado por el personal.",
  ready:
    "El trabajo está completo. Revisa el cobro con recepción antes de recoger.",
  delivered:
    "Gracias por tu visita. Tu comprobante queda disponible en esta orden.",
  cancelled: "Esta orden se canceló.",
};
export default function Experience() {
  const host = useRef<HTMLDivElement>(null),
    world = useRef<CarWashWorld | null>(null),
    idempotency = useRef(cryptoKey());
  const [ready, setReady] = useState(false),
    [mapMode] = useState(true),
    [sceneOverride, setSceneOverride] = useState<VisitScene | null>(null),
    [syncState, setSyncState] = useState(""),
    [worldError, setWorldError] = useState(""),
    [panel, setPanel] = useState<Panel>(null),
    [intro, setIntro] = useState(true),
    [session, setSession] = useState<Session>(null),
    [catalog, setCatalog] = useState(CATALOG),
    [selected, setSelected] = useState<string[]>([]),
    [serviceIndex, setServiceIndex] = useState(1),
    [vehicle, setVehicle] = useState({
      kind: "SUV",
      color: "Plata",
      plate: "",
    }),
    [order, setOrder] = useState<any>(null),
    [demo, setDemo] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [toast, setToast] = useState(""),
    [myOrders, setMyOrders] = useState<any[]>([]),
    [adminOrders, setAdminOrders] = useState<any[]>([]),
    [adminOrder, setAdminOrder] = useState<any>(null),
    [bay, setBay] = useState(4),
    [method, setMethod] = useState("cash");
  const selectRef = useRef<(id: string) => void>(() => {});
  const note = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 5000);
  }, []);
  const open = useCallback((p: Panel, d?: Destination) => {
    setError("");
    setIntro(false);
    setSceneOverride(null);
    setPanel(p);
    if (d) world.current?.navigate(d);
  }, []);
  selectRef.current = (id: string) => {
    if (id.startsWith("service:")) {
      const serviceId = id.slice(8);
      const index = CATALOG.findIndex((s) => s.id === serviceId);
      if (index >= 0) setServiceIndex(index);
      open("services", "services");
    }
    if (id === "reception") open("reception", "reception");
    if (id === "services") open("services", "services");
    if (id === "vehicle") open(order ? "order" : "vehicle", "vehicle");
    if (id === "lounge") {
      world.current?.navigate("lounge");
      setPanel(null);
      setIntro(false);
      note("Relájate en el lounge o selecciona tu carro para ver su cuidado.");
    }
  };
  useEffect(() => {
    setReady(false);
    setWorldError("");
    let cancelled = false;
    let instance: CarWashWorld | undefined;
    import("../lib/world")
      .then(async ({ CarWashWorld }) => {
        if (cancelled || !host.current) return;
        const loaded = await CarWashWorld.create(host.current, {
          onReady: () => {
            if (!cancelled) setReady(true);
          },
          onSelect: (id) => selectRef.current(id),
          onError: (msg) => note(msg),
        });
        if (cancelled) {
          loaded.dispose();
          return;
        }
        instance = loaded;
        world.current = loaded;
      })
      .catch((e) => {
        console.error("Febles 3D initialization", e);
        if (!cancelled)
          setWorldError(
            "No se pudo cargar el local 3D. Comprueba tu conexión y que WebGL esté disponible.",
          );
      });
    return () => {
      cancelled = true;
      instance?.dispose();
      world.current = null;
    };
  }, [note]);
  useEffect(() => {
    try {
      const draft = JSON.parse(
        sessionStorage.getItem("febles-draft") ?? "null",
      );
      if (draft) {
        if (draft.vehicle) setVehicle(draft.vehicle);
        if (Array.isArray(draft.selected))
          setSelected(
            [
              ...new Set<string>(
                draft.selected.filter((id: string) =>
                  CATALOG.some((s) => s.id === id),
                ),
              ),
            ]
              .filter(
                (id: string) =>
                  id !== "exterior" || !draft.selected.includes("complete"),
              )
              .slice(0, 6),
          );
      }
    } catch {}
    fetch("/api/catalog")
      .then((r) => r.json())
      .then((d: any) => {
        if (d.services) setCatalog(d.services);
      })
      .catch(() =>
        note(
          "Catálogo de ejemplo disponible. No se pudo actualizar desde el servidor.",
        ),
      );
    fetch("/api/session")
      .then((r) => r.json())
      .then((d: any) => setSession(d.user))
      .catch(() => {});
  }, [note]);
  useEffect(() => {
    idempotency.current = cryptoKey();
    try {
      sessionStorage.setItem(
        "febles-draft",
        JSON.stringify({ vehicle, selected }),
      );
    } catch {}
    world.current?.setSelected(selected);
  }, [vehicle, selected]);
  const loadOrders = useCallback(async () => {
    if (!session) return;
    try {
      const r = await fetch("/api/orders");
      const d: any = await r.json();
      if (!r.ok) throw new Error(d.error);
      setMyOrders(d.orders ?? []);
      const active = (d.orders ?? []).find(
        (o: any) => !["delivered", "cancelled"].includes(o.status),
      );
      if (active) {
        const detail = await fetch("/api/orders/" + active.id);
        if (detail.ok) {
          const restored: any = await detail.json();
          setOrder((existing: any) => existing ?? restored.order);
        }
      }
    } catch (e) {
      note((e as Error).message);
    }
  }, [session, note]);
  useEffect(() => {
    if (session) loadOrders();
  }, [session, loadOrders]);
  useEffect(() => {
    if (!ready) return;
    if (order) {
      world.current?.setOrderStatus(order.status, order.bay);
      world.current?.setVehicleColor(order.color);
      world.current?.setVehicleKind(order.kind);
      world.current?.setVisitDetails(order.plate, order.tasks ?? []);
    } else {
      world.current?.resetVisit();
      world.current?.setVehicleColor(vehicle.color);
      world.current?.setVehicleKind(vehicle.kind);
      world.current?.setVisitDetails(vehicle.plate, []);
    }
    world.current?.setSelected(selected);
  }, [order, ready, vehicle.color, vehicle.kind, vehicle.plate, selected]);
  useEffect(() => {
    if (!order || demo) return;
    const id = order.id;
    const tick = window.setInterval(async () => {
      try {
        const r = await fetch("/api/orders/" + id);
        if (r.ok) {
          const d: any = await r.json();
          setOrder(d.order);
          setSyncState("");
        } else
          setSyncState(
            "No se pudo actualizar el estado. Mostramos el último confirmado.",
          );
      } catch {
        setSyncState("Sin conexión. Mostramos el último estado confirmado.");
      }
    }, 15000);
    return () => window.clearInterval(tick);
  }, [order?.id, demo]);
  useEffect(() => {
    if (ready && panel === "services")
      world.current?.focusService(catalog[serviceIndex].id);
  }, [ready, panel, serviceIndex, catalog]);
  useEffect(() => {
    if (ready) world.current?.setInteraction(!!panel);
  }, [ready, panel]);
  const toggleService = (id: string) => {
    idempotency.current = cryptoKey();
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [
            ...prev.filter(
              (x) =>
                !(id === "complete" && x === "exterior") &&
                !(id === "exterior" && x === "complete"),
            ),
            id,
          ],
    );
  };
  const q = selected.length
    ? quote(selected)
    : { items: [], total: 0, tasks: [] };
  const startDemo = () => {
    if (!selected.length) {
      setSelected(["complete", "lights"]);
    }
    const chosen = selected.length ? selected : ["complete", "lights"];
    const plan = quote(chosen);
    setDemo(true);
    const now = Date.now();
    setOrder({
      id: "DEMO-0104",
      status: "requested",
      payment_status: "pending",
      total: plan.total,
      kind: vehicle.kind,
      color: vehicle.color,
      plate: vehicle.plate || "DEMO",
      created_at: now,
      version: 1,
      items: plan.items,
      tasks: plan.tasks.map((name, i) => ({
        id: "demo-" + i,
        name,
        status: "pending",
      })),
      events: [{ action: "Recorrido de ejemplo iniciado", created_at: now }],
    });
    open("order", "vehicle");
  };
  const demoNext = () => {
    setPanel(null);
    setIntro(false);
    world.current?.navigate("vehicle");
    setOrder((o: any) => {
      let n = {
          ...o,
          tasks: o.tasks.map((t: any) => ({ ...t })),
          events: [...o.events],
        },
        label = "";
      if (o.status === "requested") {
        n.status = "waiting";
        label = "Llegada confirmada · ejemplo";
      } else if (o.status === "waiting") {
        n.status = "working";
        n.bay = 4;
        label = "Asignado al cubículo 04 · ejemplo";
      } else if (o.status === "working") {
        const task = n.tasks.find((t: any) => t.status !== "done");
        if (task) {
          task.status = "done";
          label = "Completado: " + task.name;
        } else {
          n.status = "ready";
          label = "Trabajo completado · ejemplo";
        }
      } else if (o.status === "ready" && o.payment_status !== "paid") {
        n.payment_status = "paid";
        label = "Cobro de demostración, sin movimiento de dinero";
      } else if (o.status === "ready") {
        n.status = "delivered";
        label = "Vehículo entregado · ejemplo";
      }
      n.events.push({ action: label, created_at: Date.now() });
      return n;
    });
  };
  const saveOrder = async () => {
    if (!session) {
      open("login");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotency.current,
        },
        body: JSON.stringify({
          vehicle: { ...vehicle, plate: vehicle.plate.toUpperCase() },
          services: selected,
        }),
      });
      const d: any = await r.json();
      if (!r.ok) throw new Error(d.error);
      setOrder(d.order);
      setDemo(false);
      setPanel("order");
      world.current?.navigate("vehicle");
      loadOrders();
      note("Solicitud guardada. La llegada debe confirmarse en el local.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const selectOrder = async (id: string, admin = false) => {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/orders/" + id);
      const d: any = await r.json();
      if (!r.ok) throw new Error(d.error);
      if (admin) setAdminOrder(d.order);
      else {
        setDemo(false);
        setOrder(d.order);
        open("order", "vehicle");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const showAdmin = async () => {
    open("admin");
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/orders?scope=admin");
      const d: any = await r.json();
      if (!r.ok) throw new Error(d.error);
      setAdminOrders(d.orders);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const adminAction = async (
    action: string,
    extra: Record<string, unknown> = {},
  ) => {
    if (!adminOrder) return;
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/orders/" + adminOrder.id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, version: adminOrder.version, ...extra }),
      });
      const d: any = await r.json();
      if (!r.ok) throw new Error(d.error);
      setAdminOrder(d.order);
      note("Operación registrada.");
    } catch (e) {
      setError((e as Error).message);
      await selectOrder(adminOrder.id, true);
    } finally {
      setBusy(false);
    }
  };
  const receipt = () => {
    if (!order) return;
    const text = `FEBLES CAR WASH\n${demo ? "DEMOSTRACIÓN · SIN VALOR FISCAL" : "SOLICITUD · PRECIOS ILUSTRATIVOS"}\nOrden ${order.id}\nVehículo: ${order.kind} · ${order.plate}\n\n${order.items.map((i: any) => i.name + " " + money(i.price)).join("\n")}\nTotal: ${money(order.total)}\nEstado: ${STATUS_LABEL[order.status as OrderStatus]}\nPago: ${order.payment_status === "paid" ? "Registrado" : "Pendiente"}\n\nGarantía de lluvia anunciada: 24 horas. Condiciones pendientes de aprobación.\nCalle Villa, Ponce · 787-436-6309`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([text], { type: "text/plain;charset=utf-8" }),
    );
    a.download = "Febles-" + order.id.slice(0, 8) + ".txt";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const go = (destination: Destination) => {
    world.current?.navigate(destination);
    setPanel(null);
    setIntro(false);
    setSceneOverride(
      destination === "lounge"
        ? "waiting"
        : destination === "services"
          ? "services"
          : destination === "overview"
            ? "entrance"
            : null,
    );
  };
  const close = () => {
    setPanel(null);
    setError("");
  };
  useEffect(() => {
    if (!panel) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPanel(null);
        setError("");
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [panel]);
  const scene = sceneOverride ?? sceneForVisit(panel, order?.status, !intro);
  const currentService = catalog[serviceIndex];
  return (
    <main
      className={
        "experience " +
        (mapMode ? "map-mode" : "store-mode") +
        (panel ? " has-panel" : "")
      }
      data-scene={scene}
    >
      <div className="world-host" ref={host} />
      <div className="world-vignette" />
      {mapMode && !ready && !worldError && (
        <div className="loading-world">
          <div className="logo-mark">
            f<span>c</span>
          </div>
          <h1>Estamos preparando tu visita.</h1>
          <p>Recepción, empleados y carros. Todo cobra vida.</p>
          <span className="loading-track" />
          <small>CARGANDO EL LOCAL 3D</small>
        </div>
      )}
      {mapMode && worldError && (
        <div className="loading-world">
          <CarFront size={45} />
          <h1>Necesitamos volver a encender el motor.</h1>
          <p>{worldError}</p>
          <button className="primary" onClick={() => location.reload()}>
            Intentar de nuevo
          </button>
        </div>
      )}
      {ready && (
        <>
          {!intro && (
            <button
              className="return-to-world"
              onClick={() => go("overview")}
              aria-label="Volver a la entrada"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <button
            className="account-orb"
            onClick={() => open(session ? "reception" : "login")}
            aria-label={session ? "Mi cuenta y visitas" : "Entrar a mi cuenta"}
            title={session ? session.name : "Mi cuenta"}
          >
            {session ? (
              session.name.charAt(0).toUpperCase()
            ) : (
              <LogIn size={18} />
            )}
          </button>
          {intro && !panel && !order && (
            <div className="arrival-caption">
              <p>Bienvenido a Febles.</p>
              <button onClick={() => open("reception", "reception")}>
                Tu anfitriona te espera en recepción <ArrowRight size={17} />
              </button>
              <small>Selecciona una persona, un objeto o tu carro.</small>
            </div>
          )}
          {!intro && !panel && !order && (
            <button
              className="scene-return"
              onClick={() => open("reception", "reception")}
            >
              ¿Te ayudamos en recepción? <ArrowRight size={15} />
            </button>
          )}
          {order && !panel && (
            <div className="visit-caption" aria-live="polite">
              <button
                className="vehicle-caption"
                onClick={() => open("order", "vehicle")}
              >
                <span className="caption-indicator" />
                <span>
                  <small>
                    {demo ? "RECORRIDO DE EJEMPLO" : "TU VEHÍCULO"} ·{" "}
                    {order.plate}
                  </small>
                  <strong>
                    {STATUS_LABEL[order.status as OrderStatus]}
                    {order.bay && order.status === "working"
                      ? " · Cubículo " + String(order.bay).padStart(2, "0")
                      : ""}
                  </strong>
                </span>
                <ArrowRight size={17} />
              </button>
              {demo && order.status !== "delivered" && (
                <button className="demo-step" onClick={demoNext}>
                  Siguiente paso del ejemplo <ArrowRight size={15} />
                </button>
              )}
              {syncState && (
                <p className="sync-warning" role="status">
                  {syncState}
                </p>
              )}
            </div>
          )}
        </>
      )}
      {panel && (
        <div
          className={
            "panel-position panel-" +
            panel +
            " " +
            (panel === "admin" ? "admin-position" : "")
          }
        >
          <section
            className={
              "interaction-panel " + (panel === "admin" ? "admin-panel" : "")
            }
            role="dialog"
            aria-label={
              panel === "admin" ? "Administración" : "Interacción en el local"
            }
          >
            <button className="close-panel" onClick={close} aria-label="Cerrar">
              <X size={18} />
            </button>
            {panel === "reception" && (
              <>
                <div className="overline">RECEPCIÓN · TU ANFITRIONA</div>
                <h2>¡Hola! ¿Qué hacemos por tu carro?</h2>
                <div className="reception-options">
                  <button
                    onClick={() => open(order ? "order" : "vehicle", "vehicle")}
                  >
                    <CarFront size={19} />
                    <span>{order ? "Ver mi carro" : "Preparar mi visita"}</span>
                    <ArrowRight size={15} />
                  </button>
                  <button onClick={() => open("services", "services")}>
                    <Sparkles size={19} />
                    <span>Conocer los servicios</span>
                    <ArrowRight size={15} />
                  </button>
                  <button onClick={() => go("lounge")}>
                    <Armchair size={19} />
                    <span>Pasar al lounge</span>
                    <ArrowRight size={15} />
                  </button>
                  <button
                    onClick={() => {
                      if (session) loadOrders();
                      else open("login");
                    }}
                  >
                    <ReceiptText size={19} />
                    <span>Mis visitas guardadas</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
                {myOrders.length > 0 && (
                  <div className="saved-orders">
                    {myOrders.slice(0, 3).map((o) => (
                      <button key={o.id} onClick={() => selectOrder(o.id)}>
                        {o.plate} · {STATUS_LABEL[o.status as OrderStatus]}
                        <ChevronRight size={14} />
                      </button>
                    ))}
                  </div>
                )}
                <div className="conversation-links">
                  <button className="subtle-link" onClick={startDemo}>
                    Vivir el recorrido de ejemplo <ArrowRight size={13} />
                  </button>
                  {session?.isAdmin && (
                    <button className="subtle-link" onClick={showAdmin}>
                      <Settings2 size={14} />
                      Administrar local
                    </button>
                  )}
                </div>
              </>
            )}
            {panel === "vehicle" && (
              <>
                <div className="overline">01 / TU VISITA</div>
                <h2>Este es tu carro.</h2>
                <p className="panel-copy">
                  Elige el color y el modelo que representarán tu vehículo.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    open("services", "services");
                  }}
                >
                  <label>
                    Tipo de vehículo
                    <select
                      value={vehicle.kind}
                      onChange={(e) =>
                        setVehicle({ ...vehicle, kind: e.target.value })
                      }
                    >
                      {["Sedán", "SUV", "Pickup", "Compacto"].map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Color
                    <div className="color-picker">
                      {[
                        { n: "Plata", c: "#bdc8bd" },
                        { n: "Rojo", c: "#d95f4e" },
                        { n: "Azul", c: "#6592ad" },
                        { n: "Negro", c: "#3a4741" },
                        { n: "Blanco", c: "#f3ebdc" },
                      ].map((x) => (
                        <button
                          type="button"
                          key={x.n}
                          title={x.n}
                          aria-label={x.n}
                          aria-pressed={vehicle.color === x.n}
                          style={{ background: x.c }}
                          className={vehicle.color === x.n ? "chosen" : ""}
                          onClick={() => {
                            setVehicle({ ...vehicle, color: x.n });
                            world.current?.setVehicleColor(x.n);
                          }}
                        >
                          {vehicle.color === x.n && <Check size={18} />}
                        </button>
                      ))}
                    </div>
                    <small className="field-hint">
                      {vehicle.color}
                      {vehicle.kind === "Pickup"
                        ? " · Representación visual SUV provisional"
                        : ""}
                    </small>
                  </label>
                  <label>
                    Tablilla o identificador
                    <input
                      maxLength={12}
                      required
                      minLength={2}
                      pattern="[A-Za-z0-9 \-]+"
                      value={vehicle.plate}
                      onChange={(e) => {
                        idempotency.current = cryptoKey();
                        setVehicle({
                          ...vehicle,
                          plate: e.target.value.toUpperCase(),
                        });
                      }}
                      placeholder="Ej. DEMO-01"
                      autoComplete="off"
                    />
                  </label>
                  <div className="mini-note">
                    <Clock size={16} />
                    <span>
                      Esto prepara tu solicitud. La llegada física se confirma
                      en recepción.
                    </span>
                  </div>
                  <button className="primary full" type="submit">
                    Vamos a los servicios <ArrowRight size={16} />
                  </button>
                </form>
              </>
            )}
            {panel === "services" && (
              <>
                <div className="overline">EL TALLER DE SERVICIOS</div>
                <div className="service-carousel">
                  <div className="carousel-controls">
                    <button
                      aria-label="Servicio anterior"
                      onClick={() =>
                        setServiceIndex(
                          (serviceIndex + catalog.length - 1) % catalog.length,
                        )
                      }
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <span>
                      0{serviceIndex + 1} <i>/ 0{catalog.length}</i>
                    </span>
                    <button
                      aria-label="Servicio siguiente"
                      onClick={() =>
                        setServiceIndex((serviceIndex + 1) % catalog.length)
                      }
                    >
                      <ArrowRight size={16} />
                    </button>
                  </div>
                  <h2>{currentService.name}</h2>
                  <p>{currentService.description}</p>
                  <div className="service-price">
                    <strong>{money(currentService.price)}</strong>
                    <span>
                      <Clock size={12} /> ~{currentService.minutes} min
                    </span>
                  </div>
                  <button
                    className={
                      "add-service " +
                      (selected.includes(currentService.id) ? "selected" : "")
                    }
                    onClick={() => toggleService(currentService.id)}
                  >
                    {selected.includes(currentService.id) ? (
                      <>
                        <Check size={17} />
                        Seleccionado · quitar
                      </>
                    ) : (
                      <>
                        <Plus size={17} />
                        Agregar a mi visita
                      </>
                    )}
                  </button>
                </div>
                <div className="service-dots">
                  {catalog.map((s, i) => (
                    <button
                      key={s.id}
                      aria-label={"Ver " + s.name}
                      className={
                        (i === serviceIndex ? "current " : "") +
                        (selected.includes(s.id) ? "picked" : "")
                      }
                      onClick={() => setServiceIndex(i)}
                    />
                  ))}
                </div>
                <div className="selection-summary">
                  <span>
                    {selected.length} servicio{selected.length !== 1 ? "s" : ""}{" "}
                    <b>{money(q.total)}</b>
                  </span>
                  <button
                    disabled={!selected.length}
                    className="primary"
                    onClick={() => {
                      if (!vehicle.plate) open("vehicle", "vehicle");
                      else open("quote", "reception");
                    }}
                  >
                    Revisar <ArrowRight size={15} />
                  </button>
                </div>
                <p className="pricing-note">
                  Precios y tiempos de ejemplo. No son tarifas oficiales.
                </p>
              </>
            )}
            {panel === "quote" && (
              <>
                <div className="overline">03 / ANTES DE EMPEZAR</div>
                <h2>Tu visita, lista.</h2>
                <div className="paper-receipt">
                  <div className="receipt-brand">
                    FEBLES <small>CAR WASH</small>
                  </div>
                  <div className="receipt-vehicle">
                    <CarFront size={16} />
                    {vehicle.kind} · {vehicle.color} · {vehicle.plate}
                  </div>
                  {q.items.map((s) => (
                    <div className="receipt-line" key={s.id}>
                      <span>{s.name}</span>
                      <b>{money(s.price)}</b>
                    </div>
                  ))}
                  <div className="receipt-total">
                    <span>Total ilustrativo</span>
                    <strong>{money(q.total)}</strong>
                  </div>
                  <small>
                    Sin cobro en línea · Configuración fiscal pendiente
                  </small>
                </div>
                <p className="panel-copy small-copy">
                  Guardar crea una solicitud. Recepción confirma tu llegada y la
                  aceptación operativa del servicio.
                </p>
                <button
                  className="primary full"
                  onClick={saveOrder}
                  disabled={busy || !selected.length}
                >
                  {busy ? (
                    <LoaderCircle className="spin" size={17} />
                  ) : (
                    <Check size={17} />
                  )}{" "}
                  {session
                    ? "Guardar solicitud"
                    : "Entrar y guardar mi solicitud"}
                </button>
                <button
                  className="secondary full"
                  onClick={() => open("services", "services")}
                >
                  Cambiar servicios
                </button>
                <button className="subtle-link" onClick={startDemo}>
                  Ver el recorrido como demostración <ArrowRight size={13} />
                </button>
              </>
            )}
            {panel === "login" && (
              <>
                <div className="login-emblem">
                  <ShieldCheck size={36} />
                </div>
                <div className="overline">TU VISITA, BIEN GUARDADA</div>
                <h2>Entra con confianza.</h2>
                <p className="panel-copy">
                  Accede de forma segura para guardar y recuperar tus
                  solicitudes desde otro dispositivo.
                </p>
                <a
                  className="primary full"
                  href="/signin-with-chatgpt?return_to=/"
                  target="_top"
                >
                  <LogIn size={17} />
                  Continuar con ChatGPT
                </a>
                <p className="login-explain">
                  Este acceso privado utiliza tu cuenta autenticada. Febles no
                  recibe ni guarda tu contraseña.
                </p>
                <div className="mini-note">
                  <ShieldCheck size={18} />
                  <span>
                    El acceso por código de email requiere configurar un
                    remitente verificado. Todavía no está activo.
                  </span>
                </div>
                <button
                  className="secondary full"
                  onClick={() => {
                    close();
                    go("overview");
                  }}
                >
                  Seguir explorando
                </button>
              </>
            )}
            {panel === "order" && order && (
              <>
                <div className="overline">
                  {demo ? "RECORRIDO DE DEMOSTRACIÓN" : "TU SOLICITUD GUARDADA"}
                </div>
                <div className={"order-status status-" + order.status}>
                  <span />
                  {STATUS_LABEL[order.status as OrderStatus]}
                </div>
                <h2>
                  {order.status === "delivered"
                    ? "Gracias por confiar."
                    : "El cuidado de tu carro."}
                </h2>
                <div className="order-identity">
                  <CarFront size={18} />
                  <span>
                    {order.kind} · {order.plate}
                  </span>
                  <small>#{order.id.slice(0, 8).toUpperCase()}</small>
                </div>
                <div className="journey-stages">
                  {STAGES.map((s, i) => (
                    <span
                      key={s}
                      className={
                        STAGES.indexOf(order.status) >= i ? "done" : ""
                      }
                      title={STATUS_LABEL[s as OrderStatus]}
                    >
                      {STAGES.indexOf(order.status) > i ? (
                        <Check size={12} />
                      ) : (
                        i + 1
                      )}
                    </span>
                  ))}
                </div>
                <p className="panel-copy small-copy">
                  {GUIDANCE[order.status]}
                </p>
                <div className="task-list">
                  {order.tasks.map((task: any, i: number) => (
                    <div key={task.id}>
                      <span
                        className={
                          task.status === "done" ? "task-done" : "task-dot"
                        }
                      >
                        {task.status === "done" ? <Check size={11} /> : i + 1}
                      </span>
                      <span>{task.name}</span>
                      <small>
                        {task.status === "done"
                          ? "Listo"
                          : order.status === "working" &&
                              order.tasks.find((t: any) => t.status !== "done")
                                ?.id === task.id
                            ? "En curso"
                            : "Pendiente"}
                      </small>
                    </div>
                  ))}
                </div>
                <div className="order-amount">
                  <span>
                    Total ilustrativo <b>{money(order.total)}</b>
                  </span>
                  <small
                    className={order.payment_status === "paid" ? "paid" : ""}
                  >
                    {order.payment_status === "paid"
                      ? "Cobro registrado"
                      : "Pago pendiente"}
                  </small>
                </div>
                {demo && order.status !== "delivered" && (
                  <button className="primary full" onClick={demoNext}>
                    {order.status === "requested"
                      ? "Simular llegada"
                      : order.status === "waiting"
                        ? "Simular asignación"
                        : order.status === "working"
                          ? order.tasks.some((t: any) => t.status !== "done")
                            ? "Completar siguiente tarea"
                            : "Finalizar trabajo"
                          : order.payment_status !== "paid"
                            ? "Simular cobro"
                            : "Simular entrega"}
                    <ArrowRight size={16} />
                  </button>
                )}
                {demo && (
                  <p className="pricing-note">
                    Demostración local. No guarda una venta ni mueve dinero.
                  </p>
                )}
                <div className="order-actions">
                  <button className="secondary" onClick={receipt}>
                    <Download size={15} />
                    Comprobante
                  </button>
                  <button
                    className="secondary"
                    onClick={() => open("guarantee")}
                  >
                    <ShieldCheck size={15} />
                    Garantía
                  </button>
                </div>
                {demo && order.status === "delivered" && (
                  <button
                    className="subtle-link"
                    onClick={() => {
                      setOrder(null);
                      setDemo(false);
                      go("overview");
                      setIntro(true);
                    }}
                  >
                    Volver a la entrada <ArrowRight size={13} />
                  </button>
                )}
              </>
            )}
            {panel === "guarantee" && (
              <>
                <div className="login-emblem">
                  <ShieldCheck size={36} />
                </div>
                <div className="overline">UN POCO MÁS DE TRANQUILIDAD</div>
                <h2>¿Llegó la lluvia?</h2>
                <p className="panel-copy">
                  Febles anuncia una garantía de lluvia de 24 horas.
                </p>
                <div className="mini-note">
                  <CircleHelp size={18} />
                  <span>
                    El inicio del plazo, los servicios cubiertos y los usos
                    permitidos deben confirmarse con el negocio. Esta versión no
                    autoriza reclamaciones automáticamente.
                  </span>
                </div>
                <a href="tel:7874366309" className="primary full">
                  <Headphones size={17} />
                  Consultar con Febles
                </a>
                <button
                  className="secondary full"
                  onClick={() => open(order ? "order" : "reception")}
                >
                  Volver a mi visita
                </button>
              </>
            )}
            {panel === "admin" && (
              <>
                <div className="overline">OPERACIÓN / ACCESO AUTORIZADO</div>
                <h2>El local, en tus manos.</h2>
                <p className="panel-copy small-copy">
                  Solicitudes reales guardadas · Catálogo e importes
                  ilustrativos
                </p>
                <div className="admin-layout">
                  <div className="admin-list">
                    <button className="subtle-link" onClick={showAdmin}>
                      <RotateCcw size={13} />
                      Actualizar
                    </button>
                    {!adminOrders.length && !busy && (
                      <div className="empty-orders">
                        <ClipboardList size={30} />
                        <p>Aún no hay solicitudes.</p>
                        <small>
                          Guarda una visita para probar el flujo completo.
                        </small>
                      </div>
                    )}
                    {adminOrders.map((o) => (
                      <button
                        key={o.id}
                        onClick={() => selectOrder(o.id, true)}
                        className={adminOrder?.id === o.id ? "selected" : ""}
                      >
                        <strong>
                          {o.plate}
                          <small>
                            {o.kind} · {money(o.total)}
                          </small>
                        </strong>
                        <span>{STATUS_LABEL[o.status as OrderStatus]}</span>
                        <ChevronRight size={14} />
                      </button>
                    ))}
                  </div>
                  <div className="admin-detail">
                    {adminOrder ? (
                      <>
                        <h3>
                          {adminOrder.plate}{" "}
                          <small>#{adminOrder.id.slice(0, 8)}</small>
                        </h3>
                        <p>
                          {STATUS_LABEL[adminOrder.status as OrderStatus]} ·{" "}
                          {adminOrder.payment_status === "paid"
                            ? "Cobrado"
                            : "Pago pendiente"}
                        </p>
                        <div className="task-list">
                          {adminOrder.tasks.map((t: any) => (
                            <div key={t.id}>
                              <span
                                className={
                                  t.status === "done" ? "task-done" : "task-dot"
                                }
                              >
                                {t.status === "done" ? (
                                  <Check size={11} />
                                ) : (
                                  <Clock size={11} />
                                )}
                              </span>
                              <span>{t.name}</span>
                            </div>
                          ))}
                        </div>
                        {adminOrder.status === "requested" && (
                          <button
                            className="primary full"
                            disabled={busy}
                            onClick={() => adminAction("arrive")}
                          >
                            Confirmar llegada física
                          </button>
                        )}
                        {adminOrder.status === "waiting" && (
                          <>
                            <label>
                              Cubículo
                              <select
                                value={bay}
                                onChange={(e) => setBay(Number(e.target.value))}
                              >
                                {[1, 2, 3, 4, 5].map((n) => (
                                  <option key={n} value={n}>
                                    Cubículo 0{n}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <button
                              className="primary full"
                              disabled={busy}
                              onClick={() => adminAction("start", { bay })}
                            >
                              Asignar e iniciar trabajo
                            </button>
                          </>
                        )}
                        {adminOrder.status === "working" &&
                          (adminOrder.tasks.some(
                            (t: any) => t.status !== "done",
                          ) ? (
                            <button
                              className="primary full"
                              disabled={busy}
                              onClick={() =>
                                adminAction("task", {
                                  taskId: adminOrder.tasks.find(
                                    (t: any) => t.status !== "done",
                                  ).id,
                                })
                              }
                            >
                              Completar siguiente tarea
                            </button>
                          ) : (
                            <button
                              className="primary full"
                              disabled={busy}
                              onClick={() => adminAction("ready")}
                            >
                              Confirmar trabajo terminado
                            </button>
                          ))}
                        {adminOrder.status === "ready" &&
                          (adminOrder.payment_status !== "paid" ? (
                            <>
                              <label>
                                Medio de cobro manual
                                <select
                                  value={method}
                                  onChange={(e) => setMethod(e.target.value)}
                                >
                                  <option value="cash">Efectivo</option>
                                  <option value="external-card">
                                    Tarjeta en terminal externa
                                  </option>
                                  <option value="other">Otro</option>
                                </select>
                              </label>
                              <button
                                className="primary full"
                                disabled={busy}
                                onClick={() => adminAction("pay", { method })}
                              >
                                Registrar {money(adminOrder.total)}
                              </button>
                              <p className="pricing-note">
                                Registra un cobro efectuado fuera de esta web.
                                No procesa tarjetas.
                              </p>
                            </>
                          ) : (
                            <button
                              className="primary full"
                              disabled={busy}
                              onClick={() => adminAction("deliver")}
                            >
                              Confirmar entrega
                            </button>
                          ))}
                        {["requested", "waiting"].includes(
                          adminOrder.status,
                        ) && (
                          <button
                            className="subtle-link"
                            disabled={busy}
                            onClick={() => {
                              if (
                                confirm(
                                  "¿Cancelar esta solicitud? Quedará registrada en el historial.",
                                )
                              )
                                adminAction("cancel");
                            }}
                          >
                            Cancelar solicitud
                          </button>
                        )}
                        <div className="event-log">
                          {adminOrder.events.map((e: any, i: number) => (
                            <p key={i}>
                              <span>
                                {new Date(e.created_at).toLocaleTimeString(
                                  "es-PR",
                                  {
                                    timeZone: "America/Puerto_Rico",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </span>
                              {e.action}
                            </p>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="empty-orders">
                        <CarFront size={34} />
                        <p>Selecciona una solicitud.</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            {busy && panel === "admin" && (
              <p className="busy-note">
                <LoaderCircle size={14} className="spin" />
                Actualizando…
              </p>
            )}
          </section>
        </div>
      )}
      {toast && (
        <div className="world-toast" role="status">
          <CheckCircle2 size={17} />
          {toast}
          <button onClick={() => setToast("")} aria-label="Cerrar aviso">
            <X size={14} />
          </button>
        </div>
      )}
    </main>
  );
}
function cryptoKey() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : "draft-" + Date.now() + "-" + Math.random().toString(36).slice(2);
}
