export const money = (cents: number) => new Intl.NumberFormat('es-PR', { style: 'currency', currency: 'USD' }).format(cents / 100);
