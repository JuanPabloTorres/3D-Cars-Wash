import { useMemo } from 'react'
import { RoundedBox } from '@react-three/drei'
import { CatmullRomCurve3, Vector3 } from 'three'
import { landscapeLights, landscapePoles } from './landscapePlan'
import { WarmDiffuser } from './WarmDiffuser'

const housing = { color: '#273134', metalness: .42, roughness: .58 }
const diffuser = { color: '#bd9e6b', emissive: '#ffe1ad', emissiveIntensity: .8, roughness: .75 }

/** Warm illuminated lenses with bounded local light and no global bloom.
 * Soil anchors and inward orientation live in the same plan as the planting. */
export function LightingLandscapeLayer() {
  return <group name="LightingLandscapeLayer">
    <group name="LightPolesLayer">{landscapePoles.map(pole =>
      <group key={pole.id} name={pole.id} position={[...pole.position]} rotation-y={pole.yaw}><SiteLightPole /></group>
    )}</group>
    <group name="PlanterBollards">{landscapeLights.map((position, i) =>
      <group key={i} name={`planter-light-${i}`} position={position}>
        <PlanterBollard />
        <pointLight position={[0, 1.09, 0]} color="#ffd19a" intensity={7} distance={2.2} decay={2} />
      </group>
    )}</group>
  </group>
}

function SiteLightPole() {
  const arm = useMemo(() => new CatmullRomCurve3([
    new Vector3(0, 3.88, 0), new Vector3(0, 4.16, .08),
    new Vector3(0, 4.32, .35), new Vector3(0, 4.32, .76),
  ]), [])
  return <group>
    <RoundedBox args={[.48, .12, .48]} radius={.045} smoothness={2} position-y={.06} receiveShadow><meshStandardMaterial color="#b6b4a8" roughness={.95} /></RoundedBox>
    <RoundedBox args={[.28, .08, .28]} radius={.025} smoothness={2} position-y={.16} castShadow><meshStandardMaterial {...housing} /></RoundedBox>
    <RoundedBox args={[.17, 3.88, .17]} radius={.04} smoothness={3} position-y={2.1} castShadow><meshStandardMaterial {...housing} /></RoundedBox>
    <mesh castShadow><tubeGeometry args={[arm, 18, .077, 10, false]} /><meshStandardMaterial {...housing} /></mesh>
    <RoundedBox args={[.46, .12, 1.1]} radius={.05} smoothness={3} position={[0, 4.32, .89]} castShadow><meshStandardMaterial {...housing} /></RoundedBox>
    <RoundedBox args={[.35, .025, .88]} radius={.012} smoothness={2} position={[0, 4.251, .91]}><meshStandardMaterial {...diffuser} /></RoundedBox>
    <RoundedBox args={[.12, .24, .015]} radius={.007} smoothness={2} position={[0, .52, .09]}><meshStandardMaterial color="#414b4d" metalness={.3} roughness={.6} /></RoundedBox>
  </group>
}

function PlanterBollard() {
  return <group>
    <mesh position-y={.02} castShadow receiveShadow><cylinderGeometry args={[.15, .15, .04, 48]} /><meshStandardMaterial {...housing} /></mesh>
    <mesh position-y={.47} castShadow receiveShadow><cylinderGeometry args={[.13, .13, .9, 48]} /><meshStandardMaterial {...housing} /></mesh>
    <WarmDiffuser />
    <mesh position-y={1.285} castShadow><cylinderGeometry args={[.136, .144, .05, 48]} /><meshStandardMaterial {...housing} /></mesh>
    <mesh position-y={1.302} rotation-x={Math.PI / 2} castShadow><torusGeometry args={[.128, .008, 8, 48]} /><meshStandardMaterial {...housing} /></mesh>
  </group>
}
