import { Sprout } from 'lucide-react'
import { useCountUp } from '../../hooks/useCountUp'

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon = Sprout,
  accent = '#52865B',
}) {
  // Extract number if value is a string with suffix like "2,400 kg"
  const rawNumeric = typeof value === "number"
    ? value
    : Number(String(value).replace(/[^0-9.-]+/g, "")) || 0;

  const animatedNumeric = useCountUp(rawNumeric, 800);

  // Re-append unit if value had one (e.g. "kg")
  const displayValue = typeof value === "string" && value.toLowerCase().includes("kg")
    ? `${animatedNumeric.toLocaleString()} kg`
    : animatedNumeric.toLocaleString();

  return (
    <article className="stat-card">
      <div className="stat-card-top">
        <span
          className="stat-card-icon"
          style={{ color: accent }}
        >
          <Icon size={22} />
        </span>
      </div>

      <p className="stat-card-title">{title}</p>
      <h2 className="stat-card-value">{displayValue}</h2>
      <p className="stat-card-subtitle">{subtitle}</p>
    </article>
  )
}
