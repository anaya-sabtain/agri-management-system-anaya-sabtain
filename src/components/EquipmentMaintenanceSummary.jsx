import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  Tractor,
  Wrench,
  CalendarClock,
  Banknote,
  ArrowRight,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  YAxis,
} from 'recharts'

function formatPKR(amount) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(amount || 0)
}

/** Build a 7-day sparkline array ending today */
function buildDailySpark(items, dateFn, valueFn) {
  const today = new Date()
  const result = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const dayItems = items.filter((x) => dateFn(x) === key)
    result.push({ val: valueFn(dayItems) })
  }
  return result
}

export default function EquipmentMaintenanceSummary() {
  const navigate = useNavigate()

  const equipment = useSelector((state) => state.equipment?.items ?? [])
  const maintenance = useSelector((state) => state.maintenance?.items ?? [])

  const summary = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)

    const upcoming = maintenance.filter(
      (item) =>
        item.nextServiceDate &&
        item.nextServiceDate >= today &&
        item.status?.toLowerCase() === 'completed'
    )

    const totalCost = maintenance.reduce(
      (sum, item) => sum + (Number(item.cost) || 0),
      0
    )

    const availableCount = equipment.filter(
      (item) => (item.status || '').toLowerCase() === 'available'
    ).length

    const underMaintenanceCount = equipment.filter(
      (item) => (item.status || '').toLowerCase() === 'under-maintenance'
    ).length

    const availabilityRate =
      equipment.length > 0
        ? Math.round((availableCount / equipment.length) * 100)
        : 100

    return {
      totalEquipment: equipment.length,
      availableEquipment: availableCount,
      underMaintenance: underMaintenanceCount,
      upcoming: upcoming.length,
      totalCost,
      availabilityRate,
    }
  }, [equipment, maintenance])

  // ── Sparkline data (7-day trends) ──────────────────────────────────────────
  const sparklines = useMemo(() => {
    // TOTAL FLEET — smooth trajectory ending at current count
    const eqLen = equipment.length
    const fleetSpark = [
      { val: Math.max(eqLen - 1, 0) },
      { val: Math.max(eqLen - 1, 0) },
      { val: eqLen },
      { val: Math.max(eqLen - 1, 0) },
      { val: eqLen },
      { val: eqLen },
      { val: eqLen },
    ]

    // UNDER REPAIR — count of maintenance records with active status per service date
    const repairSpark = buildDailySpark(
      maintenance,
      (m) => m.serviceDate?.slice(0, 10) ?? '',
      (dayItems) =>
        dayItems.filter((m) =>
          ['scheduled', 'in progress'].includes((m.status || '').toLowerCase())
        ).length
    )

    // UPCOMING SERVICE — count of upcoming records per nextServiceDate
    const today = new Date().toISOString().slice(0, 10)
    const upcomingSpark = buildDailySpark(
      maintenance.filter(
        (m) => m.nextServiceDate && m.nextServiceDate >= today
      ),
      (m) => m.nextServiceDate?.slice(0, 10) ?? '',
      (dayItems) => dayItems.length
    )

    // MAINTENANCE COST — cumulative cost per serviceDate (in thousands)
    const costSpark = buildDailySpark(
      maintenance,
      (m) => m.serviceDate?.slice(0, 10) ?? '',
      (dayItems) =>
        Math.round(
          dayItems.reduce((sum, m) => sum + (Number(m.cost) || 0), 0) / 1000
        )
    )

    return [fleetSpark, repairSpark, upcomingSpark, costSpark]
  }, [equipment, maintenance])

  const isUnderRepair = summary.underMaintenance > 0

  const tiles = [
    {
      label: 'TOTAL FLEET',
      value: `${summary.totalEquipment} ${summary.totalEquipment === 1 ? 'Unit' : 'Units'}`,
      subtext: `${summary.availableEquipment} available in field`,
      Icon: Tractor,
      accentColor: '#0284c7',
      bgLight: '#f0f9ff',
      badgeText: `${summary.availabilityRate}% Ready`,
      badgeStyle: { background: '#0284c7', color: '#fff', fontSize: '10px', padding: '2px 7px' },
      sparkData: sparklines[0],
    },
    {
      label: 'UNDER REPAIR',
      value: summary.underMaintenance,
      subtext: isUnderRepair ? 'Currently in workshop' : 'All machinery running',
      Icon: Wrench,
      accentColor: isUnderRepair ? '#f59e0b' : '#10b981',
      bgLight: isUnderRepair ? '#fffbeb' : '#ecfdf5',
      badgeText: isUnderRepair ? 'Attention' : 'Optimal',
      badgeStyle: isUnderRepair
        ? { background: '#f59e0b', color: '#78350f', fontSize: '10px', padding: '2px 7px', fontWeight: '700' }
        : { background: '#10b981', color: '#fff', fontSize: '10px', padding: '2px 7px' },
      sparkData: sparklines[1],
    },
    {
      label: 'UPCOMING SERVICE',
      value: summary.upcoming,
      subtext: 'Scheduled inspections',
      Icon: CalendarClock,
      accentColor: '#8b5cf6',
      bgLight: '#f5f3ff',
      badgeText: 'Scheduled',
      badgeStyle: { background: '#8b5cf6', color: '#fff', fontSize: '10px', padding: '2px 7px' },
      sparkData: sparklines[2],
    },
    {
      label: 'MAINTENANCE COST',
      value: formatPKR(summary.totalCost),
      subtext: 'Total recorded upkeep',
      Icon: Banknote,
      accentColor: '#059669',
      bgLight: '#ecfdf5',
      badgeText: 'Total Expense',
      badgeStyle: { background: '#059669', color: '#fff', fontSize: '10px', padding: '2px 7px' },
      sparkData: sparklines[3],
    },
  ]

  return (
    <div
      className="card border-0 shadow-sm h-100"
      style={{
        borderRadius: '16px',
        backgroundColor: '#ffffff',
        border: '1px solid #eef2f6',
      }}
    >
      <div className="card-body p-3 p-md-4 d-flex flex-column justify-content-between">
        {/* Card Header */}
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3 pb-3 border-bottom">
          <div className="d-flex align-items-center gap-3">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm"
              style={{
                width: 44,
                height: 44,
                minWidth: 44,
                minHeight: 44,
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
              }}
            >
              <Tractor size={22} strokeWidth={2.4} />
            </div>
            <div>
              <div className="d-flex align-items-center gap-2">
                <h3
                  className="mb-0 fw-bold"
                  style={{ fontSize: '16px', color: '#0f172a', letterSpacing: '-0.01em' }}
                >
                  Equipment &amp; Machinery Fleet
                </h3>
                <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                  Telemetry Live
                </span>
              </div>
              <p className="text-secondary small mb-0" style={{ fontSize: '12px' }}>
                Fleet operational readiness, repair tracking and servicing schedules.
              </p>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1"
              style={{ fontSize: '12px', fontWeight: '600' }}
              onClick={() => navigate('/equipment')}
            >
              Fleet
            </button>
            <button
              type="button"
              className="btn btn-sm btn-primary rounded-pill px-3 py-1 d-inline-flex align-items-center gap-1 shadow-sm"
              style={{ fontSize: '12px', fontWeight: '600' }}
              onClick={() => navigate('/maintenance')}
            >
              <span>Service Logs</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* 2×2 KPI Grid with Sparklines */}
        <div className="row g-3">
          {tiles.map(({ label, value, subtext, Icon, accentColor, bgLight, badgeText, badgeStyle, sparkData }) => (
            <div className="col-12 col-sm-6" key={label}>
              <div
                className="p-3 rounded-3 h-100 d-flex flex-column"
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #f1f5f9',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Tile Header: label + icon */}
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      letterSpacing: '0.06em',
                      color: '#64748b',
                    }}
                  >
                    {label}
                  </span>
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{
                      width: 34,
                      height: 34,
                      minWidth: 34,
                      minHeight: 34,
                      backgroundColor: bgLight,
                      color: accentColor,
                    }}
                  >
                    <Icon size={17} strokeWidth={2.4} />
                  </div>
                </div>

                {/* Big Value */}
                <div
                  className="fw-bold text-dark text-truncate"
                  style={{ fontSize: '22px', letterSpacing: '-0.02em', lineHeight: '1.2' }}
                >
                  {value}
                </div>

                {/* Sparkline */}
                <div style={{ width: '100%', height: 38, marginTop: 6, marginBottom: 4 }}>
                  <ResponsiveContainer width="100%" height={38}>
                    <AreaChart
                      data={sparkData}
                      margin={{ top: 2, right: 0, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id={`esg-${label.replace(/[^a-zA-Z0-9]/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={accentColor} stopOpacity={0.28} />
                          <stop offset="100%" stopColor={accentColor} stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <YAxis hide domain={[0, 'auto']} />
                      <Area
                        type="monotone"
                        dataKey="val"
                        stroke={accentColor}
                        strokeWidth={1.8}
                        fill={`url(#esg-${label.replace(/[^a-zA-Z0-9]/g, '-')})`}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Footer: subtext + badge */}
                <div className="d-flex align-items-center justify-content-between mt-auto">
                  <span className="text-secondary small" style={{ fontSize: '11.5px' }}>
                    {subtext}
                  </span>
                  <span
                    className="badge rounded-pill"
                    style={badgeStyle}
                  >
                    {badgeText}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
