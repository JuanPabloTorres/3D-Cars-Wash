import { Billboard } from '@react-three/drei'
import { AdditiveBlending, Color } from 'three'

const lensUniforms = {
  core: { value: new Color('#fff1ce') },
  edge: { value: new Color('#e8b267') },
}
const haloUniforms = { glowColor: { value: new Color('#ffd297') } }
const vertexShader = `
  varying vec2 lensUv;
  void main() {
    lensUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const lensFragment = `
  uniform vec3 core;
  uniform vec3 edge;
  varying vec2 lensUv;
  void main() {
    float center = pow(max(sin(lensUv.y * 3.14159265), 0.0), 0.42);
    gl_FragColor = vec4(mix(edge, core, center), 1.0);
    #include <colorspace_fragment>
  }
`
const haloFragment = `
  uniform vec3 glowColor;
  varying vec2 lensUv;
  void main() {
    vec2 p = (lensUv - 0.5) * 2.0;
    float radius = length(p);
    float glow = exp(-4.5 * dot(p, p)) * (1.0 - smoothstep(0.65, 1.0, radius));
    gl_FragColor = vec4(glowColor, 0.16 * glow);
    #include <colorspace_fragment>
  }
`

/** Emitting opal sleeve: warm edges, a pale luminous core and a bounded optical
 * halo. Depth testing keeps the halo behind scene occluders. Nearby illumination
 * remains a real point light owned by LightingLandscapeLayer. */
export function WarmDiffuser() {
  return <group position-y={1.09}>
    <mesh>
      <cylinderGeometry args={[.128, .128, .34, 48]} />
      <shaderMaterial uniforms={lensUniforms} vertexShader={vertexShader} fragmentShader={lensFragment} toneMapped={false} />
    </mesh>
    <Billboard>
      <mesh position-z={.15}>
        <planeGeometry args={[.64, .8]} />
        <shaderMaterial uniforms={haloUniforms} vertexShader={vertexShader} fragmentShader={haloFragment}
          transparent blending={AdditiveBlending} depthTest depthWrite={false} toneMapped={false} />
      </mesh>
    </Billboard>
  </group>
}

/** Pendant lens uses the same warm palette and bounded halo as garden lights. */
export function WarmPendantLens() {
  return <group>
    <mesh rotation-x={Math.PI / 2}>
      <circleGeometry args={[.245,48]} />
      <shaderMaterial uniforms={lensUniforms} vertexShader={vertexShader} toneMapped={false}
        fragmentShader={`uniform vec3 core; uniform vec3 edge; varying vec2 lensUv;
          void main() { float r = length((lensUv-.5)*2.);
          gl_FragColor=vec4(mix(core,edge,smoothstep(.45,1.,r)),1.);
          #include <colorspace_fragment>
          }`} />
    </mesh>
    <Billboard><mesh position-y={-.025}>
      <planeGeometry args={[.72,.22]} />
      <shaderMaterial uniforms={haloUniforms} vertexShader={vertexShader} fragmentShader={haloFragment}
        transparent blending={AdditiveBlending} depthTest depthWrite={false} toneMapped={false} />
    </mesh></Billboard>
  </group>
}
