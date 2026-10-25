import { useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { BackSide, Color, ShaderMaterial } from 'three'
import { useApp } from '../app/store'

/** Atmospheric shader, not a flat scene backdrop or an external image dependency. */
export function AtmosphericClouds() {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        side: BackSide,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
        uniforms: {
          time: { value: 0 },
          cover: { value: 0.15 },
          tint: { value: new Color('#f2f4ef') },
        },
        vertexShader: `varying vec3 direction;void main(){direction=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
        fragmentShader: `varying vec3 direction;uniform float time;uniform float cover;uniform vec3 tint;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);}
 void main(){vec3 d=normalize(direction);vec2 p=d.xz/max(.12,d.y)*2.4+vec2(time*.004,0.);float n=noise(p)*.55+noise(p*2.1)*.27+noise(p*4.3)*.13;float a=smoothstep(.86-cover*.62,1.-cover*.35,n)*smoothstep(.035,.22,d.y);gl_FragColor=vec4(tint,a*.86);}`,
      }),
    [],
  )

  useEffect(() => () => material.dispose(), [material])

  const color = useMemo(() => new Color(), [])

  useFrame((_, raw) => {
    const kind = useApp.getState().weather.kind,
      t = 1 - Math.exp(-Math.min(raw, 0.05) * 1.2),
      target = kind === 'overcast' || kind === 'rain' ? 0.95 : kind === 'partly-cloudy' ? 0.7 : 0.2

    material.uniforms.cover.value += (target - material.uniforms.cover.value) * t
    material.uniforms.time.value += Math.min(raw, 0.05)
    material.uniforms.tint.value.lerp(
      color.set(
        kind === 'night'
          ? '#182a3b'
          : kind === 'rain'
            ? '#86959e'
            : kind === 'sunset'
              ? '#efb08b'
              : '#f2f4ef',
      ),
      t,
    )
  })

  return (
    <mesh material={material} renderOrder={-1}>
      <sphereGeometry args={[440, 24, 16]} />
    </mesh>
  )
}
