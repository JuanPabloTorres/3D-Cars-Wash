import { useMemo } from 'react'
import { RoundedBox } from '@react-three/drei'
import { CatmullRomCurve3, Vector3 } from 'three'
import { landscapeLights, landscapePoles } from './landscapePlan'
import { WarmDiffuser } from './WarmDiffuser'

const housing = { color: '#273134', metalness: 0.42, roughness: 0.58 }
const diffuser = { color: '#bd9e6b', emissive: '#ffe1ad', emissiveIntensity: 0.8, roughness: 0.75 }

/** Warm illuminated lenses with bounded local light and no global bloom.
 * Soil anchors and inward orientation live in the same plan as the planting. */
export function LightingLandscapeLayer() {
  return (
    <group name="LightingLandscapeLayer">
      <group name="LightPolesLayer">
        {landscapePoles.map((pole) => (
          <group key={pole.id} name={pole.id} position={[...pole.position]} rotation-y={pole.yaw}>
            <SiteLightPole />
          </group>
        ))}
      </group>
      <group name="PlanterBollards">
        {landscapeLights.map((position, i) => (
          <group key={i} name={`planter-light-${i}`} position={position}>
            <PlanterBollard />
            <pointLight
              position={[0, 1.09, 0]}
              color="#ffd19a"
              intensity={7}
              distance={2.2}
              decay={2}
            />
          </group>
        ))}
      </group>
    </group>
  )
}

function SiteLightPole() {
  const arm = useMemo(
    () =>
      new CatmullRomCurve3([
        new Vector3(0, 3.88, 0),
        new Vector3(0, 4.16, 0.08),
        new Vector3(0, 4.32, 0.35),
        new Vector3(0, 4.32, 0.76),
      ]),
    [],
  )

  return (
    <group>
      <RoundedBox
        args={[0.48, 0.12, 0.48]}
        radius={0.045}
        smoothness={2}
        position-y={0.06}
        receiveShadow
      >
        <meshStandardMaterial color="#b6b4a8" roughness={0.95} />
      </RoundedBox>
      <RoundedBox
        args={[0.28, 0.08, 0.28]}
        radius={0.025}
        smoothness={2}
        position-y={0.16}
        castShadow
      >
        <meshStandardMaterial {...housing} />
      </RoundedBox>
      <RoundedBox
        args={[0.17, 3.88, 0.17]}
        radius={0.04}
        smoothness={3}
        position-y={2.1}
        castShadow
      >
        <meshStandardMaterial {...housing} />
      </RoundedBox>
      <mesh castShadow>
        <tubeGeometry args={[arm, 18, 0.077, 10, false]} />
        <meshStandardMaterial {...housing} />
      </mesh>
      <RoundedBox
        args={[0.46, 0.12, 1.1]}
        radius={0.05}
        smoothness={3}
        position={[0, 4.32, 0.89]}
        castShadow
      >
        <meshStandardMaterial {...housing} />
      </RoundedBox>
      <RoundedBox
        args={[0.35, 0.025, 0.88]}
        radius={0.012}
        smoothness={2}
        position={[0, 4.251, 0.91]}
      >
        <meshStandardMaterial {...diffuser} />
      </RoundedBox>
      <RoundedBox
        args={[0.12, 0.24, 0.015]}
        radius={0.007}
        smoothness={2}
        position={[0, 0.52, 0.09]}
      >
        <meshStandardMaterial color="#414b4d" metalness={0.3} roughness={0.6} />
      </RoundedBox>
    </group>
  )
}

function PlanterBollard() {
  return (
    <group>
      <mesh position-y={0.02} castShadow receiveShadow>
        <cylinderGeometry args={[0.15, 0.15, 0.04, 48]} />
        <meshStandardMaterial {...housing} />
      </mesh>
      <mesh position-y={0.47} castShadow receiveShadow>
        <cylinderGeometry args={[0.13, 0.13, 0.9, 48]} />
        <meshStandardMaterial {...housing} />
      </mesh>
      <WarmDiffuser />
      <mesh position-y={1.285} castShadow>
        <cylinderGeometry args={[0.136, 0.144, 0.05, 48]} />
        <meshStandardMaterial {...housing} />
      </mesh>
      <mesh position-y={1.302} rotation-x={Math.PI / 2} castShadow>
        <torusGeometry args={[0.128, 0.008, 8, 48]} />
        <meshStandardMaterial {...housing} />
      </mesh>
    </group>
  )
}
