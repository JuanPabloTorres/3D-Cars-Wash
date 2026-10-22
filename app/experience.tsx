"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  ArrowLeft,
  X,
  RotateCcw,
  Check,
  CarFront,
  ShieldCheck,
  Clock,
  ChevronRight,
  LogIn,
  LoaderCircle,
  ClipboardList,
} from "lucide-react";
import {
  CATALOG,
  money,
  quote,
  STATUS_LABEL,
  type OrderStatus,
} from "../lib/domain";
import type { OperationSnapshot } from "../lib/operation-view";
import { VEHICLE_KINDS, type AvatarSex } from "../lib/appearance";
import type { CarWashWorld, Destination } from "../lib/world";
import { sceneForVisit, type VisitScene } from "../lib/visit-view";
type Panel =
  | "reception"
  | "vehicle"
  | "profile"
  | "services"
  | "quote"
  | "order"
  | "login"
  | "admin"
  | "saved"
  | "guarantee"
  | null;
type Session = {
  name: string;
  email: string;
  isAdmin: boolean;
  avatarSex: AvatarSex|null;
} | null;
export default function Experience() {
  const host = useRef<HTMLDivElement>(null),
    world = useRef<CarWashWorld | null>(null),
    idempotency = useRef(cryptoKey());
  const [ready, setReady] = useState(false),
    [sceneOverride, setSceneOverride] = useState<VisitScene | null>(null),
    [syncState, setSyncState] = useState(""),
    [worldError, setWorldError] = useState(""),
    [panel, setPanel] = useState<Panel>(null),
    [intro, setIntro] = useState(true),
    [session, setSession] = useState<Session>(null),
    [catalog, setCatalog] = useState(CATALOG),
    [selected, setSelected] = useState<string[]>([]),
    [vehicle, setVehicle] = useState({
      kind: "SUV",
      color: "Plata",
      plate: "",
    }),
    [operation,setOperation] = useState<OperationSnapshot|undefined>(),
    [avatarSex,setAvatarSex] = useState<AvatarSex>("male"),
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
  const [tabletHost, setTabletHost] = useState<HTMLElement | null>(null);
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
      toggleService(id.slice(8));
      open("services", "services");
      return;
    }
    if (id.startsWith("saved:")) {
      selectOrder(id.slice(6));
      return;
    }
    switch (id) {
      case "world-focus":
        setIntro(false);setPanel(null);break;
      case "enter":
        setIntro(false);setPanel(null);world.current?.enter();break;
      case "profile":
        open("profile","vehicle");break;
      case "reception":
        open("reception", "reception");
        break;
      case "services":
        open("services", "services");
        break;
      case "vehicle":
        open(order ? "order" : "vehicle", "vehicle");
        break;
      case "lounge":
        go("lounge");
        break;
      case "overview":
        go("overview");
        break;
      case "review":
        open(
          vehicle.plate ? "quote" : "vehicle",
          vehicle.plate ? "reception" : "vehicle",
        );
        break;
      case "change-services":
        open("services", "services");
        break;
      case "save-order":
        saveOrder();
        break;
      case "demo":
        startDemo();
        break;
      case "demo-next":
        demoNext();
        break;
      case "receipt":
        receipt();
        break;
      case "guarantee":
        open("guarantee", "reception");
        break;
      case "order-details":
        open(order ? "order" : "reception", order ? "vehicle" : "reception");
        break;
      case "call-business":
        location.href = "tel:7874366309";
        break;
      case "admin":
        showAdmin();
        break;
      case "my-orders":
        if (demo && order) open("order", "vehicle");
        else if (session) {
          loadOrders();
          open("saved", "reception");
        } else open("login");
        break;
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
        setTabletHost(loaded.getTabletHost());
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
        if (draft.vehicle && VEHICLE_KINDS.includes(draft.vehicle.kind)) setVehicle(draft.vehicle);
        if (["male","female"].includes(draft.avatarSex)) setAvatarSex(draft.avatarSex);
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
      .then((d: any) => {setSession(d.user);if(d.user?.avatarSex) setAvatarSex(d.user.avatarSex);})
      .catch(() => {});
  }, [note]);
  useEffect(() => {
    idempotency.current = cryptoKey();
    try {
      sessionStorage.setItem(
        "febles-draft",
        JSON.stringify({ vehicle, selected, avatarSex }),
      );
    } catch {}
  }, [vehicle, selected, avatarSex]);
  useEffect(()=>{
    let cancelled=false;
    const update=async()=>{try{const response=await fetch("/api/local");if(!response.ok)throw new Error();const data=await response.json() as OperationSnapshot;if(!cancelled)setOperation(data);}catch{if(!cancelled)setOperation(previous=>previous?{...previous,stale:true}:undefined);}};
    update();const timer=window.setInterval(update,15000);
    return()=>{cancelled=true;window.clearInterval(timer);};
  },[]);
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
  useEffect(() => {
    if (!ready) return;
    world.current?.setExperienceView({
      panel,
      intro,
      avatarSex,
      operation,
      selected,
      vehicle:
        order && !["quote", "vehicle", "services"].includes(panel ?? "")
          ? { kind: order.kind, color: order.color, plate: order.plate }
          : vehicle,
      total:
        order && !["quote", "vehicle", "services"].includes(panel ?? "")
          ? order.total
          : q.total,
      items:
        order && !["quote", "vehicle", "services"].includes(panel ?? "")
          ? order.items
          : q.items,
      tasks: order?.tasks ?? [],
      orderId: order?.id,
      status: order?.status,
      bay: order?.bay,
      paid: order?.payment_status === "paid",
      demo,
      busy,
      catalog,
      session: !!session,
      admin: !!session?.isAdmin,
      saved: myOrders,
      activeOrder: order
        ? { plate: order.plate, tasks: order.tasks }
        : undefined,
    });
  }, [
    ready,
    panel,
    intro,
    selected,
    vehicle,
    order,
    demo,
    busy,
    session,
    myOrders,
    catalog,
    avatarSex,
    operation,
  ]);
  useEffect(() => {
    if (ready && order && intro) {
      setIntro(false);
      world.current?.navigate("vehicle");
    }
  }, [ready, order, intro]);
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
  const saveProfile = async () => {
    if(!session || session.avatarSex===avatarSex) return;
    const response=await fetch("/api/profile",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({avatarSex})});
    const data=await response.json() as {avatarSex:AvatarSex;error?:string};
    if(!response.ok) throw new Error(data.error??"No se pudo guardar el personaje.");
    setSession(prev=>prev?{...prev,avatarSex:data.avatarSex}:null);
  };
  const saveOrder = async () => {
    if (!session) {
      open("login");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await saveProfile();
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
  return (
    <main className="experience spatial-store" data-scene={scene}>
      <div className="world-host" ref={host} />
      {!ready && !worldError && (
        <div className="loading-world">
          <div className="logo-mark">
            f<span>c</span>
          </div>
          <h1>Estamos preparando tu visita.</h1>
          <p>Un local vivo. Tu carro, tu recorrido.</p>
          <span className="loading-track" />
          <small>CARGANDO EL LOCAL 3D</small>
        </div>
      )}
      {worldError && (
        <div className="loading-world">
          <CarFront size={45} />
          <h1>No pudimos abrir el local 3D.</h1>
          <p>{worldError}</p>
          <button className="primary" onClick={() => location.reload()}>
            Intentar de nuevo
          </button>
        </div>
      )}
      {ready && (
        <>
          <button
            className="return-to-world"
            onClick={() => {
              if (panel) close();
              go("overview");
            }}
            aria-label="Volver a la entrada"
          >
            <ArrowLeft size={18} />
          </button>
          <button
            className="account-orb"
            onClick={() => open(session ? "profile" : "login", session ? "vehicle" : "reception")}
            aria-label="Mi cuenta"
          >
            {session ? (
              session.name.charAt(0).toUpperCase()
            ) : (
              <LogIn size={18} />
            )}
          </button>
        </>
      )}
      {tabletHost &&
        (panel === "vehicle" || panel === "profile") &&
        createPortal(
          <section
            className="tablet-screen"
            aria-label="Tableta de tu vehículo"
          >
            <button
              className="tablet-close"
              onClick={() => open("reception", "reception")}
              aria-label="Volver a recepción"
            >
              <X />
            </button>{" "}
            {(panel === "vehicle" || panel === "profile") && (
              <>
                <div className="overline">01 / TU VISITA</div>
                <h2>{panel === "profile" ? "Tu personaje." : "Tu carro, tu visita."}</h2>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();setBusy(true);setError("");
                    try{await saveProfile();open(panel==="profile"?"reception":"services",panel==="profile"?"reception":"services");}
                    catch(error){setError((error as Error).message);}
                    finally{setBusy(false);}
                  }}
                >
                  <fieldset className="avatar-choice">
                    <legend>Tu personaje</legend>
                    <div>
                    {([{id:"male",label:"Hombre"},{id:"female",label:"Mujer"}] as const).map(option=><label key={option.id} className={avatarSex===option.id?"chosen":""}>
                      <input type="radio" name="avatarSex" value={option.id} checked={avatarSex===option.id} onChange={()=>setAvatarSex(option.id)}/>{option.label}
                    </label>)}
                    </div>
                    <small>Selecciona cómo quieres aparecer en el local.</small>
                  </fieldset>
                  {panel === "vehicle" && <>
                  <label>
                    Tipo de vehículo
                    <select
                      value={vehicle.kind}
                      onChange={(e) =>
                        setVehicle({ ...vehicle, kind: e.target.value })
                      }
                    >
                      {VEHICLE_KINDS.map((x) => (
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
                  </>}
                  <div className="mini-note">
                    <Clock size={16} />
                    <span>La llegada se confirma en el local.</span>
                  </div>
                  <button className="primary full" type="submit" disabled={busy}>
                    {busy ? "Guardando…" : panel === "profile" ? "Guardar personaje" : "Vamos a los servicios"} <ArrowRight size={16} />
                  </button>
                </form>
              </>
            )}
          </section>,
          tabletHost,
        )}
      {(panel === "login" || panel === "admin") && (
        <div
          className={
            "panel-position panel-" +
            panel +
            (panel === "admin" ? " admin-position" : "")
          }
        >
          <section
            className={
              "interaction-panel " + (panel === "admin" ? "admin-panel" : "")
            }
            role="dialog"
            aria-label={panel === "admin" ? "Administración" : "Entrar"}
          >
            <button className="close-panel" onClick={close} aria-label="Cerrar">
              <X size={18} />
            </button>{" "}
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
                <LoaderCircle className="spin" size={14} />
                Actualizando…
              </p>
            )}
          </section>
        </div>
      )}
      {(error || toast || syncState) && (
        <div className="world-toast" role={error ? "alert" : "status"}>
          <span>{error || toast || syncState}</span>
          <button
            onClick={() => {
              setError("");
              setToast("");
              setSyncState("");
            }}
            aria-label="Cerrar aviso"
          >
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
