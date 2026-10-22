/** Shared, serializable appearance contract. No renderer or database imports. */
export const VEHICLE_KINDS = ['Sedán', 'SUV', 'Pickup', 'Compacto', 'Van'] as const;
export type VehicleKind = (typeof VEHICLE_KINDS)[number];
export const VEHICLE_MODELS: Record<VehicleKind, 'sedan'|'suv'|'pickup'|'compact'|'van'> = {
  'Sedán':'sedan', SUV:'suv', Pickup:'pickup', Compacto:'compact', Van:'van',
};
export const AVATAR_SEXES = ['male','female'] as const;
export type AvatarSex = (typeof AVATAR_SEXES)[number];
export const VEHICLE_COLORS: Record<string,string> = {
  Plata:'#bdc5c9', Rojo:'#c64839', Azul:'#528da9', Negro:'#34414b', Blanco:'#f2eee3',
};
export function vehicleModel(kind: string) {
  if(!Object.hasOwn(VEHICLE_MODELS,kind)) throw new Error('Categoría de vehículo no admitida.');
  return VEHICLE_MODELS[kind as VehicleKind];
}
