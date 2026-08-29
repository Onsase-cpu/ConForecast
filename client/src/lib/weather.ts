/** Tidal Tactile data layer: normalizes public forecast data into calm, direct forecast language. */
export type LocationResult = {
  id?: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
  timezone?: string;
};

export type WeatherUnit = "metric" | "imperial";

export type CurrentForecast = {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  precipitation: number;
  weatherCode: number;
  windSpeed: number;
  windDirection: number;
  isDay: boolean;
  time: string;
};

export type HourlyForecast = { time: string; temperature: number; weatherCode: number; precipitationProbability: number; windSpeed: number };
export type DailyForecast = { date: string; weatherCode: number; max: number; min: number; precipitationProbability: number; sunrise: string; sunset: string; uvIndex: number; windSpeed: number };
export type WeatherForecast = { current: CurrentForecast; hourly: HourlyForecast[]; daily: DailyForecast[]; timezone: string; elevation: number; unit: WeatherUnit };

const FORECAST_BASE = "https://api.open-meteo.com/v1/forecast";
const GEOCODING_BASE = "https://geocoding-api.open-meteo.com/v1/search";

export const defaultLocation: LocationResult = { name: "Nairobi", country: "Kenya", latitude: -1.286389, longitude: 36.817223, timezone: "Africa/Nairobi" };

function paramString(params: Record<string, string | number>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => search.set(key, String(value)));
  return search.toString();
}

export async function searchLocations(query: string): Promise<LocationResult[]> {
  const normalized = query.trim();
  if (normalized.length < 2) return [];
  const response = await fetch(`${GEOCODING_BASE}?${paramString({ name: normalized, count: 6, language: "en", format: "json" })}`);
  if (!response.ok) throw new Error("Location search is unavailable right now.");
  const payload = await response.json();
  return (payload.results || []).map((result: LocationResult) => result);
}

export async function fetchForecast(location: LocationResult, unit: WeatherUnit): Promise<WeatherForecast> {
  const temperatureUnit = unit === "imperial" ? "fahrenheit" : "celsius";
  const windSpeedUnit = unit === "imperial" ? "mph" : "kmh";
  const params = {
    latitude: location.latitude,
    longitude: location.longitude,
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_direction_10m,is_day",
    hourly: "temperature_2m,weather_code,precipitation_probability,wind_speed_10m",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max,wind_speed_10m_max",
    temperature_unit: temperatureUnit,
    wind_speed_unit: windSpeedUnit,
    precipitation_unit: unit === "imperial" ? "inch" : "mm",
    timezone: "auto",
    forecast_days: 7,
  };
  const response = await fetch(`${FORECAST_BASE}?${paramString(params)}`);
  if (!response.ok) throw new Error("Forecast data is unavailable right now.");
  const payload = await response.json();
  if (!payload.current || !payload.hourly || !payload.daily) throw new Error("The forecast response did not include the required weather data.");
  return {
    current: {
      temperature: payload.current.temperature_2m,
      apparentTemperature: payload.current.apparent_temperature,
      humidity: payload.current.relative_humidity_2m,
      precipitation: payload.current.precipitation,
      weatherCode: payload.current.weather_code,
      windSpeed: payload.current.wind_speed_10m,
      windDirection: payload.current.wind_direction_10m,
      isDay: payload.current.is_day === 1,
      time: payload.current.time,
    },
    hourly: payload.hourly.time.slice(0, 24).map((time: string, index: number) => ({ time, temperature: payload.hourly.temperature_2m[index], weatherCode: payload.hourly.weather_code[index], precipitationProbability: payload.hourly.precipitation_probability[index], windSpeed: payload.hourly.wind_speed_10m[index] })),
    daily: payload.daily.time.map((date: string, index: number) => ({ date, weatherCode: payload.daily.weather_code[index], max: payload.daily.temperature_2m_max[index], min: payload.daily.temperature_2m_min[index], precipitationProbability: payload.daily.precipitation_probability_max[index], sunrise: payload.daily.sunrise[index], sunset: payload.daily.sunset[index], uvIndex: payload.daily.uv_index_max[index], windSpeed: payload.daily.wind_speed_10m_max[index] })),
    timezone: payload.timezone,
    elevation: payload.elevation,
    unit,
  };
}

export function weatherDescriptor(code: number) {
  if (code === 0) return { label: "Clear", detail: "Clear skies" };
  if ([1, 2].includes(code)) return { label: "Mostly clear", detail: "A few passing clouds" };
  if (code === 3) return { label: "Overcast", detail: "Cloud cover holds steady" };
  if ([45, 48].includes(code)) return { label: "Fog", detail: "Reduced visibility" };
  if ([51, 53, 55, 56, 57].includes(code)) return { label: "Drizzle", detail: "Light wet weather" };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { label: "Rain", detail: "Keep a layer close" };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { label: "Snow", detail: "Wintry conditions" };
  if ([95, 96, 99].includes(code)) return { label: "Thunderstorm", detail: "Watch conditions closely" };
  return { label: "Variable", detail: "Changing conditions" };
}

export function locationLabel(location: LocationResult) {
  return [location.name, location.admin1 && location.admin1 !== location.name ? location.admin1 : location.country].filter(Boolean).join(", ");
}

export function displayTime(value: string, timezone: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-US", { timeZone: timezone, ...options }).format(new Date(value));
}

export function windDirectionLabel(degrees: number) {
  return ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round(degrees / 45) % 8];
}
