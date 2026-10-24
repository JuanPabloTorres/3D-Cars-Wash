import { useEffect, useMemo, useRef } from 'react'
import { BoxGeometry, InstancedMesh, Matrix4, MeshStandardMaterial } from 'three'
import { useApp } from '../app/store'

type Building = [number, number, number, number, number]
// x,z,width,height,depth: distant urban architecture, never customer destinations.
const buildings: Building[] = [
  [-24, -37, 9, 7.7, 10], [-7, -43, 11, 9.6, 12], [12, -47, 13, 7.8, 10],
  [31, -42, 10, 9.2, 11], [49, -37, 12, 7.1, 10], [70, -16, 11, 8.8, 13],
  [-35, -7, 10, 6.8, 13], [-36, 19, 11, 7.8, 14], [71, 23, 12, 7, 12],
  [-10, 56, 13, 8.2, 11], [20, 59, 14, 9.1, 12], [48, 55, 12, 7.6, 10],
]

/** Actual volumes behind the perimeter: no photo edge, mountain or mirrored skyline. */
export function UrbanSurround() {
  const night = useApp(s => s.weather.kind === 'night')
  const windows = useMemo(() => buildings.flatMap(([x, z, w, h, d]) => {
    const result: [number, number, number][] = []
    for (let floor = 0; floor < Math.floor(h / 2.8); floor++) {
      for (let column = 0; column < Math.floor(w / 2.6); column++) {
        result.push([x - w / 2 + 1.5 + column * 2.6, 1.55 + floor * 2.8, z + d / 2 + .04])
        result.push([x - w / 2 + 1.5 + column * 2.6, 1.55 + floor * 2.8, z - d / 2 - .04])
      }
    }
    return result
  }), [])
  const ref = useRef<InstancedMesh>(null)
  const geometry = useMemo(() => new BoxGeometry(1.1, 1.45, .06), [])
  const windowMaterial = useMemo(() => new MeshStandardMaterial({ color: '#506775', roughness: .48, metalness: .18 }), [])
  useEffect(() => {
    const instance = ref.current
    windows.forEach(([x, y, z], index) => instance!.setMatrixAt(index, new Matrix4().makeTranslation(x, y, z)))
    instance!.instanceMatrix.needsUpdate = true
    instance!.computeBoundingSphere()
    return () => instance?.dispose()
  }, [windows])
  useEffect(() => { windowMaterial.emissive.set(night ? '#d9ad6e' : '#000000'); windowMaterial.emissiveIntensity = night ? .55 : 0 }, [night, windowMaterial])
  useEffect(() => () => { geometry.dispose(); windowMaterial.dispose() }, [geometry, windowMaterial])
  return <group name="urban-surround">
    {buildings.map(([x, z, w, h, d], index) => <group key={index}>
      <mesh position={[x, h / 2, z]} receiveShadow><boxGeometry args={[w, h, d]} /><meshStandardMaterial color={['#c2c3b9', '#b2bab8', '#cecabd'][index % 3]} roughness={.91} /></mesh>
      <mesh position={[x, h + .1, z]}><boxGeometry args={[w + .22, .2, d + .22]} /><meshStandardMaterial color="#a7aca5" roughness={.95} /></mesh>
    </group>)}
    <instancedMesh ref={ref} args={[geometry, windowMaterial, windows.length]} dispose={null} />
  </group>
}
