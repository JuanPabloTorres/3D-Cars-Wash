export type WeatherKind = 'sunny' | 'partly-cloudy' | 'overcast' | 'rain' | 'sunset' | 'night'
export type Coordinates = { latitude: number; longitude: number; temporary?: boolean }
export interface WeatherState { kind: WeatherKind; source: 'simulation' | 'forecast'; label: string; fetchedAt?: number; validUntil?: number }
export const weatherLabels: Record<WeatherKind, string> = { sunny:'Soleado', 'partly-cloudy':'Parcialmente nublado', overcast:'Nublado', rain:'Lluvia', sunset:'Atardecer', night:'Noche' }
export const fallbackWeather: WeatherState = { kind:'sunny', source:'simulation', label:'Ambiente simulado · Sin clima actualizado' }
export function validCoordinates(c: Coordinates) { return Number.isFinite(c.latitude) && Math.abs(c.latitude)<=90 && Number.isFinite(c.longitude) && Math.abs(c.longitude)<=180 }
export function weatherFromForecast(period: { shortForecast: string; isDaytime: boolean }): WeatherKind {
  const text = period.shortForecast.toLowerCase()
  if (/rain|shower|thunder|lluvia/.test(text)) return 'rain'
  if (!period.isDaytime) return 'night'
  if (/partly|mostly sunny|few clouds/.test(text)) return 'partly-cloudy'
  if (/cloud|overcast|fog/.test(text)) return 'overcast'
  return 'sunny'
}
/** Public NWS forecast, free for commercial use. Coverage: USA, including Puerto Rico.
 * It is a forecast, never advertised as a live weather observation. No IP/geolocation lookup. */
export async function fetchWeather(c: Coordinates, signal?: AbortSignal): Promise<WeatherState> {
  if (!validCoordinates(c)) throw new Error('Coordenadas inválidas')
  const key = `febles-weather-v1:${c.latitude.toFixed(3)},${c.longitude.toFixed(3)}`
  try {
    const cached = JSON.parse(sessionStorage.getItem(key) || 'null') as WeatherState | null
    if (cached?.validUntil && cached.validUntil > Date.now()) return cached
  } catch { /* Cache denial must not interrupt the visit. */ }
  const get = async (url: string) => {
    const response = await fetch(url, { signal: signal || AbortSignal.timeout(10000), headers:{ Accept:'application/geo+json' } })
    if (!response.ok) throw new Error(`Proveedor meteorológico no disponible (${response.status})`)
    return response.json()
  }
  const point = await get(`https://api.weather.gov/points/${c.latitude.toFixed(4)},${c.longitude.toFixed(4)}`)
  const url = point?.properties?.forecastHourly || point?.properties?.forecast
  if (typeof url !== 'string' || !url.startsWith('https://api.weather.gov/')) throw new Error('Sin cobertura meteorológica')
  const data = await get(url)
  const period = data?.properties?.periods?.find((p: {startTime:string;endTime:string}) => Date.parse(p.startTime)<=Date.now() && Date.parse(p.endTime)>Date.now())
  if (!period || typeof period.shortForecast!=='string' || typeof period.isDaytime!=='boolean') throw new Error('Pronóstico vigente no disponible')
  const result: WeatherState = {kind:weatherFromForecast(period),source:'forecast',label:`Pronóstico NWS${c.temporary?' · Ubicación temporal':''}`,fetchedAt:Date.now(),validUntil:Math.min(Date.now()+15*60*1000,Date.parse(period.endTime))}
  try { sessionStorage.setItem(key, JSON.stringify(result)) } catch { /* Optional cache. */ }
  return result
}
