const WEATHER_API_URL = "https://api.open-meteo.com/v1/forecast";
const CACHE_KEY = "agri_cached_weather";

// Coordinates for Lahore, Pakistan (Agricultural Model)
const LATITUDE = 31.5204;
const LONGITUDE = 74.3587;

export function describeWeatherCode(code) {
  if (code === 0) return { text: "Clear sky", icon: "☀️" };
  if ([1, 2, 3].includes(code)) return { text: "Partly cloudy", icon: "⛅" };
  if ([45, 48].includes(code)) return { text: "Foggy", icon: "🌫️" };
  if ([51, 53, 55, 56, 57].includes(code)) return { text: "Drizzle", icon: "🌦️" };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return { text: "Rainy", icon: "🌧️" };
  }
  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return { text: "Snowfall", icon: "❄️" };
  }
  if ([95, 96, 99].includes(code)) return { text: "Thunderstorm", icon: "⛈️" };
  return { text: "Fair weather", icon: "🌤️" };
}

function getFallbackWeather(reason = "Offline Agricultural Telemetry") {
  const today = new Date();
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const forecast = Array.from({ length: 5 }).map((_, idx) => {
    const d = new Date(today);
    d.setDate(today.getDate() + idx + 1);
    return {
      date: d.toISOString().slice(0, 10),
      dayName: dayNames[d.getDay()],
      maxTemp: 29 + (idx % 3),
      minTemp: 18 + (idx % 2),
      rainChance: [10, 20, 5, 0, 15][idx],
      condition: "Partly cloudy",
      icon: "⛅",
    };
  });

  return {
    temperature: 28,
    feelsLike: 29,
    dewPoint: 15,
    pressure: 1012,
    humidity: 58,
    windSpeed: 8.5,
    rainChance: 15,
    condition: "Partly cloudy",
    weatherIcon: "⛅",
    forecast,
    updatedAt: new Date().toISOString(),
    isFallback: true,
    fallbackReason: reason,
  };
}

export async function getCurrentWeather() {
  const url = new URL(WEATHER_API_URL);

  url.search = new URLSearchParams({
    latitude: String(LATITUDE),
    longitude: String(LONGITUDE),
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,dew_point_2m,weather_code,wind_speed_10m,surface_pressure",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    timezone: "auto",
    forecast_days: "6", // today + 5 days
  }).toString();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout guard

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Open-Meteo returned HTTP ${response.status}`);
    }

    const data = await response.json();
    const current = data.current;
    const daily = data.daily;

    if (
      !current ||
      !Number.isFinite(current.temperature_2m) ||
      !Number.isFinite(current.relative_humidity_2m) ||
      !Number.isFinite(current.weather_code)
    ) {
      throw new Error("Weather service returned invalid data.");
    }

    // Today's rain chance from daily
    const todayRainChance = daily?.precipitation_probability_max?.[0] ?? 0;

    // Process next 5 days forecast
    const fiveDayForecast = (daily?.time || [])
      .slice(1, 6)
      .map((dateStr, idx) => {
        const dayIndex = idx + 1;
        const date = new Date(`${dateStr}T12:00:00`);
        const dayName = new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);
        const code = daily.weather_code?.[dayIndex] ?? 0;
        const weatherInfo = describeWeatherCode(code);

        return {
          date: dateStr,
          dayName,
          maxTemp: Math.round(daily.temperature_2m_max?.[dayIndex] ?? 0),
          minTemp: Math.round(daily.temperature_2m_min?.[dayIndex] ?? 0),
          rainChance: daily.precipitation_probability_max?.[dayIndex] ?? 0,
          condition: weatherInfo.text,
          icon: weatherInfo.icon,
        };
      });

    const weatherDesc = describeWeatherCode(current.weather_code);

    const liveResult = {
      temperature: current.temperature_2m,
      feelsLike: Math.round(current.apparent_temperature ?? current.temperature_2m),
      dewPoint: Math.round(current.dew_point_2m ?? 14),
      pressure: Math.round(current.surface_pressure ?? 1013),
      humidity: current.relative_humidity_2m,
      windSpeed: current.wind_speed_10m ?? 0,
      rainChance: todayRainChance,
      condition: weatherDesc.text,
      weatherIcon: weatherDesc.icon,
      forecast: fiveDayForecast,
      updatedAt: current.time,
      isFallback: false,
    };

    // Cache to localStorage for offline resilience
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(liveResult));
    } catch {
      // quota safeguard
    }

    return liveResult;
  } catch (error) {
    // Graceful offline fallback on 503 / network downtime
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        return {
          ...parsed,
          isFallback: true,
          fallbackReason: "Cached telemetry (Open-Meteo busy)",
        };
      }
    } catch {
      // ignore JSON parse error
    }

    return getFallbackWeather("Offline agricultural telemetry");
  }
}
