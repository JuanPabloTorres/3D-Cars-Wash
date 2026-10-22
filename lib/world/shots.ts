import { Vector3 } from "three";
export type Destination =
  "overview" | "reception" | "services" | "vehicle" | "lounge" | "exit";
export type SpatialIntent = Destination | "clipboard" | "tablet" | "entrance";
const v = (x: number, y: number, z: number) => new Vector3(x, y, z);
/** Fixed cinematic compositions; visitors choose an intention, never camera axes. */
export function shotFor(
  intent: SpatialIntent,
  mobile: boolean,
  car = new Vector3(-2.5, 0.1, 17),
) {
  const shots = {
    entrance: {
      eye:v(0,2.8,mobile?32:30),target:v(0,1.9,15),avatar:v(0,0.08,25.5),
    },
    overview: {
      eye: mobile ? v(24,94,117) : v(38,43,54),
      target:v(0,0.8,5),avatar:v(0,0.08,18),
    },
    reception: {
      eye: v(11.2, 1.85, mobile ? 17.6 : 14),
      target: v(11.2, 1.35, 11.1),
      avatar: v(8, 0.08, 13.3),
    },
    services: {
      eye: mobile ? v(5.6, 2.1, 22.5) : v(5.2, 2.6, 23),
      target: mobile ? v(5.6, 1.25, 17.4) : v(5.6, 1.3, 16.6),
      avatar: v(4.8, 0.08, 20),
    },
    vehicle: {
      eye: car.clone().add(v(4.2, 1.85, mobile ? 8.8 : 5.8)),
      target: car.clone().add(v(0, 1.2, 0)),
      avatar: v(Math.min(15, car.x + 3.5), 0.08, Math.max(2, car.z + 4)),
    },
    lounge: {
      eye: v(-12.5, 1.4, mobile ? 18.3 : 15.3),
      target: car.clone().add(v(0, 1.1, 0)),
      avatar: v(-10, 0.08, 13.8),
    },
    exit: {
      eye: v(10, 2.2, mobile ? 21 : 18),
      target: v(16, 1.5, 11),
      avatar: v(10, 0.08, 16),
    },
    clipboard: {
      eye: mobile ? v(10.75, 1.85, 13.5) : v(10.95, 1.95, 13.2),
      target: mobile ? v(10.75, 1.32, 11.65) : v(11.05, 1.4, 11.4),
      avatar: v(8, 0.08, 13.3),
    },
    tablet: {
      eye: mobile ? v(0.55, 1.8, 20.2) : v(1.1, 2.05, 21),
      target: mobile ? v(0.55, 1.52, 18.5) : v(-0.8, 1.37, 18),
      avatar: v(-5.5, 0.08, 17),
    },
  };
  return {
    ...shots[intent],
    fov: intent === "overview" ? (mobile ? 50 : 43) : mobile
      ? intent === "clipboard"
        ? 50
        : intent === "tablet"
          ? 52
          : 61
      : 48,
  };
}
