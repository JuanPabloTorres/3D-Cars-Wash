import { useEffect, useMemo } from 'react'
import { CanvasTexture, SRGBColorSpace } from 'three'
import { RoundedBox } from '@react-three/drei'

interface SignProps {
  heading: string
  body: string
  footer: string
  accent: string
  kind: 'hours' | 'offers'
}

/** A physical wall sign: its printed face participates in depth and lighting.
 * Long configuration text is bounded; the detail panel retains the complete text. */
export function WallInformationSign({ heading, body, footer, accent, kind }: SignProps) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')

    canvas.width = 1024
    canvas.height = 680

    const map = new CanvasTexture(canvas)

    map.colorSpace = SRGBColorSpace

    return map
  }, [])

  useEffect(() => {
    let disposed = false
    const draw = () => {
      if (disposed) return

      const ctx = (texture.image as HTMLCanvasElement).getContext('2d')!

      ctx.fillStyle = '#203039'
      ctx.fillRect(0, 0, 1024, 680)
      ctx.strokeStyle = '#52616a'
      ctx.lineWidth = 2
      ctx.strokeRect(16, 16, 992, 648)
      ctx.fillStyle = accent
      ctx.fillRect(54, 56, 8, 86)
      ctx.font = '600 58px "Manrope Variable", sans-serif'
      ctx.fillText(heading, 100, 115)
      ctx.strokeStyle = '#65747b'
      ctx.beginPath()
      ctx.moveTo(54, 172)
      ctx.lineTo(970, 172)
      ctx.stroke()
      ctx.font = '500 66px "Manrope Variable", sans-serif'
      ctx.fillStyle = '#f0f2eb'

      const lines: string[] = []

      for (const paragraph of body.split('\n')) {
        let line = ''

        for (const word of paragraph.split(/\s+/)) {
          const next = line ? `${line} ${word}` : word

          if (ctx.measureText(next).width > 910 && line) {
            lines.push(line)
            line = word
          } else line = next
        }
        lines.push(line)
      }
      lines.slice(0, 4).forEach((line, index) => {
        let text = line

        if (index === 3 && lines.length > 4) text += '…'
        while (ctx.measureText(text).width > 910) text = text.slice(0, -2) + '…'
        ctx.fillText(text, 54, 260 + index * 80)
      })
      ctx.fillStyle = accent
      ctx.font = '500 46px "Manrope Variable", sans-serif'
      ctx.fillText(footer, 54, 612, 820)
      ctx.strokeStyle = accent
      ctx.lineWidth = 5
      ctx.beginPath()
      ctx.arc(935, 596, 24, 0, Math.PI * 2)
      ctx.stroke()
      ctx.font = '600 34px "Manrope Variable", sans-serif'
      ctx.fillText(kind === 'offers' ? '%' : 'i', kind === 'offers' ? 920 : 931, 608)
      texture.needsUpdate = true
    }

    draw()
    void document.fonts.ready.then(draw)

    return () => {
      disposed = true
    }
  }, [texture, heading, body, footer, accent, kind])
  useEffect(() => () => texture.dispose(), [texture])

  return (
    <group name={`wall-information-sign:${kind}`}>
      <RoundedBox args={[1.46, 0.97, 0.035]} radius={0.012} castShadow receiveShadow>
        <meshStandardMaterial color="#33434a" roughness={0.65} metalness={0.15} />
      </RoundedBox>
      <mesh position-z={0.019} receiveShadow>
        <planeGeometry args={[1.44, 0.955]} />
        <meshStandardMaterial map={texture} roughness={0.9} metalness={0} />
      </mesh>
      {[-0.69, 0.69].flatMap((x) =>
        [-0.445, 0.445].map((y) => (
          <mesh key={`${x}:${y}`} position={[x, y, 0.022]} rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[0.009, 0.009, 0.004, 12]} />
            <meshStandardMaterial color="#a0a9aa" metalness={0.65} roughness={0.35} />
          </mesh>
        )),
      )}
    </group>
  )
}
