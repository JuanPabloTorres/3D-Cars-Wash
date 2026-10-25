/** Build-time brand defaults; business configuration may supply the displayed establishment name. */
export const appConfig = {
  name: import.meta.env.VITE_CARWASH_NAME || 'CarWash Studio',
  tagline: import.meta.env.VITE_CARWASH_TAGLINE || 'Tu auto, en buenas manos.',
  demoLabel: import.meta.env.VITE_CARWASH_DEMO_LABEL || 'Entorno DEMO',
}
