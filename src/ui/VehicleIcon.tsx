/** Maps vehicle categories to consistent UI silhouettes; labels and prices remain owned by the catalog. */
import { Car, CarFront, Truck } from 'lucide-react'
import type { VehicleType } from '../domain/commerce'

function Pickup({ size = 25 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 15V9h9l3 4h7v5h-2M5 18H2v-3m6 3h8M7 9V6h5l3 7M15 13V9h6" />
      <circle cx="6.5" cy="18" r="2" />
      <circle cx="17.5" cy="18" r="2" />
    </svg>
  )
}

const icons = { car: Car, pickup: Pickup, truck: Truck, suv: CarFront }

export function VehicleIcon({ type = 'car', size = 25 }: { type?: VehicleType; size?: number }) {
  const Icon = icons[type] || Car

  return <Icon size={size} />
}
