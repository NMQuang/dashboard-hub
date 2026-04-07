/**
 * services/weather.ts
 * Fetches current weather from OpenWeatherMap free API.
 * Requires WEATHER_API_KEY in env.
 */
import type { WeatherData } from '@/types'

const BASE = 'https://api.openweathermap.org/data/2.5/weather'

interface OWMResponse {
  name: string
  sys: { country: string }
  main: { temp: number; feels_like: number; humidity: number }
  wind: { speed: number }
  weather: Array<{ description: string; icon: string }>
}

async function fetchCity(q: string, apiKey: string): Promise<WeatherData | null> {
  try {
    const url = `${BASE}?q=${encodeURIComponent(q)}&appid=${apiKey}&units=metric`
    const res = await fetch(url, { next: { revalidate: 1800 } })
    if (!res.ok) return null
    const d = await res.json() as OWMResponse
    return {
      city: d.name,
      country: d.sys.country,
      temp: Math.round(d.main.temp),
      feels_like: Math.round(d.main.feels_like),
      humidity: d.main.humidity,
      wind_speed: Math.round(d.wind.speed),
      description: d.weather[0]?.description ?? '',
      icon: d.weather[0]?.icon ?? '',
    }
  } catch {
    return null
  }
}

export async function fetchWeather(): Promise<{ tokyo: WeatherData | null; hcmc: WeatherData | null }> {
  const key = process.env.WEATHER_API_KEY
  if (!key || key === 'your_openweathermap_key_here') {
    return { tokyo: null, hcmc: null }
  }
  const [tokyo, hcmc] = await Promise.all([
    fetchCity('Tokyo,JP', key),
    fetchCity('Ho Chi Minh City,VN', key),
  ])
  return { tokyo, hcmc }
}
