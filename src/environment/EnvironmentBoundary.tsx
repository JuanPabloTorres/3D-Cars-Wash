import { SiteBackdrop } from './SiteBackdrop'

export { InstancedAsset } from '../world/prefabs/InstancedVegetation'

export function EnvironmentBoundary() {
  return (
    <>
      <SiteBackdrop />
      <group>
        <mesh rotation-x={-Math.PI / 2} position={[18, -0.165, 7]} receiveShadow>
          <planeGeometry args={[500, 500]} />
          <meshStandardMaterial color="#777b67" roughness={1} />
        </mesh>
        {/* Landscape owns planted roots and the soil supporting them. */}
        {/* Physical perimeter and urban volumes remain continuous while navigating. */}
        <mesh position={[18, 0.65, -30]} receiveShadow>
          <boxGeometry args={[83, 1.6, 0.3]} />
          <meshStandardMaterial color="#c4c3b4" roughness={0.94} />
        </mesh>
        <mesh position={[-23, 0.65, 7]} receiveShadow>
          <boxGeometry args={[0.3, 1.6, 74]} />
          <meshStandardMaterial color="#c4c3b4" roughness={0.94} />
        </mesh>
        <mesh position={[59, 0.65, 7]} receiveShadow>
          <boxGeometry args={[0.3, 1.6, 74]} />
          <meshStandardMaterial color="#c4c3b4" roughness={0.94} />
        </mesh>
      </group>
    </>
  )
}
