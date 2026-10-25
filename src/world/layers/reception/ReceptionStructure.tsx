import { Block, Lettering } from '../../prefabs/Architecture'
import { useBusiness } from '../../../app/business'
import { receptionPlan as plan } from './receptionPlan'
import { useReceptionMaterials } from './receptionMaterials'
import { WarmPendantLens } from '../WarmDiffuser'
import type { CounterAction } from './ReceptionHotspot'
import { ReceptionProps } from './ReceptionProps'
import { ReceptionWallInformation } from './ReceptionWallInformation'
import { useMemo } from 'react'
import { Object3D } from 'three'

/** Physical architecture only. No business state mutations or navigation rules. */
export function ReceptionStructure({
  lights = false,
  onAction,
}: {
  lights?: boolean
  onAction?: (action: CounterAction) => void
}) {
  const mat = useReceptionMaterials(),
    business = useBusiness()
  const lightTargets = useMemo(
    () =>
      [-1.48, 1.48].map((x) => {
        const target = new Object3D()

        target.position.set(x, 1.05, 0.92)

        return target
      }),
    [],
  )
  const c = plan.counter

  return (
    <group name="ReceptionStructure" position={plan.origin}>
      <Block at={[0, 1.52, -2.58]} size={[6.5, 3.04, 0.18]} mat={mat.wall} radius={0.035} />
      {[-3.12, 3.12].flatMap((x) =>
        [-2.52, 2.56].map((z) => (
          <group key={`${x}:${z}`}>
            <Block at={[x, 1.56, z]} size={[0.16, 3.12, 0.16]} mat={mat.metal} radius={0.015} />
            <Block at={[x, 0.025, z]} size={[0.28, 0.05, 0.28]} mat={mat.metal} radius={0.02} />
          </group>
        )),
      )}
      {/* A folded red fascia encloses the steel frame and separate timber soffit. */}
      <Block at={[0, 3.15, 0]} size={[6.7, 0.16, 5.8]} mat={mat.red} radius={0.035} />
      <Block at={[0, 3.04, 0]} size={[6.48, 0.065, 5.58]} mat={mat.ceiling} radius={0.015} />
      {[-2.64, 2.64].map((z) => (
        <Block key={z} at={[0, 2.97, z]} size={[6.5, 0.16, 0.12]} mat={mat.metal} radius={0.015} />
      ))}
      {[-3.1, 3.1].map((x) => (
        <Block key={x} at={[x, 2.97, 0]} size={[0.12, 0.16, 5.4]} mat={mat.metal} radius={0.015} />
      ))}
      <Block at={[0, 3.07, 2.86]} size={[6.7, 0.31, 0.12]} mat={mat.red} radius={0.025} />
      <Block at={[0, 2.88, 2.87]} size={[6.7, 0.15, 0.14]} mat={mat.metal} radius={0.015} />
      <Lettering at={[0, 2.89, 2.95]} size={0.13}>
        RECEPCIÓN
      </Lettering>
      <Lettering at={[0, 2.4, -2.465]} size={0.5} maxWidth={5.5}>
        {business.name.toUpperCase()}
      </Lettering>
      <Lettering at={[0, 1.98, -2.465]} size={0.21} color="#e43142">
        CAR WASH
      </Lettering>
      <Block at={[-0.94, 1.98, -2.42]} size={[0.32, 0.06, 0.035]} mat={mat.red} radius={0.01} />
      <group name="ReceptionCounter">
        <Block
          at={[0, 0.48, c.z]}
          size={[c.width - 0.14, 0.88, c.depth - 0.12]}
          mat={mat.backing}
          radius={0.045}
        />
        <Block
          at={[0, 0.065, c.z]}
          size={[c.width - 0.24, 0.13, c.depth - 0.17]}
          mat={mat.metal}
          radius={0.025}
        />
        <Block
          at={[0, c.height - 0.055, c.z + 0.02]}
          size={[c.width + 0.18, 0.11, c.depth + 0.16]}
          mat={mat.top}
          radius={0.035}
        />
        {Array.from({ length: 43 }, (_, i) => (
          <Block
            key={i}
            at={[-2.1 + i * 0.1, 0.53, c.z + c.depth / 2 - 0.035]}
            size={[0.068, 0.85, 0.06]}
            mat={mat.slats[i % 3]}
            radius={0.009}
          />
        ))}
        {[-1, 1].map((side) =>
          Array.from({ length: 7 }, (_, i) => (
            <Block
              key={`${side}:${i}`}
              at={[side * (c.width / 2 - 0.055), 0.53, c.z - 0.3 + i * 0.1]}
              size={[0.06, 0.85, 0.068]}
              mat={mat.slats[i % 3]}
              radius={0.009}
            />
          )),
        )}
        <Lettering at={[0, 0.59, c.z + c.depth / 2 + 0.006]} size={0.23} maxWidth={2.9}>
          {business.name.toUpperCase()}
        </Lettering>
        <Lettering at={[0, 0.36, c.z + c.depth / 2 + 0.006]} size={0.095} color="#ef6566">
          CAR WASH
        </Lettering>
        <Block
          at={[-0.48, 0.36, c.z + c.depth / 2 + 0.01]}
          size={[0.25, 0.028, 0.018]}
          mat={mat.red}
        />
      </group>
      {lights && (
        <group name="ReceptionLighting">
          {lightTargets.map((target) => (
            <primitive key={target.uuid} object={target} />
          ))}
          {[-1.48, 1.48].map((x, i) => (
            <group key={x} position={[x, 2.45, 0.72]}>
              <mesh position-y={0.56} castShadow>
                <cylinderGeometry args={[0.105, 0.105, 0.055, 40]} />
                <primitive object={mat.metal} attach="material" />
              </mesh>
              <mesh position-y={0.515}>
                <cylinderGeometry args={[0.03, 0.03, 0.06, 24]} />
                <primitive object={mat.metal} attach="material" />
              </mesh>
              <mesh position-y={0.27}>
                <cylinderGeometry args={[0.012, 0.012, 0.54, 12]} />
                <primitive object={mat.metal} attach="material" />
              </mesh>
              <mesh castShadow>
                <cylinderGeometry args={[0.09, 0.28, 0.22, 48, 1, true]} />
                <primitive object={mat.metal} attach="material" />
              </mesh>
              <group position-y={-0.115}>
                <WarmPendantLens />
              </group>
              <spotLight
                position={[0, -0.13, 0]}
                target={lightTargets[i]}
                color="#ffe1b2"
                intensity={6}
                distance={3.2}
                decay={2}
                angle={0.8}
                penumbra={0.8}
              />
            </group>
          ))}
        </group>
      )}
      {lights && (
        <>
          <ReceptionWallInformation onAction={onAction} />
          <ReceptionProps onAction={onAction} />
        </>
      )}
    </group>
  )
}
