/** Presents the reception steps using the existing customer draft, quotation and server confirmation actions. */
import { VehicleCategoryButtons } from './VehicleCategoryButtons'
import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  CarFront,
  Check,
  Info,
  ReceiptText,
  Sparkles,
  MessageCircle,
  Clock,
} from 'lucide-react'
import { useApp } from '../app/store'
import { useCommerce } from '../app/commerceStore'
import { validateRegistration, vehicleTypeLabels, type VehicleType } from '../domain/commerce'
import { useBusiness, useServices } from '../app/business'
import { WorldPanel } from '../ui/WorldOverlayManager'
import { money } from '../world/interactions/OrderStatusCard'
import { BusinessInformation, BusinessQuestions, BusinessOffers } from './BusinessInformation'
import { appConfig } from '../config/appConfig'

export function ReceptionDialogue({ compactWelcome = false }: { compactWelcome?: boolean }) {
  const commerce = useCommerce(),
    { draft, quote, busy } = commerce,
    [detail, setDetail] = useState<string | null>(null),
    [validation, setValidation] = useState<string | null>(null),
    [now, setNow] = useState(Date.now())
  const business = useBusiness(),
    services = useServices()
  const informationTopic = useApp((s) => s.informationTopic)

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)

    return () => clearInterval(timer)
  }, [])

  const step = draft.step,
    go = (step: typeof draft.step) => commerce.updateDraft({ step })
  const [welcome, setWelcome] = useState(() =>
    sessionStorage.getItem('febles.welcome.seen') ? 3 : 0,
  )
  const greet = [
    `¡Bienvenido a ${business.name}! Soy Ana.`,
    `Puedes consultar ${services
      .filter((s) => s.available !== false)
      .map((s) => s.label)
      .slice(0, 5)
      .join(', ')}.`,
    'Puedo ayudarte a elegir servicios, preparar tu solicitud o consultar tu orden. ¿Tienes alguna duda?',
  ]
  const remember = () => {
    sessionStorage.setItem('febles.welcome.seen', 'true')
    setWelcome(3)
  }
  const close = () => useApp.getState().set({ dialogue: false }),
    openOrder = () =>
      useApp.getState().set({ dialogue: false, orderOpen: true, orderExpanded: true })
  const back = () => go(step === 'review' ? 'vehicle' : step === 'vehicle' ? 'services' : 'welcome')
  const register = async () => {
    const error = validateRegistration(draft.vehicle)

    setValidation(error)
    if (!error) await commerce.prepareQuote()
  }
  const titles = {
    welcome: 'Ana · Recepción',
    services: 'Servicios',
    vehicle: 'Tu vehículo',
    review: 'Revisar cotización',
    questions: 'Preguntas a Ana',
    information:
      informationTopic === 'offers'
        ? 'Ofertas vigentes'
        : informationTopic === 'hours'
          ? 'Horarios'
          : 'Información del establecimiento',
  }
  const flowSteps = ['services', 'vehicle', 'review'],
    flowIndex = flowSteps.indexOf(step)

  return (
    <WorldPanel
      title={titles[step]}
      subtitle={`ANA · RECEPCIÓN · ${appConfig.demoLabel.toUpperCase()}`}
      contextKey={step}
      onClose={close}
      className={`reception-panel step-${step}`}
    >
      {flowIndex >= 0 && (
        <ol className="request-steps" aria-label="Preparar solicitud">
          {['Servicios', 'Vehículo', 'Revisión'].map((label, index) => (
            <li key={label} aria-current={flowIndex === index ? 'step' : undefined}>
              <span aria-hidden="true">{index + 1}</span>
              {label}
            </li>
          ))}
        </ol>
      )}
      {step === 'welcome' && !compactWelcome && (
        <>
          <p className="speech">
            {commerce.order?.status === 'confirmed'
              ? commerce.order.attention === 'not-arrived'
                ? 'Tu solicitud está confirmada. Falta confirmar tu llegada.'
                : commerce.order.attention === 'ready'
                  ? 'Tu vehículo está listo para la revisión final y entrega.'
                  : 'Tu solicitud está confirmada. Puedes consultar el estado de atención.'
              : welcome < 3
                ? greet[welcome]
                : 'Qué bueno verte de nuevo. ¿En qué puedo ayudarte?'}
          </p>
          {welcome < 3 && (
            <button
              className="greeting-next text-button"
              onClick={() => {
                if (welcome === 2) remember()
                else setWelcome(welcome + 1)
              }}
            >
              {welcome === 2 ? 'Entendido' : 'Siguiente mensaje'}{' '}
              <span aria-hidden="true">{welcome + 1}/3</span>
            </button>
          )}
          <div className="intent-actions">
            <button
              onClick={() => {
                remember()
                go('services')
              }}
            >
              <Sparkles />
              <span>
                Conocer servicios<small>Descubre el cuidado adecuado</small>
              </span>
              <ArrowRight />
            </button>
            <button
              onClick={() => {
                remember()
                go(draft.services.length ? 'vehicle' : 'services')
              }}
            >
              <CarFront />
              <span>
                {draft.services.length ? 'Retomar mi solicitud' : 'Preparar mi orden'}
                <small>Servicios, vehículo y cotización</small>
              </span>
              <ArrowRight />
            </button>
            <button onClick={openOrder}>
              <ReceiptText />
              <span>
                Consultar mi orden<small>Estado y acciones disponibles</small>
              </span>
              <ArrowRight />
            </button>
            <button
              onClick={() => {
                remember()
                go('questions')
              }}
            >
              <MessageCircle />
              <span>
                Preguntar a Ana<small>Servicios, horarios y condiciones</small>
              </span>
              <ArrowRight />
            </button>
          </div>
          <button
            className="text-button"
            onClick={() => {
              useApp.getState().set({ informationTopic: 'hours' })
              go('information')
            }}
          >
            <Clock size={15} /> Horarios e información
          </button>
          <p className="muted">Demostración · pagos y llegada requieren atención presencial.</p>
        </>
      )}
      {step === 'welcome' && compactWelcome && (
        <>
          <p className="speech">¡Bienvenido a {business.name}!</p>
          <p className="muted">
            Soy Ana. Es un gusto recibirte. Te invito a conocer los servicios que ofrecemos para
            cuidar tu vehículo.
          </p>
          <div className="intent-actions">
            <button
              onClick={() => {
                remember()
                go('services')
              }}
            >
              <Sparkles />
              <span>Ver servicios</span>
              <ArrowRight />
            </button>
            <button
              onClick={() => {
                remember()
                go(draft.services.length ? 'vehicle' : 'services')
              }}
            >
              <CarFront />
              <span>Preparar mi orden</span>
              <ArrowRight />
            </button>
            <button
              onClick={() => {
                remember()
                go('questions')
              }}
            >
              <MessageCircle />
              <span>Tengo una pregunta</span>
              <ArrowRight />
            </button>
          </div>
        </>
      )}
      {step === 'questions' && <BusinessQuestions />}
      {step === 'information' &&
        (informationTopic === 'offers' ? (
          <BusinessOffers />
        ) : (
          <BusinessInformation hoursFirst={informationTopic === 'hours'} showHeading={false} />
        ))}
      {step === 'services' && (
        <>
          <p className="speech">El cuidado que tu auto necesita.</p>
          {compactWelcome ? (
            <VehicleCategoryButtons />
          ) : (
            <label className="field catalog-category">
              Tarifas por vehículo
              <select
                value={draft.vehicle.type}
                onChange={(e) =>
                  commerce.updateDraft({
                    vehicle: { ...draft.vehicle, type: e.target.value as VehicleType },
                  })
                }
              >
                {Object.entries(vehicleTypeLabels).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          )}
          <p className="muted">
            Selecciona tus servicios. Precios DEMO en USD · Imágenes ilustrativas.
          </p>
          <div className="service-catalog">
            {services.map((s) => {
              const selected = draft.services.includes(s.id)
              const price = commerce.pricing?.prices[draft.vehicle.type]?.[s.id]

              return (
                <article className={`service-option ${selected ? 'selected' : ''}`} key={s.id}>
                  <img
                    src={`/textures/services/${['exterior', 'interior', 'lights'].includes(s.id) ? s.id : 'exterior'}.webp`}
                    alt={`Ilustración: ${s.description}`}
                    width="320"
                    height="180"
                  />
                  <div>
                    <h3>{s.label}</h3>
                    <span className="service-price">
                      {typeof price === 'number' ? money(price) : 'Requiere cotización'}{' '}
                      <small>DEMO</small>
                    </span>
                  </div>
                  <p className="service-description">{s.description}</p>
                  {detail === s.id && (
                    <div className="service-details">
                      <p>
                        <b>Incluye:</b> {s.includes}
                      </p>
                      <p>{s.conditions}</p>
                    </div>
                  )}
                  <div className="service-actions">
                    <button
                      className="text-button"
                      onClick={() => setDetail(detail === s.id ? null : s.id)}
                      aria-expanded={detail === s.id}
                    >
                      {detail === s.id ? 'Ocultar' : 'Ver detalles'}
                    </button>
                    <button
                      disabled={s.available === false && !selected}
                      aria-pressed={selected}
                      aria-label={`${selected ? 'Quitar' : 'Añadir'} ${s.label}`}
                      onClick={() =>
                        commerce.updateDraft({
                          services: selected
                            ? draft.services.filter((id) => id !== s.id)
                            : [...draft.services, s.id],
                        })
                      }
                    >
                      {selected ? <Check size={16} /> : <span>+</span>}
                      {selected ? 'Añadido' : s.available === false ? 'No disponible' : 'Añadir'}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
          <div className="sticky-action">
            <span>
              {draft.services.length}{' '}
              {draft.services.length === 1 ? 'servicio seleccionado' : 'servicios seleccionados'}
            </span>
            <button
              className="primary"
              disabled={!draft.services.length}
              onClick={() => go('vehicle')}
            >
              Continuar <ArrowRight size={17} />
            </button>
          </div>
        </>
      )}
      {step === 'vehicle' && (
        <>
          <p className="speech">Cuéntame sobre tu vehículo.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void register()
            }}
            noValidate
          >
            <label className="field">
              Tipo de vehículo
              <select
                value={draft.vehicle.type}
                onChange={(e) =>
                  commerce.updateDraft({
                    vehicle: { ...draft.vehicle, type: e.target.value as VehicleType },
                  })
                }
              >
                {Object.entries(vehicleTypeLabels).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Color
              <select
                value={draft.vehicle.color}
                onChange={(e) =>
                  commerce.updateDraft({ vehicle: { ...draft.vehicle, color: e.target.value } })
                }
              >
                {['Plata', 'Rojo', 'Azul', 'Negro', 'Blanco'].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="field">
              Correo o teléfono <small>Opcional en DEMO</small>
              <input
                type="text"
                autoComplete="off"
                maxLength={100}
                value={draft.vehicle.contact}
                placeholder="Usa datos de ejemplo"
                onChange={(e) =>
                  commerce.updateDraft({ vehicle: { ...draft.vehicle, contact: e.target.value } })
                }
                aria-describedby="registration-error"
              />
            </label>
            <p className="inline-note">
              <Info size={16} />
              Registro virtual. La llegada presencial sigue pendiente.
            </p>
            <p className="muted">
              Modelo ilustrativo de categoría: {vehicleTypeLabels[draft.vehicle.type]}.
              Conservaremos el tipo y color en la orden.
            </p>
            {validation && (
              <p id="registration-error" className="form-error" role="alert">
                {validation}
              </p>
            )}
            <button className="primary wide" type="submit" disabled={busy || !commerce.connected}>
              {busy ? 'Validando…' : 'Revisar cotización'}
              <ArrowRight size={17} />
            </button>
          </form>
        </>
      )}
      {step === 'review' && (
        <>
          {commerce.order?.status === 'confirmed' && (
            <p className="inline-note">
              Ya tienes una orden activa: {commerce.order.id}. Este borrador no la modifica. Para
              confirmar una nueva solicitud, primero debe cerrarse la orden existente.
              <button className="text-button" onClick={openOrder}>
                Consultar orden existente
              </button>
            </p>
          )}
          {quote ? (
            <>
              <p className="muted">
                {vehicleTypeLabels[quote.vehicle.type]} · {quote.vehicle.color} · USD · Tarifas DEMO
              </p>
              <ul className="quote-services">
                {quote.services.map((s) => (
                  <li key={s.id}>
                    <Check size={16} />
                    {s.label}
                    {s.durationMinutes != null && (
                      <small> · {s.durationMinutes} min estimados</small>
                    )}
                    <b>{money(s.cents)}</b>
                  </li>
                ))}
              </ul>
              <dl className="order-costs">
                <div>
                  <dt>Subtotal</dt>
                  <dd>{money(quote.subtotal)}</dd>
                </div>
                <div>
                  <dt>Descuento DEMO</dt>
                  <dd>−{money(quote.discount)}</dd>
                </div>
                <div>
                  <dt>Impuesto DEMO · {(quote.taxBasisPoints ?? 0) / 100}%</dt>
                  <dd>{money(quote.tax)}</dd>
                </div>
                <div className="total">
                  <dt>Total DEMO</dt>
                  <dd>{money(quote.total)}</dd>
                </div>
              </dl>
              <p className="inline-note">Pago pendiente · Llegada pendiente</p>
              <small className="muted">
                {quote.expiresAt > now
                  ? 'Vigente hasta ' + new Date(quote.expiresAt).toLocaleTimeString('es-PR')
                  : 'La cotización venció. Actualízala antes de confirmar.'}
              </small>
              <button
                className="primary wide"
                disabled={busy || commerce.order?.status === 'confirmed'}
                onClick={async () => {
                  if (quote.expiresAt <= Date.now()) {
                    await commerce.prepareQuote()

                    return
                  }

                  const revision = useApp.getState().navRevision

                  if (await commerce.confirm()) {
                    if (useApp.getState().navRevision === revision && useApp.getState().dialogue)
                      openOrder()
                  }
                }}
              >
                {busy
                  ? 'Procesando…'
                  : quote.expiresAt <= now
                    ? 'Actualizar cotización'
                    : 'Confirmar orden DEMO'}
              </button>
            </>
          ) : (
            <>
              <p>Solicita una cotización vigente para continuar.</p>
              <button className="primary wide" disabled={busy} onClick={() => void register()}>
                Solicitar cotización
              </button>
            </>
          )}
          <div className="secondary-actions">
            <button onClick={() => go('services')}>Modificar servicios</button>
            <button onClick={close}>Guardar borrador</button>
          </div>
          <button
            className="text-button"
            onClick={() => {
              commerce.discard()
              go('welcome')
            }}
          >
            Descartar borrador
          </button>
        </>
      )}
      {commerce.error && (
        <p role="alert" className="form-error">
          {commerce.error}
        </p>
      )}
      {(!commerce.connected || commerce.requestFailed) && (
        <p className="form-error" role="status">
          {commerce.connected
            ? 'La última solicitud no se completó.'
            : 'Sin conexión con el proveedor DEMO.'}{' '}
          Tu borrador se conserva.
          <button className="text-button" onClick={() => void commerce.refresh()}>
            Reintentar conexión
          </button>
        </p>
      )}
      {step !== 'welcome' && (
        <button className="back-button" onClick={back}>
          <ArrowLeft size={16} />
          Volver
        </button>
      )}
    </WorldPanel>
  )
}
