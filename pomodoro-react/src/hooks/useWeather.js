import { useEffect, useMemo, useState } from "react";

const WEATHER_PREFS_KEY = "focus-atelier-weather-prefs";
const CITY_OPTIONS = {
  auto: { latitude: 40.4168, longitude: -3.7038, label: "Auto (Madrid fallback)" },
  madrid: { latitude: 40.4168, longitude: -3.7038, label: "Madrid" },
  barcelona: { latitude: 41.3874, longitude: 2.1686, label: "Barcelona" },
  valencia: { latitude: 39.4699, longitude: -0.3763, label: "Valencia" },
  sevilla: { latitude: 37.3891, longitude: -5.9845, label: "Sevilla" },
};

function weatherLabel(code) {
  if (code === 0) return "Despejado";
  if ([1, 2].includes(code)) return "Parcialmente nublado";
  if (code === 3) return "Nublado";
  if ([45, 48].includes(code)) return "Niebla";
  if ([51, 53, 55, 56, 57].includes(code)) return "Llovizna";
  if ([61, 63, 65, 66, 67].includes(code)) return "Lluvia";
  if ([71, 73, 75, 77].includes(code)) return "Nieve";
  if ([80, 81, 82].includes(code)) return "Chubascos";
  if ([95, 96, 99].includes(code)) return "Tormenta";
  return "Tiempo variable";
}

export default function useWeather() {
  const [locationMode, setLocationMode] = useState("auto");
  const [coords, setCoords] = useState(CITY_OPTIONS.auto);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => new Date());
  const [lastUpdated, setLastUpdated] = useState("");
  const [refreshToken, setRefreshToken] = useState(0);
  const [nextHours, setNextHours] = useState([]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(WEATHER_PREFS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.locationMode && CITY_OPTIONS[parsed.locationMode]) {
        setLocationMode(parsed.locationMode);
      }
    } catch {
      // ignore invalid prefs
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(WEATHER_PREFS_KEY, JSON.stringify({ locationMode }));
  }, [locationMode]);

  useEffect(() => {
    if (locationMode !== "auto") {
      setCoords(CITY_OPTIONS[locationMode] || CITY_OPTIONS.madrid);
      return;
    }
    if (!("geolocation" in navigator)) {
      setCoords(CITY_OPTIONS.madrid);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          label: "Tu ubicacion",
        });
      },
      () => {
        setCoords(CITY_OPTIONS.madrid);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  }, [locationMode]);

  useEffect(() => {
    let isCancelled = false;

    async function fetchWeather() {
      try {
        setLoading(true);
        setError("");
        const url =
          `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}` +
          "&current_weather=true&hourly=temperature_2m,weathercode&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto";
        const res = await fetch(url);
        if (!res.ok) throw new Error("No se pudo obtener el clima");
        const data = await res.json();
        if (isCancelled) return;
        setWeather({
          location: coords.label,
          temperature: data?.current_weather?.temperature,
          wind: data?.current_weather?.windspeed,
          code: data?.current_weather?.weathercode,
          max: data?.daily?.temperature_2m_max?.[0],
          min: data?.daily?.temperature_2m_min?.[0],
        });
        const hourlyTimes = data?.hourly?.time || [];
        const hourlyTemps = data?.hourly?.temperature_2m || [];
        const hourlyCodes = data?.hourly?.weathercode || [];
        const nowTimestamp = Date.now();
        const startIndex = hourlyTimes.findIndex((timeIso) => new Date(timeIso).getTime() >= nowTimestamp - 10 * 60 * 1000);
        const safeStart = startIndex >= 0 ? startIndex : 0;
        const slices = hourlyTimes.slice(safeStart, safeStart + 3);
        setNextHours(
          slices.map((timeIso, idx) => {
            const realIndex = safeStart + idx;
            return {
              key: timeIso,
              time: new Date(timeIso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
              temp: hourlyTemps[realIndex],
              code: hourlyCodes[realIndex],
              label: weatherLabel(hourlyCodes[realIndex]),
            };
          })
        );
        setLastUpdated(
          new Date().toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
          })
        );
      } catch {
        if (!isCancelled) setError("No disponible");
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    fetchWeather();
    const id = setInterval(fetchWeather, 15 * 60 * 1000);
    return () => {
      isCancelled = true;
      clearInterval(id);
    };
  }, [coords.latitude, coords.longitude, coords.label, refreshToken]);

  const currentTime = useMemo(
    () =>
      now.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    [now]
  );
  const currentHour = useMemo(() => now.getHours(), [now]);

  const studySuggestion = useMemo(() => {
    if (!weather) return "";
    const hour = now.getHours();
    if (weather.temperature >= 30) return "Hace calor: prueba bloques de 20 min + descansos cortos.";
    if (weather.temperature <= 8) return "Frio afuera: ideal para una sesion larga de enfoque.";
    if ([95, 96, 99].includes(weather.code)) return "Tormenta: reduce distracciones y usa musica suave.";
    if (hour >= 22 || hour < 7) return "Hora tardia: prioriza tareas ligeras y cierra el dia.";
    return "Buen momento para un bloque Pomodoro completo.";
  }, [weather, now]);

  return {
    loading,
    error,
    weather,
    currentTime,
    currentHour,
    lastUpdated,
    weatherText: weather ? weatherLabel(weather.code) : "",
    locationMode,
    setLocationMode,
    locationOptions: Object.entries(CITY_OPTIONS).map(([value, item]) => ({ value, label: item.label })),
    refreshWeather: () => setRefreshToken((v) => v + 1),
    studySuggestion,
    nextHours,
  };
}
