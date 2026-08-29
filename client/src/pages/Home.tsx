/**
 * Tidal Tactile home view: off-white clay surfaces, Current Blue for weather/navigation,
 * leaf green for environmental signals, and an asymmetric current-to-detail forecast flow.
 */
import WeatherGlyph from "@/components/WeatherGlyph";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  defaultLocation,
  displayTime,
  fetchForecast,
  locationLabel,
  LocationResult,
  searchLocations,
  WeatherForecast,
  WeatherUnit,
  weatherDescriptor,
  windDirectionLabel,
} from "@/lib/weather";
import { toast } from "sonner";
import { AlertTriangle, CloudSun, Droplets, Gauge, LocateFixed, MapPin, RefreshCw, Search, Star, Sun, Sunrise, Sunset, Wind, X } from "lucide-react";
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";

const FAVORITES_KEY = "conforecast-saved-locations";

function shortTime(time: string) {
  const hour = Number(time.slice(11, 13));
  if (Number.isNaN(hour)) return "—";
  if (hour === 0) return "12a";
  if (hour === 12) return "12p";
  return `${hour > 12 ? hour - 12 : hour}${hour >= 12 ? "p" : "a"}`;
}

function dayName(value: string, timezone: string, index: number) {
  if (index === 0) return "Today";
  return displayTime(`${value}T12:00`, timezone, { weekday: "short" });
}

function temperatureUnit(unit: WeatherUnit) { return unit === "metric" ? "°" : "°"; }
function speedUnit(unit: WeatherUnit) { return unit === "metric" ? "km/h" : "mph"; }

export default function Home() {
  const [unit, setUnit] = useState<WeatherUnit>("metric");
  const [location, setLocation] = useState<LocationResult>(defaultLocation);
  const [forecast, setForecast] = useState<WeatherForecast | null>(null);
  const [favorites, setFavorites] = useState<LocationResult[]>([]);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<LocationResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
      if (Array.isArray(stored)) setFavorites(stored.filter((item) => typeof item?.latitude === "number" && typeof item?.longitude === "number"));
    } catch {
      localStorage.removeItem(FAVORITES_KEY);
    }
  }, []);

  useEffect(() => { localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites)); }, [favorites]);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError("");
    fetchForecast(location, unit)
      .then((result) => { if (!controller.signal.aborted) { setForecast(result); setLastUpdated(new Date()); } })
      .catch((reason) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Unable to load weather data."); })
      .finally(() => { if (!controller.signal.aborted) setIsLoading(false); });
    return () => controller.abort();
  }, [location, unit]);

  useEffect(() => {
    const normalized = query.trim();
    if (normalized.length < 2) { setSuggestions([]); setIsSearching(false); return; }
    let cancelled = false;
    setIsSearching(true);
    const timer = window.setTimeout(() => {
      searchLocations(normalized).then((results) => { if (!cancelled) setSuggestions(results); }).catch(() => { if (!cancelled) setSuggestions([]); }).finally(() => { if (!cancelled) setIsSearching(false); });
    }, 320);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [query]);

  const isFavorite = favorites.some((item) => item.latitude === location.latitude && item.longitude === location.longitude);
  const condition = forecast ? weatherDescriptor(forecast.current.weatherCode) : { label: "Loading", detail: "Reading the atmosphere" };
  const hourlyPoints = useMemo(() => {
    if (!forecast) return "";
    const temperatures = forecast.hourly.slice(0, 12).map((item) => item.temperature);
    const min = Math.min(...temperatures); const max = Math.max(...temperatures); const range = max - min || 1;
    return temperatures.map((temperature, index) => `${(index / (temperatures.length - 1 || 1)) * 100},${88 - ((temperature - min) / range) * 60}`).join(" ");
  }, [forecast]);

  function chooseLocation(next: LocationResult) {
    setLocation(next); setQuery(""); setSuggestions([]); setError("");
  }

  async function submitSearch(event: FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const results = await searchLocations(query);
      if (results.length === 0) { toast.error("No matching locations found. Try adding a country."); return; }
      chooseLocation(results[0]);
    } catch (reason) { toast.error(reason instanceof Error ? reason.message : "Search failed."); }
    finally { setIsSearching(false); }
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) { toast.error("This browser does not provide location access."); return; }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { chooseLocation({ name: "Your location", latitude: coords.latitude, longitude: coords.longitude }); setIsLocating(false); toast("Your local forecast is ready."); },
      () => { setIsLocating(false); toast.error("Location access was not available. Search for a city instead."); },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }

  function toggleFavorite() {
    if (isFavorite) { setFavorites((items) => items.filter((item) => item.latitude !== location.latitude || item.longitude !== location.longitude)); toast("Removed from saved places."); }
    else { setFavorites((items) => [...items, location].slice(-8)); toast("Saved as a favorite place."); }
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#f5f9fb] text-[#173b5f]">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[440px] bg-[radial-gradient(circle_at_75%_0%,rgba(135,207,248,.26),transparent_39%),radial-gradient(circle_at_19%_10%,rgba(143,212,177,.21),transparent_30%)]" />
      <header className="relative mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-10">
        <a href="#top" className="flex shrink-0 items-center gap-2.5" aria-label="Conforecast home"><img src="/assets/conforecast-orb-logo.png" alt="" className="h-10 w-10 object-contain drop-shadow-[0_8px_12px_rgba(38,121,216,0.18)]" /><span className="font-['Space_Grotesk'] text-xl font-semibold tracking-[-0.075em] text-[#12365e]">Con<span className="font-medium text-[#2679d8]">forecast</span></span></a>
        <div className="hidden items-center gap-2 text-xs font-semibold text-[#6080a0] md:flex"><span className="current-bars" aria-hidden="true"><i /><i /><i /></span><span>Live global forecast</span></div>
        <div className="flex rounded-2xl bg-[#e9f1f5] p-1 shadow-[inset_3px_3px_7px_rgba(125,159,180,.16),inset_-3px_-3px_7px_rgba(255,255,255,.9)]" aria-label="Temperature units"><button onClick={() => setUnit("metric")} className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${unit === "metric" ? "bg-white text-[#2679d8] shadow-[4px_4px_10px_rgba(132,159,177,.17)]" : "text-[#7892a8]"}`} aria-pressed={unit === "metric"}>°C</button><button onClick={() => setUnit("imperial")} className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${unit === "imperial" ? "bg-white text-[#2679d8] shadow-[4px_4px_10px_rgba(132,159,177,.17)]" : "text-[#7892a8]"}`} aria-pressed={unit === "imperial"}>°F</button></div>
      </header>

      <main id="top" className="relative mx-auto max-w-7xl px-5 pb-16 sm:px-8 lg:px-10">
        <section className="relative mt-2 rounded-[34px] border border-white/80 bg-white/60 p-5 shadow-[16px_16px_42px_rgba(133,161,177,.15),-12px_-12px_32px_rgba(255,255,255,.78)] backdrop-blur-xl sm:p-7" style={{ backgroundImage: "linear-gradient(105deg, rgba(255,255,255,.94) 0%, rgba(255,255,255,.79) 53%, rgba(237,249,253,.68) 100%), url('/assets/conforecast-sky-current.jpg')", backgroundSize: "cover", backgroundPosition: "right center" }}>
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div><div className="flex items-center gap-2"><span className="current-bars" aria-hidden="true"><i /><i /><i /></span><p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#338c7f]">Your weather, in context</p></div><h1 className="mt-2 max-w-2xl font-['Space_Grotesk'] text-2xl font-semibold tracking-[-.075em] text-[#173b5f] sm:text-[2rem]">A gentler read on the day ahead.</h1></div>
            <form onSubmit={submitSearch} className="relative w-full max-w-lg"><div className="flex items-center gap-2 rounded-2xl border border-white bg-white/85 p-1.5 shadow-[7px_7px_18px_rgba(130,165,185,.15),-4px_-4px_12px_rgba(255,255,255,.95)]"><Search size={18} className="ml-2 shrink-0 text-[#2679d8]" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search city, country, or postcode" className="h-10 border-0 bg-transparent px-1 text-sm text-[#173b5f] shadow-none placeholder:text-[#8da5b4] focus-visible:ring-0" aria-label="Search for a location" /><Button type="button" onClick={useCurrentLocation} disabled={isLocating} variant="ghost" className="h-10 shrink-0 rounded-xl px-3 text-[#2679d8] hover:bg-[#eaf5ff] hover:text-[#1766c1]" aria-label="Use my current location"><LocateFixed size={18} /></Button><Button type="submit" disabled={isSearching} className="h-10 shrink-0 rounded-xl bg-[#2679d8] px-4 font-semibold text-white shadow-[0_7px_14px_rgba(38,121,216,.2)] hover:bg-[#1766c1] active:scale-[.97]">Search</Button></div>{(suggestions.length > 0 || (query.length >= 2 && !isSearching)) && <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-white bg-white/95 p-1.5 shadow-[10px_14px_30px_rgba(95,137,164,.18)] backdrop-blur-xl">{suggestions.length > 0 ? suggestions.map((item) => <button key={`${item.latitude}-${item.longitude}`} onClick={() => chooseLocation(item)} type="button" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-[#edf8f5]"><MapPin size={16} className="shrink-0 text-[#338c7f]" /><span><strong className="block text-sm text-[#173b5f]">{item.name}</strong><span className="block text-xs text-[#7892a8]">{locationLabel(item)}</span></span></button>) : <p className="px-3 py-3 text-sm text-[#7892a8]">No locations match that search.</p>}</div>}</form>
          </div>
        </section>

        {error ? <section className="mt-5 flex flex-col items-start justify-between gap-4 rounded-[26px] border border-[#d9edf2] bg-[#f4fbfd] p-5 text-[#315a78] sm:flex-row sm:items-center"><div className="flex gap-3"><AlertTriangle className="mt-0.5 shrink-0 text-[#338c7f]" size={20} /><div><p className="font-semibold">The live forecast could not be loaded.</p><p className="mt-1 text-sm text-[#5d7d95]">{error}</p></div></div><Button onClick={() => setLocation({ ...location })} className="rounded-xl bg-[#2679d8] text-white hover:bg-[#1766c1]"><RefreshCw size={16} />Try again</Button></section> : <>
          <section className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_330px]">
            <article className="relative min-h-[380px] overflow-hidden rounded-[36px] border border-white bg-[linear-gradient(145deg,#ffffff_0%,#f1faff_70%,#edf9f3_100%)] p-6 shadow-[20px_22px_48px_rgba(133,161,177,.18),-14px_-14px_30px_rgba(255,255,255,.9),inset_2px_2px_1px_rgba(255,255,255,.96)] sm:p-8"><div className="absolute right-0 top-0 h-56 w-72 bg-[radial-gradient(circle_at_70%_20%,rgba(139,213,249,.42),transparent_48%),radial-gradient(circle_at_25%_76%,rgba(163,228,192,.34),transparent_42%)]" /><div className="relative flex items-start justify-between gap-4"><div><div className="flex items-center gap-2 text-sm text-[#65869e]"><MapPin size={16} className="text-[#338c7f]" /><span>{locationLabel(location)}</span></div><p className="mt-2 text-xs font-semibold text-[#8aa0b2]">{forecast ? displayTime(forecast.current.time, forecast.timezone, { weekday: "long", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Connecting to live weather"}</p></div><button onClick={toggleFavorite} className={`grid h-10 w-10 place-items-center rounded-2xl transition active:scale-[.96] ${isFavorite ? "bg-[#e8f7f1] text-[#338c7f] shadow-[inset_2px_2px_5px_rgba(89,160,137,.12)]" : "bg-[#f0f5f7] text-[#91a8b7] shadow-[inset_2px_2px_5px_rgba(126,155,172,.1)] hover:text-[#338c7f]"}`} aria-label={isFavorite ? "Remove from saved places" : "Save this location"}><Star size={19} fill={isFavorite ? "currentColor" : "none"} /></button></div>
              <div className="relative mt-7 flex flex-col justify-between gap-7 sm:flex-row sm:items-end"><div className="flex items-center gap-5"><div className="weather-orb"><WeatherGlyph code={forecast?.current.weatherCode || 0} isDay={forecast?.current.isDay} size={52} className="text-[#2679d8]" /></div><div><p className="font-['Space_Grotesk'] text-[clamp(5.8rem,13vw,9rem)] font-semibold leading-[.72] tracking-[-.135em] text-[#173b5f]">{forecast ? Math.round(forecast.current.temperature) : "—"}<span className="ml-1 text-3xl font-medium tracking-[-.08em] text-[#5e8caa]">{temperatureUnit(unit)}</span></p><p className="mt-6 font-['Space_Grotesk'] text-3xl font-semibold tracking-[-.07em] text-[#173b5f]">{condition.label}</p><p className="mt-1 text-sm text-[#6d899e]">{condition.detail}</p><p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/75 px-3 py-1.5 text-xs font-semibold text-[#315a78] shadow-[inset_1px_1px_2px_white,2px_3px_8px_rgba(100,150,166,.1)]"><span className="current-bars" aria-hidden="true"><i /><i /><i /></span>Today reaches {forecast ? Math.round(forecast.daily[0]?.max || 0) : "—"}° with {forecast ? forecast.daily[0]?.precipitationProbability || 0 : "—"}% rain likelihood</p></div></div><div className="grid grid-cols-2 gap-2 sm:w-[218px]"><div className="rounded-2xl bg-[#eef7fa] px-3 py-3 shadow-[inset_3px_3px_7px_rgba(114,156,178,.12),inset_-3px_-3px_7px_white]"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#77a395]">Feels like</p><p className="mt-1 font-['Space_Grotesk'] text-xl font-semibold tracking-[-.06em] text-[#173b5f]">{forecast ? Math.round(forecast.current.apparentTemperature) : "—"}°</p></div><div className="rounded-2xl bg-[#eef7fa] px-3 py-3 shadow-[inset_3px_3px_7px_rgba(114,156,178,.12),inset_-3px_-3px_7px_white]"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#77a395]">Rain now</p><p className="mt-1 font-['Space_Grotesk'] text-xl font-semibold tracking-[-.06em] text-[#173b5f]">{forecast ? forecast.current.precipitation.toFixed(1) : "—"}<span className="ml-0.5 text-xs font-medium">{unit === "metric" ? "mm" : "in"}</span></p></div></div></div>
            </article>

            <aside className="rounded-[32px] bg-[#eaf5f3] p-5 shadow-[14px_14px_34px_rgba(114,158,161,.14),-10px_-10px_24px_rgba(255,255,255,.8)]"><div className="flex items-center justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[.17em] text-[#338c7f]">Atmosphere</p><h2 className="mt-1 font-['Space_Grotesk'] text-xl font-semibold tracking-[-.06em] text-[#173b5f]">What the air is doing</h2></div><CloudSun size={24} className="text-[#338c7f]" /></div><div className="mt-5 grid grid-cols-2 gap-3"><Metric icon={<Droplets size={17} />} label="Humidity" value={forecast ? `${forecast.current.humidity}%` : "—"} /><Metric icon={<Wind size={17} />} label="Wind" value={forecast ? `${Math.round(forecast.current.windSpeed)} ${speedUnit(unit)}` : "—"} detail={forecast ? windDirectionLabel(forecast.current.windDirection) : ""} /><Metric icon={<Gauge size={17} />} label="Elevation" value={forecast ? `${Math.round(forecast.elevation)}m` : "—"} /><Metric icon={<Sun size={17} />} label="UV peak" value={forecast ? `${forecast.daily[0]?.uvIndex.toFixed(0) || "—"}` : "—"} /></div><div className="pressure-seam mt-5" /><div className="mt-4 flex items-center justify-between gap-3"><div className="flex items-center gap-2"><Sunrise size={17} className="text-[#338c7f]" /><div><p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#7ca899]">Sunrise</p><p className="mt-0.5 text-sm font-semibold text-[#315a78]">{forecast?.daily[0] ? shortTime(forecast.daily[0].sunrise) : "—"}</p></div></div><div className="h-8 w-px bg-[#cce3dc]" /><div className="flex items-center gap-2"><Sunset size={17} className="text-[#2679d8]" /><div><p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#7ca899]">Sunset</p><p className="mt-0.5 text-sm font-semibold text-[#315a78]">{forecast?.daily[0] ? shortTime(forecast.daily[0].sunset) : "—"}</p></div></div></div></aside>
          </section>

          <section className="mt-5 rounded-[30px] border border-white/75 bg-white/72 p-5 shadow-[14px_14px_34px_rgba(133,161,177,.13),-10px_-10px_22px_white] backdrop-blur-xl sm:p-6"><div className="flex items-center justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#338c7f]">Next 12 hours</p><h2 className="mt-1 font-['Space_Grotesk'] text-xl font-semibold tracking-[-.06em] text-[#173b5f]">The weather current</h2></div><p className="hidden text-xs text-[#7d96a8] sm:block">Temperature and rain likelihood</p></div><div className="relative mt-5"><svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 top-2 h-16 w-full overflow-visible"><defs><linearGradient id="currentStroke" x1="0" x2="1"><stop stopColor="#2679d8" /><stop offset="1" stopColor="#47a884" /></linearGradient></defs><polyline points={hourlyPoints} fill="none" stroke="url(#currentStroke)" strokeWidth="2.1" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" /></svg><div className="relative flex gap-2 overflow-x-auto pb-1 pt-8">{forecast ? forecast.hourly.slice(0, 12).map((hour, index) => <div key={hour.time} className={`min-w-[76px] flex-1 rounded-2xl px-2 py-3 text-center ${index === 0 ? "bg-[#eaf5ff] shadow-[inset_2px_2px_5px_rgba(84,144,204,.12)]" : ""}`}><p className="text-[11px] font-semibold text-[#7c97ab]">{index === 0 ? "Now" : shortTime(hour.time)}</p><WeatherGlyph code={hour.weatherCode} isDay={forecast.current.isDay} size={21} className="mx-auto my-2 text-[#2679d8]" /><p className="font-['Space_Grotesk'] text-lg font-semibold tracking-[-.07em] text-[#173b5f]">{Math.round(hour.temperature)}°</p><p className="mt-1 text-[10px] font-semibold text-[#46a582]">{hour.precipitationProbability}%</p></div>) : Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-24 min-w-[76px] flex-1 animate-pulse rounded-2xl bg-[#edf3f6]" />)}</div></div></section>

          <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
            <article className="rounded-[32px] border border-white bg-white p-5 shadow-[16px_16px_38px_rgba(133,161,177,.14),-10px_-10px_24px_white] sm:p-6"><div className="flex items-center justify-between"><div><div className="flex items-center gap-2"><span className="current-bars" aria-hidden="true"><i /><i /><i /></span><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#338c7f]">Seven day outlook</p></div><h2 className="mt-1 font-['Space_Grotesk'] text-2xl font-semibold tracking-[-.065em] text-[#173b5f]">A wider weather window</h2></div><div className="hidden h-11 w-11 place-items-center rounded-2xl bg-[#edf8f5] text-[#338c7f] shadow-[inset_2px_2px_5px_rgba(83,151,128,.1)] sm:grid"><CloudSun size={22} /></div></div><div className="mt-5 divide-y divide-[#e6eff3]">{forecast ? forecast.daily.map((day, index) => <div key={day.date} className="forecast-marker grid grid-cols-[64px_34px_minmax(0,1fr)_auto] items-center gap-3 py-3.5"><p className="text-sm font-semibold text-[#315a78]">{dayName(day.date, forecast.timezone, index)}</p><WeatherGlyph code={day.weatherCode} size={23} className="text-[#2679d8]" /><div className="flex items-center gap-2"><div className="h-1.5 min-w-8 flex-1 overflow-hidden rounded-full bg-[#e8f1f4]"><div className="h-full rounded-full bg-gradient-to-r from-[#72c9ef] to-[#48aa85]" style={{ width: `${Math.max(15, Math.min(100, day.precipitationProbability))}%` }} /></div><span className="w-8 text-right text-[11px] font-semibold text-[#46a582]">{day.precipitationProbability}%</span></div><p className="whitespace-nowrap font-['Space_Grotesk'] text-sm font-semibold tracking-[-.04em] text-[#315a78]"><span className="text-[#173b5f]">{Math.round(day.max)}°</span><span className="ml-1.5 text-[#8aa0b2]">{Math.round(day.min)}°</span></p></div>) : Array.from({ length: 7 }).map((_, index) => <div key={index} className="h-14 animate-pulse border-b border-[#e6eff3] bg-[#f6fafb]" />)}</div></article>
            <aside className="relative overflow-hidden rounded-[32px] border border-white bg-[#edf8f5] p-5 shadow-[14px_14px_34px_rgba(109,155,151,.14),-10px_-10px_24px_white]" style={{ backgroundImage: "linear-gradient(140deg, rgba(237,248,245,.96), rgba(237,248,245,.72)), url('/assets/conforecast-greenlight.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}><div className="relative"><div className="flex items-center justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#338c7f]">Saved places</p><h2 className="mt-1 font-['Space_Grotesk'] text-xl font-semibold tracking-[-.06em] text-[#173b5f]">Weather homes</h2></div><Star size={22} className="text-[#338c7f]" /></div><div className="mt-5 space-y-2">{favorites.length > 0 ? favorites.map((place) => <button key={`${place.latitude}-${place.longitude}`} onClick={() => chooseLocation(place)} className={`flex w-full items-center justify-between rounded-2xl p-3 text-left transition ${place.latitude === location.latitude && place.longitude === location.longitude ? "bg-white/90 shadow-[4px_5px_12px_rgba(101,146,141,.13)]" : "hover:bg-white/60"}`}><span className="min-w-0"><strong className="block truncate text-sm text-[#315a78]">{place.name}</strong><span className="block truncate text-xs text-[#71908c]">{locationLabel(place)}</span></span><MapPin size={17} className="ml-3 shrink-0 text-[#338c7f]" /></button>) : <div className="rounded-2xl border border-dashed border-[#bfded4] bg-white/45 p-4"><p className="text-sm font-semibold text-[#315a78]">Nothing saved yet.</p><p className="mt-1 text-xs leading-5 text-[#71908c]">Select the star beside a forecast to keep it close.</p></div>}</div>{favorites.length > 0 && <button onClick={() => { setFavorites([]); toast("Saved places cleared."); }} className="mt-4 flex items-center gap-1 text-xs font-semibold text-[#5d8f80] hover:text-[#2679d8]"><X size={14} />Clear saved places</button>}</div></aside>
          </section>
        </>}
        <footer className="mt-9 flex flex-col gap-2 border-t border-[#dfecef] pt-5 text-xs text-[#7892a8] sm:flex-row sm:items-center sm:justify-between"><p>Conforecast uses live forecast data and does not require an account.</p><p>{lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : "Awaiting live forecast"} <span className="mx-1 text-[#bad0db]">·</span> Data: Open-Meteo</p></footer>
      </main>
    </div>
  );
}

function Metric({ icon, label, value, detail }: { icon: ReactNode; label: string; value: string; detail?: string }) {
  return <div className="rounded-2xl bg-white/62 p-3 shadow-[inset_2px_2px_5px_rgba(89,152,143,.08),inset_-2px_-2px_5px_rgba(255,255,255,.8)]"><div className="flex items-center gap-1.5 text-[#338c7f]">{icon}<p className="text-[10px] font-bold uppercase tracking-[.11em]">{label}</p></div><p className="mt-2 font-['Space_Grotesk'] text-base font-semibold tracking-[-.055em] text-[#315a78]">{value}<span className="ml-1 text-xs font-medium text-[#7d9d97]">{detail}</span></p></div>;
}
