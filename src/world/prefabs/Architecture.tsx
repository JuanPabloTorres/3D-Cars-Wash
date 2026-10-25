/* Composes the preserved full-world architecture and palette; newer construction layers own their separate area plans. */
import { useEffect, useMemo } from 'react'
import { Text, useTexture } from '@react-three/drei'
import { MeshStandardMaterial, RepeatWrapping, SRGBColorSpace, Vector2 } from 'three'
import { useApp } from '../../app/store'
import type { Destination } from '../navigation/layout'
import { Model } from './Model'
import { useFrame, useThree } from '@react-three/fiber'
import { useCommerce } from '../../app/commerceStore'
import { useBusiness } from '../../app/business'
import { CounterObjects } from './CounterObjects'
import { createBlockGeometry } from './surfaceGeometry'

type V3 = [number, number, number]

type Palette = ReturnType<typeof usePalette>

function useMapSet(prefix: string, repeat: number) {
  const source = useTexture([
    `/textures/${prefix}-color.jpg`,
    `/textures/${prefix}-normal.jpg`,
    `/textures/${prefix}-roughness.jpg`,
  ])
  const maps = useMemo(
    () =>
      source.map((s, i) => {
        const t = s.clone()

        t.wrapS = t.wrapT = RepeatWrapping
        t.repeat.set(repeat, repeat)
        t.anisotropy = 4
        if (i === 0) t.colorSpace = SRGBColorSpace

        return t
      }),
    [source, repeat],
  )

  useEffect(() => () => maps.forEach((t) => t.dispose()), [maps])

  return maps
}

export function usePalette() {
  const concrete = useMapSet('concrete', 0.45),
    road = useMapSet('concrete', 0.8),
    walk = useMapSet('concrete', 0.65),
    wood = useMapSet('wood', 0.7),
    deck = useMapSet('wood', 0.75)
  const materials = useMemo(() => {
    const palette = {
      ground: new MeshStandardMaterial({
        map: road[0],
        normalMap: road[1],
        normalScale: new Vector2(0.48, 0.48),
        color: '#43494e',
        roughness: 0.9,
      }),
      wood: new MeshStandardMaterial({
        map: wood[0],
        normalMap: wood[1],
        normalScale: new Vector2(0.22, 0.22),
        roughnessMap: wood[2],
        color: '#d0b595',
        roughness: 0.78,
      }),
      deck: new MeshStandardMaterial({
        map: deck[0],
        normalMap: deck[1],
        normalScale: new Vector2(0.28, 0.28),
        roughnessMap: deck[2],
        color: '#bfa17e',
        roughness: 0.86,
      }),
      counterBacking: new MeshStandardMaterial({ color: '#80634d', roughness: 0.96 }),
      red: new MeshStandardMaterial({ color: '#bb202d', metalness: 0.12, roughness: 0.72 }),
      graphite: new MeshStandardMaterial({
        color: '#303941',
        normalMap: walk[1],
        normalScale: new Vector2(0.035, 0.035),
        metalness: 0.25,
        roughness: 0.58,
      }),
      plaster: new MeshStandardMaterial({
        map: walk[0],
        normalMap: walk[1],
        normalScale: new Vector2(0.12, 0.12),
        color: '#d3d2c8',
        roughness: 0.95,
      }),
      pavement: new MeshStandardMaterial({
        map: walk[0],
        normalMap: walk[1],
        roughnessMap: walk[2],
        normalScale: new Vector2(0.18, 0.18),
        color: '#dad6ca',
        roughness: 0.94,
      }),
      bayFloor: new MeshStandardMaterial({
        map: concrete[0],
        normalMap: concrete[1],
        roughnessMap: concrete[2],
        color: '#828b89',
        roughness: 0.8,
      }),
      joint: new MeshStandardMaterial({ color: '#85867e', roughness: 1 }),
      marking: new MeshStandardMaterial({ color: '#e4e2d5', roughness: 0.95 }),
      yellow: new MeshStandardMaterial({ color: '#e6bd56', roughness: 0.6 }),
      light: new MeshStandardMaterial({
        color: '#ffdb9a',
        emissive: '#ffc06e',
        emissiveIntensity: 0.85,
      }),
      soil: new MeshStandardMaterial({ color: '#403c27', roughness: 1 }),
    }

    // The source concrete is dark. Retain its grain at low strength so pedestrian
    // paving and plaster stay pale, distinct from the vehicle lane under daylight.
    for (const material of [palette.pavement, palette.plaster]) {
      material.onBeforeCompile = (shader) => {
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <map_fragment>',
          `#ifdef USE_MAP
      diffuseColor *= mix(vec4(1.0), texture2D(map, vMapUv), .24);
      #endif`,
        )
      }
      material.customProgramCacheKey = () => 'pale-concrete-grain-v1'
    }
    // Use the existing metre-scaled concrete grain as fine asphalt aggregate,
    // reducing its broad colour variation so it never reads as road tiles.
    palette.ground.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec2 asphaltPosition;')
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
      vec4 asphaltWorld=vec4(transformed,1.);
      #ifdef USE_INSTANCING
      asphaltWorld=instanceMatrix*asphaltWorld;
      #endif
      asphaltPosition=(modelMatrix*asphaltWorld).xz;`,
        )
      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>
      varying vec2 asphaltPosition;
      float asphaltHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float asphaltNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
        return mix(mix(asphaltHash(i),asphaltHash(i+vec2(1.,0.)),f.x),mix(asphaltHash(i+vec2(0.,1.)),asphaltHash(i+vec2(1.,1.)),f.x),f.y);}
      `,
        )
        .replace(
          '#include <map_fragment>',
          `#ifdef USE_MAP
      diffuseColor *= mix(vec4(.72,.72,.72,1.), texture2D(map, vMapUv), .24);
      #endif`,
        )
        .replace(
          '#include <color_fragment>',
          `#include <color_fragment>
      float grain=fract(sin(dot(floor(asphaltPosition*140.),vec2(12.9898,78.233)))*43758.5453);
      float aggregate=asphaltNoise(asphaltPosition*3.7)*.65+asphaltNoise(asphaltPosition*.43)*.35;
      diffuseColor.rgb*=mix(.72,1.16,aggregate)*mix(.88,1.09,grain);`,
        )
    }
    palette.ground.customProgramCacheKey = () => 'fine-matte-asphalt-v3'

    return palette
  }, [concrete, road, walk, wood, deck])

  useEffect(() => () => Object.values(materials).forEach((m) => m.dispose()), [materials])
  useFrame((_, dt) => {
    const wet = useApp.getState().weather.kind === 'rain'

    materials.bayFloor.roughness +=
      ((wet ? 0.3 : 0.8) - materials.bayFloor.roughness) * (1 - Math.exp(-Math.min(dt, 0.05)))
  })

  return materials
}

export function Block({
  at,
  size,
  mat,
  rotation = [0, 0, 0],
  occluder = false,
  radius,
}: {
  at: V3
  size: V3
  mat: MeshStandardMaterial
  rotation?: V3
  occluder?: boolean
  radius?: number
}) {
  const [width, height, depth] = size
  const geometry = useMemo(
    () => createBlockGeometry([width, height, depth], radius),
    [width, height, depth, radius],
  )

  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <mesh
      position={at}
      rotation={rotation}
      castShadow
      receiveShadow
      geometry={geometry}
      material={mat}
      userData={{ occluder, staticArchitecture: true }}
    />
  )
}

export function Lettering({
  children,
  at,
  size = 0.24,
  color = '#f3f3f0',
  rotation = [0, 0, 0],
  maxWidth = 10,
}: {
  children: React.ReactNode
  at: V3
  size?: number
  color?: string
  rotation?: V3
  maxWidth?: number
}) {
  return (
    <Text
      font="/fonts/manrope-medium.ttf"
      position={at}
      rotation={rotation}
      fontSize={size}
      color={color}
      anchorX="center"
      anchorY="middle"
      maxWidth={maxWidth}
      lineHeight={1.15}
    >
      {children}
    </Text>
  )
}

export function Wayfinding({
  at,
  destination,
  label,
  mat,
}: {
  at: V3
  destination: Destination
  label: string
  mat: Palette
}) {
  return (
    <group
      position={at}
      onClick={(e) => {
        e.stopPropagation()
        useApp.getState().navigate(destination)
      }}
      onPointerOver={() => {
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        document.body.style.cursor = ''
      }}
    >
      <Block at={[0, 0.65, 0]} size={[0.12, 1.3, 0.12]} mat={mat.graphite} />
      <Block at={[0, 1.45, 0]} size={[1.95, 0.85, 0.13]} mat={mat.graphite} />
      <Lettering at={[0, 1.53, 0.075]} size={0.2}>
        {label}
      </Lettering>
      <Lettering at={[0, 1.24, 0.075]} size={0.13} color="#e6bd56">
        Toca para abrir →
      </Lettering>
    </group>
  )
}

export function ReceptionPrefab({ mat }: { mat: Palette }) {
  const mobile = useThree((s) => s.size.width <= 700)
  const business = useBusiness()
  // The shared wood atlas contains horizontal board seams. Sample one board
  // locally, then rotate its grain along the vertical slats, leaving other areas intact.
  const counterFinish = useMemo(() => {
    const createFinish = (vertical: boolean) => {
      const finish = mat.wood.clone()

      for (const key of ['map', 'normalMap', 'roughnessMap'] as const) {
        const source = mat.wood[key]

        if (!source) continue

        const texture = source.clone()

        texture.repeat.set(vertical ? 0.5 : 0.22, vertical ? 0.5 : 0.06)
        texture.rotation = vertical ? Math.PI / 2 : 0
        texture.offset.set(0.02, vertical ? 0.08 : 0.03)
        finish[key] = texture
      }
      finish.normalScale.set(0.08, 0.08)
      finish.roughness = 0.72
      finish.color.set('#dec5a6')

      return finish
    }

    return { top: createFinish(false), slats: createFinish(true) }
  }, [mat.wood])

  useEffect(
    () => () => {
      for (const finish of Object.values(counterFinish)) {
        finish.map?.dispose()
        finish.normalMap?.dispose()
        finish.roughnessMap?.dispose()
        finish.dispose()
      }
    },
    [counterFinish],
  )

  return (
    <group position-z={3.2}>
      <Block at={[-6, 0.1, -2.2]} size={[6.9, 0.2, 6.1]} mat={mat.pavement} />
      <Block at={[-6, 1.5, -4.8]} size={[6.9, 3, 0.2]} mat={mat.graphite} occluder />
      <Block at={[-9.35, 1.4, -3.4]} size={[0.18, 2.8, 2.7]} mat={mat.plaster} occluder />
      {[-9.15, -2.85].map((x) => (
        <Block key={x} at={[x, 1.65, 0.55]} size={[0.2, 3.3, 0.2]} mat={mat.graphite} occluder />
      ))}
      <Block
        at={[-6, 3.37, -2.1]}
        size={[7.5, 0.18, 6.35]}
        mat={mat.red}
        rotation={[-0.04, 0, 0]}
      />
      <Block
        at={[-6, 3.255, -2.1]}
        size={[7.35, 0.045, 6.2]}
        mat={mat.deck}
        rotation={[-0.04, 0, 0]}
      />
      <Block at={[-6, 3.17, 0.98]} size={[7.5, 0.38, 0.18]} mat={mat.graphite} />
      <Block at={[-6, 2.94, 0.99]} size={[7.25, 0.035, 0.08]} mat={mat.light} />
      <Lettering at={[-6, 3.17, 1.09]} size={0.24}>
        RECEPCIÓN
      </Lettering>
      <Lettering
        at={[mobile ? -6 : -7, 2.5, -4.67]}
        size={mobile ? 0.34 : 0.32}
        maxWidth={mobile ? 5.1 : 3.9}
      >
        {business.name.toUpperCase()}
      </Lettering>
      <Lettering at={[mobile ? -6 : -7, 2.19, -4.67]} size={0.14} color="#ed7979">
        CAR WASH
      </Lettering>
      <Block
        at={[-6, 0.62, 0.3]}
        size={[4.3, 1.04, 0.7]}
        mat={mat.graphite}
        radius={0.12}
        occluder
      />
      <Block
        at={[-6, 1.16, 0.35]}
        size={[4.5, 0.12, 0.92]}
        mat={counterFinish.top}
        radius={0.055}
        occluder
      />
      <Block at={[-6, 0.62, 0.665]} size={[4.12, 0.98, 0.035]} mat={mat.counterBacking} />
      {Array.from({ length: 41 }, (_, i) => (
        <Block
          key={i}
          at={[-8 + i * 0.1, 0.62, 0.69]}
          size={[0.075, 0.98, 0.022]}
          mat={counterFinish.slats}
        />
      ))}
      <Block at={[-6, 0.16, 0.73]} size={[4.2, 0.035, 0.055]} mat={mat.light} />
      <Lettering at={[-6, 0.75, 0.72]} size={0.18} maxWidth={2.9}>
        {business.name.toUpperCase()}
      </Lettering>
      <Lettering at={[-6, 0.55, 0.72]} size={0.085} color="#f2c4a2">
        CAR WASH
      </Lettering>
      {[-7.5, -4.5].map((x) => (
        <group key={x}>
          <Block at={[x, 2.78, -0.5]} size={[0.035, 0.7, 0.035]} mat={mat.graphite} />
          <mesh position={[x, 2.4, -0.5]} castShadow>
            <cylinderGeometry args={[0.18, 0.3, 0.18, 16]} />
            <meshStandardMaterial color="#27292b" roughness={0.6} />
          </mesh>
          <Block at={[x, 2.29, -0.5]} size={[0.19, 0.035, 0.19]} mat={mat.light} />
        </group>
      ))}
      <Model id="pottedPlant" height={1.05} position={[-9.03, 0.2, 0.05]} />
      <Model id="pottedPlant" height={1.05} position={[-2.97, 0.2, 0.05]} />
      <CounterObjects />
      <Lettering at={[-3.9, 1.95, -4.66]} size={0.12} maxWidth={1.7}>
        Servicios y consultas
      </Lettering>
      <Lettering at={[-3.9, 1.7, -4.66]} size={0.105} maxWidth={1.7} color="#e6cda7">
        {business.contact?.label || 'Atención en recepción'}
      </Lettering>
    </group>
  )
}

export function PavementMarkings({ mat }: { mat: Palette }) {
  return (
    <group>
      <Block at={[3.4, 0.02, 8.3]} size={[0.12, 0.025, 21]} mat={mat.yellow} />
      <Block at={[6.7, 0.02, 8.3]} size={[0.12, 0.025, 21]} mat={mat.yellow} />
      {[-0.3, 1.2, 2.7, 4.2].map((z, i) => (
        <group key={`bay-${i}`}>
          <Block at={[3.4, 0.025, z]} size={[6.6, 0.025, 0.06]} mat={mat.graphite} />
          <Block at={[0.55, 0.025, z]} size={[0.08, 0.03, 0.42]} mat={mat.yellow} />
          <Block at={[6.25, 0.025, z]} size={[0.08, 0.03, 0.42]} mat={mat.yellow} />
        </group>
      ))}
    </group>
  )
}

export function ServiceDisplay({ mat }: { mat: Palette }) {
  return (
    <group
      position={[-9.9, 0, 2.05]}
      onClick={(e) => {
        e.stopPropagation()
        useCommerce.getState().updateDraft({ step: 'services' })
        useApp.getState().navigate('reception')
      }}
    >
      <Block at={[0, 0.5, 0]} size={[1.45, 1, 0.65]} mat={mat.wood} occluder />
      <Block at={[0, 1.18, -0.15]} size={[1.55, 1.1, 0.13]} mat={mat.graphite} />
      <Lettering at={[0, 1.51, -0.075]} size={0.15}>
        Cuidado para tu auto
      </Lettering>
      <Lettering at={[0, 1.15, -0.075]} size={0.12}>
        Exterior · Interior · Focos
      </Lettering>
      <Lettering at={[0, 0.84, -0.075]} size={0.09} color="#e6bd56">
        Consulta los servicios en recepción
      </Lettering>
    </group>
  )
}
