import { Html } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useApp } from '../../../app/store'
import { useCommerce } from '../../../app/commerceStore'
import { StaffPrefab } from '../../prefabs/StaffPrefab'
import { receptionPlan } from './receptionPlan'

export type CounterAction = 'services' | 'hours' | 'information' | 'questions' | 'offers'

/** Accessible hit target projected over the physical object, not a second toolbar. */
export function CounterHotspot({
  label,
  description,
  at,
  width = 55,
  height = 80,
  onActivate,
  occlude = false,
}: {
  label: string
  description?: string
  at: [number, number, number]
  width?: number
  height?: number
  onActivate?: () => void
  occlude?: boolean
}) {
  const showing = useApp((s) => s.dialogue || s.orderOpen)

  if (!onActivate || showing) return null

  return (
    <Html center position={at} distanceFactor={6} occlude={occlude} zIndexRange={[20, 10]}>
      <button
        className="counter-hotspot"
        style={{ width, height }}
        aria-label={label}
        aria-description={description}
        onClick={onActivate}
      >
        <span>{label}</span>
        <i aria-hidden="true">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M8 13V4a2 2 0 0 1 4 0v6l2-.5 5 2.5c1 .5 1.5 1.5 1.2 2.7l-1 4.7c-.3 1.4-1.5 2.6-3 2.6h-5c-1.3 0-2.3-.7-3.1-1.7l-4.3-5.8a1.8 1.8 0 0 1 2.6-2.4L8 14" />
          </svg>
        </i>
      </button>
    </Html>
  )
}

export function welcomeAna() {
  useCommerce.getState().updateDraft({ step: 'welcome' })
  useApp.getState().set({ dialogue: true, orderOpen: false, interaction: 'reception' })
}

export function ReceptionHost({ active }: { active: boolean }) {
  const mobile = useThree((s) => s.size.width <= 700)
  const dialogue = useApp((s) => s.dialogue),
    order = useApp((s) => s.orderOpen)

  return (
    <group
      onClick={
        active
          ? (e) => {
              e.stopPropagation()
              welcomeAna()
            }
          : undefined
      }
      onPointerOver={
        active
          ? () => {
              document.body.style.cursor = 'pointer'
            }
          : undefined
      }
      onPointerOut={() => {
        document.body.style.cursor = ''
      }}
    >
      <StaffPrefab role="receptionist" position={receptionPlan.ana} greetWhileWelcome />
      {active && (
        <group position={receptionPlan.ana}>
          <CounterHotspot
            at={[0, 1.42, 0.18]}
            width={68}
            height={130}
            label="Hablar con Ana"
            onActivate={welcomeAna}
          />
          {!order && !dialogue && (
            <Html
              center
              position={[mobile ? 0.5 : 0.46, 1.67, 0.05]}
              zIndexRange={[18, 8]}
              style={{ pointerEvents: 'none' }}
            >
              <aside className="ana-speech">
                <strong>{mobile ? '¡Hola!' : '¡Hola! Soy Ana.'}</strong>
                <span>{mobile ? 'Tócame' : 'Tócame para hablar.'}</span>
              </aside>
            </Html>
          )}
        </group>
      )}
    </group>
  )
}
