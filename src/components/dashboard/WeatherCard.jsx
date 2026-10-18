import { useState } from "react";
import {
  CloudSun,
  MapPin,
  RefreshCw,
  AlertCircle,
  Wind,
  CloudRain,
  ChevronDown,
  ChevronUp,
  ThermometerSun,
  Droplets,
  Gauge,
  Radio,
} from "lucide-react";

export default function WeatherCard({
  weather,
  loading = false,
  error = "",
  onRetry,
  location = "Lahore, Pakistan",
}) {
  const [showForecast, setShowForecast] = useState(true);

  return (
    <article className="weather-card h-100 d-flex flex-column justify-content-between">
      <div>
        {/* Card Header */}
        <div className="weather-card-heading">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <p className="weather-eyebrow mb-0">ATMOSPHERIC TELEMETRY</p>
              {weather?.isFallback ? (
                <span className="badge bg-warning-subtle text-warning border border-warning-subtle d-inline-flex align-items-center gap-1 py-0 px-2" style={{ fontSize: "10px" }} title={weather.fallbackReason}>
                  <span className="badge-bullet bg-warning" style={{ width: 6, height: 6, borderRadius: "50%", display: "inline-block" }} />
                  Offline Telemetry
                </span>
              ) : (
                <span className="badge bg-success-subtle text-success border border-success-subtle d-inline-flex align-items-center gap-1 py-0 px-2" style={{ fontSize: "10px" }}>
                  <span className="live-radar-dot" style={{ width: 6, height: 6 }} />
                  Open-Meteo Live
                </span>
              )}
            </div>
            <h3 style={{ margin: "0 !important", fontSize: "18px !important", fontWeight: 750 }}>
              Live Farm Weather
            </h3>
          </div>

          <div className="d-flex align-items-center gap-2">
            {onRetry && (
              <button
                type="button"
                className="btn btn-sm btn-light p-1 rounded-circle border text-muted"
                title="Refresh live weather"
                onClick={onRetry}
                disabled={loading}
              >
                <RefreshCw size={14} className={loading ? "spin-icon" : ""} />
              </button>
            )}

            <div className="weather-main-icon shadow-sm">
              <span style={{ fontSize: 26 }}>{weather?.weatherIcon || <CloudSun size={26} />}</span>
            </div>
          </div>
        </div>

        {/* Location & Status Bar */}
        <div className="weather-location mt-2 mb-3">
          <MapPin size={14} className="text-success" />
          <span className="fw-semibold text-secondary">{location}</span>
        </div>

        {loading && !weather ? (
          <div className="py-5 text-center" role="status">
            <div className="spinner-border spinner-border-sm text-success me-2" role="status" />
            <span className="text-muted small">Loading atmospheric readings...</span>
          </div>
        ) : error ? (
          <div className="alert alert-danger py-2 px-3 my-3 d-flex align-items-center justify-content-between" role="alert">
            <div className="d-flex align-items-center gap-2 small">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
            {onRetry && (
              <button
                type="button"
                className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1"
                onClick={onRetry}
              >
                <RefreshCw size={13} />
                Retry
              </button>
            )}
          </div>
        ) : weather ? (
          <>
            {/* Primary Temperature & Condition Block */}
            <div className="weather-reading align-items-center mb-3">
              <span className="weather-temperature">
                {Math.round(weather.temperature)}°
              </span>
              <div>
                <p className="weather-condition mb-1 fs-5 fw-bold">{weather.condition}</p>
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-light text-secondary border small">
                    Feels like {weather.feelsLike ?? Math.round(weather.temperature)}°C
                  </span>
                  <span className="text-muted small">Standard Sensor Reading</span>
                </div>
              </div>
            </div>

            {/* 4-Item Micro Atmospheric Grid */}
            <div className="weather-metrics-grid">
              {/* Wind Speed */}
              <div className="weather-metric-item">
                <div className="metric-icon-box bg-primary-subtle text-primary">
                  <Wind size={15} />
                </div>
                <div className="min-w-0">
                  <span className="metric-tiny-label">Wind Speed</span>
                  <strong className="metric-bold-value text-truncate d-block">
                    {weather.windSpeed} km/h
                  </strong>
                </div>
              </div>

              {/* Rain Probability */}
              <div className="weather-metric-item">
                <div className="metric-icon-box bg-info-subtle text-info">
                  <CloudRain size={15} />
                </div>
                <div className="min-w-0">
                  <span className="metric-tiny-label">Rain Chance</span>
                  <strong className="metric-bold-value text-truncate d-block">
                    {weather.rainChance}%
                  </strong>
                </div>
              </div>

              {/* Dew Point */}
              <div className="weather-metric-item">
                <div className="metric-icon-box bg-success-subtle text-success">
                  <Droplets size={15} />
                </div>
                <div className="min-w-0">
                  <span className="metric-tiny-label">Dew Point</span>
                  <strong className="metric-bold-value text-truncate d-block">
                    {weather.dewPoint ?? 15}°C
                  </strong>
                </div>
              </div>

              {/* Surface Pressure */}
              <div className="weather-metric-item">
                <div className="metric-icon-box bg-warning-subtle text-warning">
                  <Gauge size={15} />
                </div>
                <div className="min-w-0">
                  <span className="metric-tiny-label">Barometer</span>
                  <strong className="metric-bold-value text-truncate d-block">
                    {weather.pressure ?? 1012} hPa
                  </strong>
                </div>
              </div>
            </div>

            {/* 5-Day Outlook Section (Clean, without blue outline) */}
            {weather.forecast && weather.forecast.length > 0 && (
              <div className="forecast-accordion-wrap mt-2 pt-2 border-top">
                <button
                  type="button"
                  className="forecast-toggle-btn d-flex align-items-center justify-content-between w-100 fw-bold text-dark"
                  onClick={() => setShowForecast((prev) => !prev)}
                >
                  <span className="d-inline-flex align-items-center gap-1 text-secondary small">
                    5-Day Agricultural Weather Outlook
                  </span>
                  {showForecast ? (
                    <ChevronUp size={15} className="text-muted" />
                  ) : (
                    <ChevronDown size={15} className="text-muted" />
                  )}
                </button>

                {showForecast && (
                  <div className="five-day-forecast-strip mt-2">
                    {weather.forecast.map((day) => (
                      <div className="forecast-day-card" key={day.date}>
                        <span className="forecast-day-name">{day.dayName}</span>
                        <span className="forecast-day-icon">{day.icon}</span>
                        <div className="forecast-day-temps">
                          <strong className="max-temp">{day.maxTemp}°</strong>
                          <span className="min-temp">{day.minTemp}°</span>
                        </div>
                        {day.rainChance > 0 && (
                          <span className="forecast-rain-pill">
                            💧 {day.rainChance}%
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <p className="weather-demo-note my-3">Weather telemetry is not available.</p>
        )}
      </div>

      {/* Card Footer with Live Timestamp */}
      <div className="pt-2 mt-3 border-top d-flex justify-content-between align-items-center">
        <span className="weather-demo-note m-0">
          {weather?.isFallback ? (weather.fallbackReason || "Offline Agricultural Telemetry") : "Open-Meteo High-Resolution Numerical Model"}
        </span>
        <span className="weather-demo-note m-0">
          Updated: {weather?.updatedAt ? new Date(weather.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
        </span>
      </div>
    </article>
  );
}
