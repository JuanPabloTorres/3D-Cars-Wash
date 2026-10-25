import { useEffect } from 'react'
import { useApp } from '../app/store'
import { fetchWeather, fallbackWeather, validCoordinates } from './weather'

/** Data lifecycle lives outside the renderer and outside the help panel. */
export function WeatherDataController() {
  const coordinates = useApp((s) => s.weatherCoordinates),
    ready = useApp((s) => s.ready)

  useEffect(() => {
    const latitude = import.meta.env.VITE_CARWASH_LATITUDE,
      longitude = import.meta.env.VITE_CARWASH_LONGITUDE

    if (latitude && longitude) {
      const c = { latitude: Number(latitude), longitude: Number(longitude) }

      if (validCoordinates(c)) useApp.getState().set({ weatherCoordinates: c })
    }
  }, [])
  useEffect(() => {
    if (!coordinates || !ready) return

    const controller = new AbortController()
    const refresh = async () => {
      if (document.hidden) return
      try {
        const weather = await fetchWeather(
          coordinates,
          AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]),
        )

        if (!controller.signal.aborted) useApp.getState().set({ weather })
      } catch {
        if (!controller.signal.aborted) useApp.getState().set({ weather: fallbackWeather })
      }
    }

    void refresh()

    const timer = setInterval(refresh, 15 * 60 * 1000)
    const visible = () => {
      if (!document.hidden) void refresh()
    }

    document.addEventListener('visibilitychange', visible)

    return () => {
      controller.abort()
      clearInterval(timer)
      document.removeEventListener('visibilitychange', visible)
    }
  }, [coordinates, ready])

  return null
}
