import type { VehicleType } from './commerce.ts'

export interface ServiceContent {
  id: string
  label: string
  description: string
  includes: string
  conditions: string
  care: string
  available?: boolean
}

export interface BusinessContent {
  name: string
  hours: string | null
  contact: { label: string; href: string } | null
  social: { label: string; href: string }[]
  offers: { id: string; title: string; description: string; expiresAt: string }[]
  process: string
  conditions: string
  updatedAt: string
  contactRequestsAvailable: boolean
}

export interface PricingConfiguration {
  version: string
  currency: string
  taxBasisPoints: number
  allServicesDiscountCents: number
  prices: Record<VehicleType, Record<string, number | null>>
  durations?: Record<VehicleType, Record<string, number | null>>
  services?: ServiceContent[]
  business?: BusinessContent
}

/** Only established project content. Empty fields are deliberate, never guessed. */
export const businessContent: BusinessContent = {
  name: 'CarWash Studio',
  hours: null,
  contact: null,
  social: [] as { label: string; href: string }[],
  offers: [] as { id: string; title: string; description: string; expiresAt: string }[],
  process:
    'Prepara los servicios y el vehículo, revisa la cotización y confirma tu solicitud. El personal debe confirmar llegada, atención, pago y entrega.',
  conditions:
    'El alcance se revisa con el personal. La visita virtual no confirma presencia física, pagos ni garantías.',
  updatedAt: '2026-10-23',
  contactRequestsAvailable: false,
}

export type QuestionTopic = 'services' | 'hours' | 'process' | 'conditions' | 'other'

export function answerBusinessQuestion(
  topic: QuestionTopic,
  content: BusinessContent = businessContent,
  services: ServiceContent[] = [],
) {
  switch (topic) {
    case 'services':
      return {
        known: services.length > 0,
        text: services.length
          ? `Servicios disponibles: ${services
              .filter((s) => s.available !== false)
              .map((s) => s.label)
              .join(', ')}. Revisa sus inclusiones antes de confirmar.`
          : 'Consulta el catálogo vigente con recepción.',
      }
    case 'hours':
      return {
        known: !!content.hours,
        text:
          content.hours ||
          'El horario del establecimiento todavía no está configurado. No puedo confirmarlo.',
      }
    case 'process':
      return { known: true, text: content.process }
    case 'conditions':
      return { known: true, text: content.conditions }
    default:
      return {
        known: false,
        text: 'No tengo información autorizada para responder esa pregunta. Necesita revisión del establecimiento.',
      }
  }
}
