/** Formats integer USD cents for customer-facing amounts; no price calculation or rounding occurs here. */
export const money = (cents: number) =>
  new Intl.NumberFormat('es-PR', { style: 'currency', currency: 'USD' }).format(cents / 100)
