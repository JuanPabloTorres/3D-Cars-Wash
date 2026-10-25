/** Owns the customer draft and confirmed server snapshots. Requests carry the session nonce; UI state cannot authorize transactions. */
import { create } from 'zustand'
import {
  emptyDraft,
  type CommercialOrder,
  type Quote,
  type VisitDraft,
  type CommerceSnapshot,
  type SessionProfile,
  type ContactRequest,
} from '../domain/commerce'
import type { PricingConfiguration } from '../domain/businessContent'

const draftKey = 'febles.demo.draft.v1'

function restoreDraft(): VisitDraft {
  try {
    const value = JSON.parse(sessionStorage.getItem(draftKey) || 'null')

    if (value && Array.isArray(value.services) && value.vehicle)
      return { ...emptyDraft(), ...value }
  } catch {}

  return emptyDraft()
}

let nonce = '',
  requestGeneration = 0,
  sessionEpoch = 0

export async function demoRequest(path: string, data?: unknown) {
  const response = await fetch(`/api/demo/${path}`, {
    method: data ? 'POST' : 'GET',
    credentials: 'same-origin',
    headers: data ? { 'Content-Type': 'application/json', 'X-Demo-Nonce': nonce } : {},
    body: data ? JSON.stringify(data) : undefined,
    signal: AbortSignal.timeout(8000),
  })
  const result = await response.json()

  if (!response.ok)
    throw Object.assign(new Error(result.error || 'No se pudo completar la solicitud DEMO.'), {
      status: response.status,
    })

  return result
}

interface CommerceState {
  draft: VisitDraft
  quote: Quote | null
  order: CommercialOrder | null
  revision: number
  connected: boolean
  busy: boolean
  error: string | null
  loaded: boolean
  pricing: PricingConfiguration | null
  requestFailed: boolean
  profile: SessionProfile
  history: CommercialOrder[]
  requests: ContactRequest[]
  authenticate: (
    register: boolean,
    data: { username: string; password: string; name: string },
  ) => Promise<void>
  updateDraft: (patch: Partial<VisitDraft>) => void
  discard: () => void
  refresh: (silent?: boolean) => Promise<void>
  prepareQuote: () => Promise<boolean>
  confirm: () => Promise<boolean>
  requestArrival: () => Promise<boolean>
  cancel: () => Promise<boolean>
  clearError: () => void
  receive: (snapshot: CommerceSnapshot) => void
  logout: () => Promise<void>
  saveProfile: (name: string) => Promise<void>
}

export const useCommerce = create<CommerceState>((set, get) => {
  const accept = (snapshot: CommerceSnapshot) => {
    if (snapshot.revision >= get().revision)
      set({
        revision: snapshot.revision,
        order: snapshot.order,
        profile: snapshot.profile || get().profile,
        history: snapshot.history || [],
        requests: snapshot.requests || [],
        connected: true,
        loaded: true,
      })
  }

  return {
    draft: restoreDraft(),
    quote: null,
    order: null,
    revision: -1,
    connected: false,
    busy: false,
    error: null,
    loaded: false,
    pricing: null,
    requestFailed: false,
    profile: { name: 'Visitante' },
    history: [],
    requests: [],
    receive: accept,
    authenticate: async (register, data) => {
      const result = await demoRequest(register ? 'auth/register' : 'auth/login', data)

      sessionEpoch++
      requestGeneration++
      nonce = result.nonce
      set({ revision: -1, quote: null, error: null })
      accept(result)
    },
    saveProfile: async (name) => {
      const epoch = sessionEpoch,
        result = await demoRequest('profile', { name })

      if (epoch === sessionEpoch) accept(result)
    },
    logout: async () => {
      sessionEpoch++
      requestGeneration++
      await demoRequest('logout', {})
      get().discard()
      nonce = ''
      set({ revision: -1, order: null, profile: { name: 'Visitante' }, history: [], requests: [] })
      await get().refresh()
    },
    updateDraft: (patch) => {
      const invalidates = !!(patch.services || patch.vehicle)

      if (invalidates) requestGeneration++

      const draft = { ...get().draft, ...patch }

      sessionStorage.setItem(draftKey, JSON.stringify(draft))
      set({
        draft,
        quote: invalidates ? null : get().quote,
        error: null,
        ...(invalidates ? { busy: false } : {}),
      })
    },
    discard: () => {
      requestGeneration++
      sessionStorage.removeItem(draftKey)
      set({ draft: emptyDraft(), quote: null, error: null, busy: false })
    },
    clearError: () => set({ error: null }),
    refresh: async (silent = false) => {
      const epoch = sessionEpoch

      try {
        const [result, pricing] = await Promise.all([
          demoRequest('session'),
          demoRequest('catalog'),
        ])

        if (epoch !== sessionEpoch) return
        if (nonce && result.nonce !== nonce)
          set({
            revision: -1,
            order: null,
            quote: null,
            error: 'La sesión cambió o venció. Consultando el estado de la sesión actual.',
          })
        nonce = result.nonce
        set({ pricing, ...(!silent ? { requestFailed: false } : {}) })
        accept(result)
      } catch {
        if (epoch === sessionEpoch) set({ connected: false, loaded: true })
      }
    },
    prepareQuote: async () => {
      if (get().busy) return false

      const generation = ++requestGeneration

      set({ busy: true, error: null, requestFailed: false })
      try {
        const q = await demoRequest('quote', {
          services: get().draft.services,
          vehicle: get().draft.vehicle,
        })

        if (generation !== requestGeneration) return false
        set({ quote: q, connected: true })
        get().updateDraft({ step: 'review' })

        return true
      } catch (e) {
        const status = (e as { status?: number }).status

        if (generation === requestGeneration)
          set({
            error: e instanceof Error ? e.message : 'No se pudo cotizar.',
            requestFailed: !status || status >= 500,
            connected: typeof status === 'number' && status >= 400 && status < 500,
          })

        return false
      } finally {
        if (generation === requestGeneration) set({ busy: false })
      }
    },
    confirm: async () => {
      if (get().busy || !get().quote) return false
      set({ busy: true, error: null })

      const q = get().quote!,
        epoch = sessionEpoch

      try {
        const result = await demoRequest('confirm', { quoteId: q.id, key: q.id })

        if (epoch !== sessionEpoch) return false
        accept(result)
        sessionStorage.removeItem(draftKey)
        set({ draft: emptyDraft(), quote: null })

        return true
      } catch (e) {
        if (epoch === sessionEpoch)
          set({ error: e instanceof Error ? e.message : 'No se pudo confirmar.' })

        return false
      } finally {
        if (epoch === sessionEpoch) set({ busy: false })
      }
    },
    requestArrival: async () => {
      const order = get().order

      if (get().busy || !order || order.status !== 'confirmed' || order.attention !== 'not-arrived')
        return false
      set({ busy: true, error: null })

      const epoch = sessionEpoch

      try {
        const result = await demoRequest('arrival-request', { orderId: order.id })

        if (epoch !== sessionEpoch) return false
        accept(result)

        return true
      } catch (e) {
        if (epoch === sessionEpoch)
          set({
            error: e instanceof Error ? e.message : 'No se pudo solicitar la revisión de llegada.',
          })

        return false
      } finally {
        if (epoch === sessionEpoch) set({ busy: false })
      }
    },
    cancel: async () => {
      if (get().busy || !get().order) return false
      set({ busy: true, error: null })

      const epoch = sessionEpoch

      try {
        const result = await demoRequest('cancel', { orderId: get().order!.id })

        if (epoch !== sessionEpoch) return false
        accept(result)

        return true
      } catch (e) {
        if (epoch === sessionEpoch)
          set({ error: e instanceof Error ? e.message : 'No se pudo cancelar.' })

        return false
      } finally {
        if (epoch === sessionEpoch) set({ busy: false })
      }
    },
  }
})
