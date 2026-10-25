import { useState } from 'react'
import type { CommercialOrder } from '../../../domain/commerce'
import type { WorldViewModel } from '../../../domain/contracts'
import { isFinished, type OperationArea } from './operationPresentation'

const areas: OperationArea[] = ['overview', 'queue', 'bays', 'completed']

/** Deep links select a view, never confer ownership. The private session is the
 * only source of the own entity ID. Follow it until the customer chooses another
 * view; polling must not reopen a dismissed detail or override their selection. */
export function useOperationNavigation(
  world: WorldViewModel,
  order: CommercialOrder | null,
  history: CommercialOrder[],
) {
  const [requestedArea, setArea] = useState<OperationArea>(() => {
    const value = new URLSearchParams(location.search).get('area') as OperationArea

    return areas.includes(value) ? value : 'overview'
  })
  const [followingOwn, setFollowingOwn] = useState(
    () => new URLSearchParams(location.search).get('focus') === 'mine',
  )
  const [selectedId, setSelected] = useState<string | null>(null)
  const all = [...world.vehicles, ...(world.completed || [])]
  const personalOrder =
    order || history.find((o) => all.some((v) => v.worldEntityId === o.worldEntityId))
  const ownVehicle = all.find((v) => v.worldEntityId === personalOrder?.worldEntityId)
  const selected = followingOwn ? ownVehicle?.worldEntityId || null : selectedId
  const vehicle = all.find((v) => v.worldEntityId === selected)
  const area =
    followingOwn && ownVehicle
      ? isFinished(ownVehicle)
        ? 'completed'
        : ownVehicle.bayId
          ? 'bays'
          : 'queue'
      : requestedArea
  const openArea = (next: OperationArea) => {
    setFollowingOwn(false)
    setSelected(null)
    setArea(next)
  }
  const select = (id: string) => {
    setFollowingOwn(false)
    setSelected(id)

    const next = all.find((v) => v.worldEntityId === id)

    if (next) setArea(isFinished(next) ? 'completed' : next.bayId ? 'bays' : 'queue')
  }

  return {
    area,
    selected: vehicle ? selected : null,
    vehicle,
    followingOwn,
    personalOrder,
    openArea,
    select,
    showOwn: () => {
      setSelected(null)
      setFollowingOwn(true)
    },
    close: () => {
      setFollowingOwn(false)
      setSelected(null)
    },
  }
}
