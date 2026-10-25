import { Suspense, useEffect, useRef, useState } from 'react'
import { Html, Image, RoundedBox, Text, useCursor } from '@react-three/drei'
import { BookOpen, Clock3, MapPin, MessageCircle } from 'lucide-react'
import { useApp } from '../../app/store'
import { useCommerce } from '../../app/commerceStore'

const exhibits = [
  { label: 'Servicios', step: 'services', Icon: BookOpen, kind: 'catalogue', x: -7.55 },
  { label: 'Horarios', step: 'information', Icon: Clock3, kind: 'clock', x: -6.85 },
  { label: 'El local', step: 'information', Icon: MapPin, kind: 'flyer', x: -5.15 },
  { label: 'Preguntas', step: 'questions', Icon: MessageCircle, kind: 'tablet', x: -4.45 },
] as const

type PropKind = (typeof exhibits)[number]['kind']

type V3 = [number, number, number]

function PropBox({
  at,
  size,
  color,
  rotation = [0, 0, 0],
}: {
  at: V3
  size: V3
  color: string
  rotation?: V3
}) {
  const radius = Math.min(0.025, Math.min(...size) * 0.24)

  return (
    <RoundedBox
      args={size}
      radius={radius}
      smoothness={2}
      position={at}
      rotation={rotation}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial color={color} roughness={0.66} />
    </RoundedBox>
  )
}

function PropLabel({
  children,
  at,
  size = 0.043,
  color = '#172b35',
}: {
  children: string
  at: V3
  size?: number
  color?: string
}) {
  return (
    <Text
      position={at}
      font="/fonts/manrope-medium.ttf"
      fontSize={size}
      color={color}
      anchorX="center"
      anchorY="middle"
    >
      {children}
    </Text>
  )
}

function CounterClock() {
  return (
    <>
      <PropBox at={[0, 0.025, 0]} size={[0.29, 0.05, 0.18]} color="#343c40" />
      <mesh position={[0, 0.265, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.225, 0.225, 0.065, 48]} />
        <meshStandardMaterial color="#876443" roughness={0.68} />
      </mesh>
      <mesh position={[0, 0.265, 0.035]}>
        <circleGeometry args={[0.202, 48]} />
        <meshStandardMaterial color="#f1e9d5" roughness={0.86} />
      </mesh>
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i * Math.PI) / 6

        return (
          <PropBox
            key={i}
            at={[Math.sin(angle) * 0.175, 0.265 + Math.cos(angle) * 0.175, 0.038]}
            size={[0.012, 0.032, 0.006]}
            color="#273c43"
            rotation={[0, 0, -angle]}
          />
        )
      })}
      {/* An illustrative dial identifies the object; business hours remain provider content. */}
      <PropBox
        at={[-0.025, 0.292, 0.045]}
        size={[0.012, 0.105, 0.008]}
        color="#273c43"
        rotation={[0, 0, 0.75]}
      />
      <PropBox
        at={[0.045, 0.272, 0.05]}
        size={[0.13, 0.009, 0.008]}
        color="#273c43"
        rotation={[0, 0, 0.15]}
      />
      <mesh position={[0, 0.265, 0.055]}>
        <circleGeometry args={[0.014, 16]} />
        <meshStandardMaterial color="#a52a33" />
      </mesh>
    </>
  )
}

function PaperDisplay({ flyer }: { flyer: boolean }) {
  return (
    <>
      <PropBox at={[0, 0.02, 0]} size={[0.42, 0.04, 0.23]} color="#454a49" />
      <group position={[0, 0.265, 0]} rotation={[-0.12, 0, 0]}>
        <PropBox at={[0, 0, 0]} size={[0.37, 0.46, 0.022]} color="#d5c9b0" />
        <PropBox at={[0, 0, 0.015]} size={[0.347, 0.438, 0.01]} color="#f3efdf" />
        {!flyer && (
          <>
            <PropBox at={[-0.145, 0, 0.026]} size={[0.032, 0.438, 0.014]} color="#ae3039" />
            <PropBox
              at={[0.167, 0, -0.028]}
              size={[0.045, 0.438, 0.012]}
              color="#e2d7c1"
              rotation={[0, -0.55, 0]}
            />
          </>
        )}
        <PropLabel at={[flyer ? 0 : 0.015, 0.125, 0.027]}>
          {flyer ? 'EL LOCAL' : 'SERVICIOS'}
        </PropLabel>
        {flyer ? (
          <>
            <PropBox at={[0, 0.025, 0.028]} size={[0.255, 0.026, 0.008]} color="#ad323a" />
            {[-0.09, 0, 0.09].map((x) => (
              <PropBox
                key={x}
                at={[x, -0.035, 0.029]}
                size={[0.065, 0.09, 0.009]}
                color="#53685f"
              />
            ))}
            <PropBox at={[0, -0.12, 0.028]} size={[0.25, 0.008, 0.008]} color="#7b887c" />
          </>
        ) : (
          <>
            <Suspense
              fallback={
                <PropBox at={[0.012, 0.015, 0.028]} size={[0.235, 0.132, 0.008]} color="#53685f" />
              }
            >
              <Image
                url="/textures/services/exterior.webp"
                position={[0.012, 0.015, 0.03]}
                scale={[0.235, 0.132]}
              />
            </Suspense>
            {[-0.095, -0.14, -0.18].map((y) => (
              <PropBox key={y} at={[0.012, y, 0.028]} size={[0.23, 0.009, 0.008]} color="#7a8377" />
            ))}
          </>
        )}
      </group>
    </>
  )
}

function QuestionTablet() {
  return (
    <>
      <PropBox at={[0, 0.02, 0]} size={[0.37, 0.04, 0.24]} color="#343c40" />
      <PropBox
        at={[0, 0.115, -0.035]}
        size={[0.07, 0.2, 0.06]}
        color="#343c40"
        rotation={[-0.2, 0, 0]}
      />
      <group position={[0, 0.265, 0.01]} rotation={[-0.16, 0, 0]}>
        <PropBox at={[0, 0, 0]} size={[0.36, 0.43, 0.025]} color="#24343c" />
        <PropBox at={[0, 0, 0.021]} size={[0.322, 0.392, 0.009]} color="#142c37" />
        <PropBox at={[-0.025, 0.045, 0.028]} size={[0.19, 0.07, 0.008]} color="#c9d8da" />
        <PropBox
          at={[-0.085, 0.008, 0.028]}
          size={[0.025, 0.045, 0.008]}
          color="#c9d8da"
          rotation={[0, 0, -0.5]}
        />
        <PropLabel at={[0, -0.115, 0.03]} size={0.037} color="#e8eddf">
          PREGUNTAS
        </PropLabel>
      </group>
    </>
  )
}

function CounterProp({ kind }: { kind: PropKind }) {
  if (kind === 'clock') return <CounterClock />
  if (kind === 'tablet') return <QuestionTablet />

  return <PaperDisplay flyer={kind === 'flyer'} />
}

/** Four permanent counter props; HTML equivalents remain screen-sized for touch and keyboard.
 * Only opens existing reception steps. Preparing an order stays in Ana's dialogue. */
export function CounterObjects() {
  const app = useApp()
  const buttons = useRef<Array<HTMLButtonElement | null>>([])
  const returnTo = useRef<number | null>(null)
  const [hovered, setHovered] = useState(false)
  const atReception = app.activeView === 'reception' && !app.destination
  const controlsVisible =
    atReception &&
    !app.dialogue &&
    !app.menu &&
    !app.orderOpen &&
    !app.localOpen &&
    !app.accountOpen &&
    !app.flowOpen &&
    !app.help

  useCursor(hovered && controlsVisible)
  useEffect(() => {
    if (!controlsVisible) setHovered(false)
    if (!atReception) returnTo.current = null
    if (controlsVisible && returnTo.current !== null) {
      const index = returnTo.current

      returnTo.current = null

      // Run after the closing panel restores its own prior focus.
      const frame = requestAnimationFrame(() =>
        buttons.current[index]?.focus({ preventScroll: true }),
      )

      return () => cancelAnimationFrame(frame)
    }
  }, [controlsVisible, atReception])

  const activate = (index: number) => {
    if (!controlsVisible) return
    returnTo.current = index
    useCommerce.getState().updateDraft({ step: exhibits[index].step })
    app.set({
      dialogue: true,
      informationTopic: exhibits[index].kind === 'clock' ? 'hours' : 'overview',
      orderOpen: false,
      localOpen: false,
      accountOpen: false,
      flowOpen: false,
    })
  }

  return (
    <group name="reception-counter-props">
      {exhibits.map(({ label, Icon, kind, x }, i) => (
        <group
          key={kind}
          position={[x, 1.22, 0.35]}
          name={`counter-prop-${kind}`}
          onClick={(e) => {
            if (controlsVisible) {
              e.stopPropagation()
              activate(i)
            }
          }}
          onPointerOver={(e) => {
            if (controlsVisible) {
              e.stopPropagation()
              setHovered(true)
            }
          }}
          onPointerOut={() => setHovered(false)}
        >
          <group scale={0.72}>
            <CounterProp kind={kind} />
          </group>
          {atReception && (
            <Html position={[0, -0.045, 0.22]} center zIndexRange={[10, 0]}>
              <button
                ref={(el) => {
                  buttons.current[i] = el
                }}
                className={`counter-display counter-${kind}`}
                style={{ visibility: controlsVisible ? 'visible' : 'hidden' }}
                disabled={!controlsVisible}
                aria-label={`Abrir ${label} del mostrador`}
                onClick={(e) => {
                  e.stopPropagation()
                  activate(i)
                }}
              >
                <Icon size={16} aria-hidden="true" />
                <span>{label}</span>
              </button>
            </Html>
          )}
        </group>
      ))}
    </group>
  )
}
