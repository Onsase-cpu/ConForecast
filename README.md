# Conforecast

Conforecast is a responsive, client-side weather application with real location search, current weather, a twelve-hour forecast current, a seven-day outlook, metric/imperial units, browser geolocation, and locally saved places. The user interface follows a white, blue, and green claymorphism system designed for clear, everyday weather decisions.

## Run locally

```bash
pnpm install
pnpm dev
```

Open the local address shown by Vite. The application fetches weather directly in the browser from Open-Meteo; no key or server configuration is required for the implemented public endpoints.

## Features

| Feature | Implementation |
| --- | --- |
| Location search | Open-Meteo global geocoding API, with choice list and first-result search submission |
| Live forecast | Open-Meteo current, hourly, and daily forecast endpoint |
| Current conditions | Temperature, feels-like temperature, weather description, precipitation, humidity, wind, elevation, UV, sunrise, and sunset |
| Forecast views | Twelve-hour current and seven-day outlook |
| Units | Metric/Celsius and imperial/Fahrenheit with corresponding wind units |
| Browser tools | Current location button and saved locations persisted in local storage |
| Resilience | Loading placeholders, accessible error state, retry action, and search errors |

## Verification

```bash
pnpm check
pnpm build
```

For a production deployment, the browser needs internet access to reach `api.open-meteo.com` and `geocoding-api.open-meteo.com`. Location permission is optional: users can always search for a place manually.

## Data references

The forecast service accepts coordinates, current conditions, hourly variables, daily variables, units, time zone resolution, and forecasts up to sixteen days. The Conforecast implementation requests the documented current, hourly, and daily fields needed by the interface. [1]

The search service returns matching global locations with their names, coordinates, country, administrative area, and time zone. [2]

[1] [Open-Meteo Weather Forecast API](https://open-meteo.com/en/docs)

[2] [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api)
