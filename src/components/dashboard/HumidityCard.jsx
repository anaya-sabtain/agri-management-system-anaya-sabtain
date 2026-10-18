import { Droplets, CheckCircle, AlertTriangle, ShieldAlert, Wind, Sprout, ShieldCheck, Bug } from "lucide-react";
import { useCountUp } from "../../hooks/useCountUp";

function getHumidityCategory(val) {
  if (val < 40) {
    return {
      label: "Low (Dry)",
      desc: "Dry atmospheric air — accelerate soil moisture monitoring",
      className: "humidity-badge--low",
      fillColor: "#e65100",
      Icon: AlertTriangle,
    };
  }
  if (val <= 70) {
    return {
      label: "Optimal",
      desc: "Ideal moisture for vegetative growth & leaf stomatal transpiration",
      className: "humidity-badge--optimal",
      fillColor: "#2e7d32",
      Icon: CheckCircle,
    };
  }
  return {
    label: "High (Humid)",
    desc: "Elevated canopy humidity — monitor field crops for fungal spore germination",
    className: "humidity-badge--high",
    fillColor: "#0288d1",
    Icon: ShieldAlert,
  };
}

export default function HumidityCard({ humidity = 65, isLive = false, weather = null }) {
  const safeHumidity = Math.min(100, Math.max(0, Number(humidity) || 0));
  const animatedHumidity = useCountUp(safeHumidity, 900);
  const category = getHumidityCategory(safeHumidity);
  const { Icon } = category;

  // Agricultural Advisories calculation
  const windSpeed = weather?.windSpeed ?? 3.6;
  const dewPoint = weather?.dewPoint ?? 15;

  const sprayWindow =
    windSpeed < 12 && safeHumidity >= 40 && safeHumidity <= 70
      ? { status: "Ideal Window", color: "text-success", badge: "Optimal", note: "Low drift risk & high chemical absorption" }
      : windSpeed >= 12
      ? { status: "High Wind Caution", color: "text-warning", badge: "Caution", note: "Wind > 12 km/h causes pesticide drift" }
      : { status: "Suboptimal", color: "text-secondary", badge: "Moderate", note: "Consider spraying during early morning" };

  const fungalRisk =
    safeHumidity > 70
      ? { status: "Elevated Risk", color: "text-danger", badge: "High", note: "Leaf wetness favors powdery mildew & rust" }
      : safeHumidity < 40
      ? { status: "Very Low Risk", color: "text-success", badge: "Minimal", note: "Dry canopy prevents pathogen proliferation" }
      : { status: "Low Risk", color: "text-success", badge: "Safe", note: "Normal ambient moisture levels" };

  const transpiration =
    safeHumidity < 40
      ? { status: "High Evaporation", color: "text-warning", note: "Elevated water loss through leaf pores" }
      : safeHumidity > 70
      ? { status: "Restricted Transpiration", color: "text-info", note: "Slow nutrient uptake from root system" }
      : { status: "Balanced Transpiration", color: "text-success", note: "Optimal nutrient & water transport" };

  return (
    <article className="humidity-card h-100 d-flex flex-column justify-content-between">
      <div>
        {/* Card Header */}
        <div className="humidity-heading">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <p className="weather-eyebrow mb-0">CANOPY ENVIRONMENT</p>
              <span className="badge bg-light text-secondary border py-0 px-2" style={{ fontSize: "10px" }}>
                Target: 40% – 70%
              </span>
            </div>
            <h3 style={{ margin: "0 !important", fontSize: "18px !important", fontWeight: 750 }}>
              Relative Humidity
            </h3>
          </div>

          <div className="humidity-icon shadow-sm">
            <Droplets size={24} />
          </div>
        </div>

        {/* Value Row with Category Badge */}
        <div className="humidity-value-row my-3">
          <div className="d-flex align-items-baseline gap-2">
            <span className="humidity-value">{animatedHumidity}%</span>
            <span className={`humidity-status-pill ${category.className}`}>
              <Icon size={12} className="me-1" />
              {category.label}
            </span>
          </div>

          <p className="humidity-advisory-text mb-1">{category.desc}</p>
        </div>

        {/* Multi-Zone Segmented Track with Position Indicator Pin */}
        <div>
          <div className="humidity-segmented-track">
            <div className="seg-low" title="0 - 40% Low Dry" />
            <div className="seg-optimal" title="40 - 70% Optimal" />
            <div className="seg-high" title="70 - 100% High Humid" />
          </div>

          {/* Marker pin positioned dynamically */}
          <div className="humidity-marker-container">
            <div
              className="humidity-marker-pin"
              style={{ left: `${animatedHumidity}%` }}
              title={`Current Humidity: ${animatedHumidity}%`}
            />
          </div>

          {/* Track Zone Scale Labels */}
          <div className="humidity-scale mt-2">
            <span>0% (Arid)</span>
            <span className="humidity-scale-mid">40% Safe Min</span>
            <span className="humidity-scale-opt">Optimal (40–70%)</span>
            <span>100% (Saturated)</span>
          </div>
        </div>

        {/* Agronomic Field Advisory Panel (Fills the card space with valuable intelligence) */}
        <div className="agri-advisory-grid">
          {/* Foliar Spray Window */}
          <div className="agri-advisory-item">
            <div className="d-flex align-items-center justify-content-between">
              <span className="agri-advisory-label">Spray Window</span>
              <span className="badge bg-light text-success border" style={{ fontSize: "9px" }}>
                {sprayWindow.badge}
              </span>
            </div>
            <strong className={`agri-advisory-val ${sprayWindow.color}`}>
              {sprayWindow.status}
            </strong>
            <span className="text-muted" style={{ fontSize: "10.5px" }}>
              {sprayWindow.note}
            </span>
          </div>

          {/* Fungal Blight Risk */}
          <div className="agri-advisory-item">
            <div className="d-flex align-items-center justify-content-between">
              <span className="agri-advisory-label">Fungal Blight Risk</span>
              <span className="badge bg-light text-secondary border" style={{ fontSize: "9px" }}>
                {fungalRisk.badge}
              </span>
            </div>
            <strong className={`agri-advisory-val ${fungalRisk.color}`}>
              {fungalRisk.status}
            </strong>
            <span className="text-muted" style={{ fontSize: "10.5px" }}>
              {fungalRisk.note}
            </span>
          </div>

          {/* Evapotranspiration */}
          <div className="agri-advisory-item">
            <span className="agri-advisory-label">Crop Transpiration</span>
            <strong className={`agri-advisory-val ${transpiration.color}`}>
              {transpiration.status}
            </strong>
            <span className="text-muted" style={{ fontSize: "10.5px" }}>
              {transpiration.note}
            </span>
          </div>

          {/* Dew Point Condensation */}
          <div className="agri-advisory-item">
            <span className="agri-advisory-label">Dew Point Condensation</span>
            <strong className="agri-advisory-val text-dark">
              {dewPoint}°C Condensation
            </strong>
            <span className="text-muted" style={{ fontSize: "10.5px" }}>
              {safeHumidity >= 70 ? "Night condensation likely" : "Low risk of surface leaf wetness"}
            </span>
          </div>
        </div>
      </div>

      {/* Card Footer matching WeatherCard */}
      <div className="pt-2 mt-3 border-top d-flex justify-content-between align-items-center">
        <span className="weather-demo-note m-0">
          Field Humidity & Evaporation Index
        </span>
        <span className="weather-demo-note m-0">
          {isLive ? "Telemetry: Live" : "Sample Mode"}
        </span>
      </div>
    </article>
  );
}
