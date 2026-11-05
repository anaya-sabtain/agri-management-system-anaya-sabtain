import { useId } from 'react'
import { Sprout } from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'
import { useCountUp } from '../../hooks/useCountUp'

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon = Sprout,
  accent = '#10b981',
  sparkData,
  badgeText,
}) {
  const reactId = useId()
  const safeId = `${title ? title.replace(/[^a-zA-Z0-9]/g, '-') : 'stat'}-${reactId.replace(/[^a-zA-Z0-9]/g, '-')}`

  // Extract number if value is a string with suffix like "2,400 kg"
  const rawNumeric = typeof value === 'number'
    ? value
    : Number(String(value).replace(/[^0-9.-]+/g, '')) || 0

  const animatedNumeric = useCountUp(rawNumeric, 800)

  // Re-append unit if value had one (e.g. "kg")
  const displayValue = typeof value === 'string' && value.toLowerCase().includes('kg')
    ? `${animatedNumeric.toLocaleString()} kg`
    : animatedNumeric.toLocaleString()

  // Fallback sparkline if none passed
  const chartData = sparkData && sparkData.length >= 2
    ? sparkData
    : [
        { val: Math.round(rawNumeric * 0.5) || 5 },
        { val: Math.round(rawNumeric * 0.65) || 8 },
        { val: Math.round(rawNumeric * 0.6) || 7 },
        { val: Math.round(rawNumeric * 0.8) || 12 },
        { val: Math.round(rawNumeric * 0.75) || 10 },
        { val: Math.round(rawNumeric * 0.95) || 14 },
        { val: rawNumeric || 15 },
      ]

  return (
    <article
      className="stat-card d-flex flex-column justify-content-between h-100"
      style={{
        borderRadius: '16px',
        backgroundColor: '#ffffff',
        border: '1px solid #eef2f6',
        padding: '20px',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Top Header: Icon on left, micro badge on right */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <span
          className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
          style={{
            width: 42,
            height: 42,
            minWidth: 42,
            minHeight: 42,
            backgroundColor: `${accent}15`,
            color: accent,
          }}
        >
          <Icon size={20} strokeWidth={2.4} />
        </span>

        {badgeText && (
          <span
            className="badge rounded-pill fw-semibold border"
            style={{
              backgroundColor: `${accent}12`,
              color: accent,
              borderColor: `${accent}30`,
              fontSize: '11px',
              padding: '3px 8px',
            }}
          >
            {badgeText}
          </span>
        )}
      </div>

      {/* Main Metric Value & Title */}
      <div className="my-1">
        <p
          className="stat-card-title mb-1 text-secondary"
          style={{ fontSize: '13px', fontWeight: '600', letterSpacing: '-0.01em' }}
        >
          {title}
        </p>
        <h2
          className="stat-card-value fw-bold text-dark mb-0 text-truncate"
          style={{ fontSize: '26px', letterSpacing: '-0.02em', lineHeight: '1.2' }}
        >
          {displayValue}
        </h2>
      </div>

      {/* Mini Area Sparkline */}
      <div style={{ width: '100%', height: 42, marginTop: 10, marginBottom: 6 }}>
        <ResponsiveContainer width="100%" height={42}>
          <AreaChart
            data={chartData}
            margin={{ top: 2, right: 0, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id={`spark-${safeId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={accent} stopOpacity={0.28} />
                <stop offset="100%" stopColor={accent} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="val"
              stroke={accent}
              strokeWidth={2}
              fill={`url(#spark-${safeId})`}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Subtitle Footer */}
      <p
        className="stat-card-subtitle text-secondary small mb-0 mt-1"
        style={{ fontSize: '11.5px' }}
      >
        {subtitle}
      </p>
    </article>
  )
}
