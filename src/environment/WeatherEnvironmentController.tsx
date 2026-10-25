import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import { Sky } from 'three/addons/objects/Sky.js'
import {
  Color,
  DirectionalLight,
  Fog,
  HemisphereLight,
  MathUtils,
  Points,
  BufferAttribute,
} from 'three'
import { useApp } from '../app/store'
import { diagnostics } from '../world/diagnostics'
import type { WeatherKind } from './weather'
import { AtmosphericClouds } from './AtmosphericClouds'

const presets: Record<
  WeatherKind,
  {
    sky: string
    ground: string
    light: string
    sun: [number, number, number]
    key: number
    ambient: number
    exposure: number
    wet: number
  }
> = {
  sunny: {
    sky: '#78b7df',
    ground: '#89917a',
    light: '#fff0d4',
    sun: [-22, 30, 18],
    key: 2.6,
    ambient: 0.7,
    exposure: 1.05,
    wet: 0,
  },
  'partly-cloudy': {
    sky: '#9cb6c5',
    ground: '#899681',
    light: '#f2efdf',
    sun: [-22, 24, 18],
    key: 1.7,
    ambient: 1,
    exposure: 1.04,
    wet: 0,
  },
  overcast: {
    sky: '#8397a5',
    ground: '#7f8b80',
    light: '#e4edfa',
    sun: [-22, 30, 18],
    key: 0.65,
    ambient: 1.35,
    exposure: 0.95,
    wet: 0.12,
  },
  rain: {
    sky: '#617785',
    ground: '#5e6d67',
    light: '#c4d8e8',
    sun: [-22, 20, 18],
    key: 0.35,
    ambient: 1.05,
    exposure: 0.83,
    wet: 1,
  },
  sunset: {
    sky: '#d8a07e',
    ground: '#927967',
    light: '#ffaf67',
    sun: [-45, 7, 22],
    key: 1.8,
    ambient: 0.5,
    exposure: 0.92,
    wet: 0.05,
  },
  night: {
    sky: '#102538',
    ground: '#26392f',
    light: '#91b1d4',
    sun: [-20, -25, -18],
    key: 0.2,
    ambient: 0.24,
    exposure: 0.8,
    wet: 0.05,
  },
}

export function WeatherEnvironmentController() {
  const kind = useApp((s) => s.weather.kind),
    { scene, gl } = useThree(),
    key = useRef<DirectionalLight>(null),
    hemi = useRef<HemisphereLight>(null)
  const sky = useMemo(() => {
    const value = new Sky(),
      u = value.material.uniforms

    u.sunPosition.value.set(-22, 30, 18)
    u.turbidity.value = 2
    u.rayleigh.value = 2.2
    u.mieCoefficient.value = 0.002
    u.mieDirectionalG.value = 0.75
    // Calibrate the atmospheric radiance before ACES; preserve world exposure.
    value.material.fragmentShader = value.material.fragmentShader.replace(
      'gl_FragColor = vec4( texColor, 1.0 );',
      'gl_FragColor = vec4( texColor * 0.24, 1.0 );',
    )

    return value
  }, [])
  const colors = useMemo(() => ({ sky: new Color(), ground: new Color(), light: new Color() }), [])
  const preset = presets[kind]

  useEffect(() => {
    scene.fog = new Fog(preset.sky, 100, 280)

    return () => {
      scene.fog = null
    }
  }, [scene])
  useFrame((_, delta) => {
    const t = 1 - Math.exp(-Math.min(delta, 0.05) * 1.2)
    const uniforms = sky.material.uniforms

    if (uniforms) {
      uniforms.sunPosition.value.lerp({ x: preset.sun[0], y: preset.sun[1], z: preset.sun[2] }, t)
      uniforms.rayleigh.value = MathUtils.lerp(
        uniforms.rayleigh.value,
        kind === 'night' ? 0.015 : kind === 'sunset' ? 2 : 2.2,
        t,
      )
      uniforms.turbidity.value = MathUtils.lerp(
        uniforms.turbidity.value,
        kind === 'sunny' ? 2 : kind === 'sunset' ? 7 : 10,
        t,
      )
    }

    const fog = scene.fog as Fog

    fog?.color.lerp(colors.sky.set(preset.sky), t)
    if (key.current) {
      key.current.color.lerp(colors.light.set(preset.light), t)
      key.current.intensity = MathUtils.lerp(key.current.intensity, preset.key, t)
      key.current.position.lerp({ x: preset.sun[0], y: preset.sun[1], z: preset.sun[2] }, t)
    }
    if (hemi.current) {
      hemi.current.intensity = MathUtils.lerp(hemi.current.intensity, preset.ambient, t)
      hemi.current.groundColor.lerp(colors.ground.set(preset.ground), t)
    }
    gl.toneMappingExposure = MathUtils.lerp(gl.toneMappingExposure, preset.exposure, t)
    scene.environmentIntensity = MathUtils.lerp(
      scene.environmentIntensity,
      kind === 'night' ? 0.14 : kind === 'rain' ? 0.35 : 0.6,
      t,
    )
    diagnostics.weather = {
      kind,
      source: useApp.getState().weather.source,
      exposure: gl.toneMappingExposure,
    }
  })

  return (
    <>
      <Environment files="/textures/daylight.hdr" />
      <primitive object={sky} scale={450} renderOrder={-3} />
      <hemisphereLight ref={hemi} args={['#d9eaff', preset.ground, 0.7]} />
      <directionalLight
        ref={key}
        position={[-22, 30, 18]}
        color="#fff0d4"
        intensity={2.6}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-22}
        shadow-camera-right={43}
        shadow-camera-top={22}
        shadow-camera-bottom={-22}
        shadow-camera-near={1}
        shadow-camera-far={100}
        shadow-normalBias={0.035}
        shadow-bias={-0.00015}
      />
      <pointLight
        position={[-6, 2.5, -0.8]}
        color="#ffd39b"
        intensity={kind === 'night' ? 35 : kind === 'sunset' ? 12 : 2}
        distance={12}
        decay={2}
      />
      <Rain active={kind === 'rain'} />
      <AtmosphericClouds />
    </>
  )
}

function Rain({ active }: { active: boolean }) {
  const enabled = useApp((s) => s.weatherEffects),
    points = useRef<Points>(null)
  const positions = useMemo(
    () =>
      Float32Array.from({ length: 360 * 3 }, (_, i) =>
        i % 3 === 1 ? (i * 7.31) % 10 : ((i * 3.13) % 70) - 30,
      ),
    [],
  )

  useFrame((_, raw) => {
    if (!active || !enabled || !points.current) return

    const dt = Math.min(raw, 0.05)

    for (let i = 1; i < positions.length; i += 3) {
      positions[i] -= dt * 9
      if (positions[i] < 0.1) positions[i] = 10
    }
    ;(points.current.geometry.attributes.position as BufferAttribute).needsUpdate = true
  })

  return (
    <points visible={active && enabled} ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.035} color="#c2dce9" transparent opacity={0.5} depthWrite={false} />
    </points>
  )
}
