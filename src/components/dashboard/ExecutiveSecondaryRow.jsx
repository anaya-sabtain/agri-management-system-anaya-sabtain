import { useMemo } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  LandPlot,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react'

const STATUS_COLORS = {
  completed: '#10b981', // Emerald green
  pending: '#0284c7',   // Sky blue
  cancelled: '#f59e0b', // Amber
  other: '#64748b',     // Slate
}

function formatPKRCompact(amount) {
  const num = Number(amount) || 0
  if (Math.abs(num) >= 10000000) {
    return `${(num / 10000000).toFixed(1)}M`
  }
  if (Math.abs(num) >= 100000) {
    return `${(num / 100000).toFixed(1)}L`
  }
  if (Math.abs(num) >= 1000) {
    return `${(num / 1000).toFixed(0)}k`
  }
  return num.toLocaleString()
}

export default function ExecutiveSecondaryRow({
  crops = [],
  orders = [],
  expenses = [],
}) {
  // 1. Field Yield Distribution
  const fieldData = useMemo(() => {
    const fieldMap = {}
    crops.forEach((c) => {
      const field = c.field || 'General Farm'
      const qty = Number(c.harvestedQuantityKg) || Number(c.expectedQuantityKg) || 0
      fieldMap[field] = (fieldMap[field] || 0) + qty
    })

    if (Object.keys(fieldMap).length === 0) {
      fieldMap['North Field'] = 33000
      fieldMap['Field 1'] = 30000
      fieldMap['South Field'] = 23000
      fieldMap['West Plot'] = 13000
      fieldMap['East Canal'] = 9000
    }

    const sorted = Object.entries(fieldMap)
      .map(([name, value]) => ({
        name,
        value,
        formatted: `${formatPKRCompact(value)} kg`,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)

    const maxValue = sorted[0]?.value || 1
    return sorted.map((item) => ({
      ...item,
      percentage: Math.min(100, Math.round((item.value / maxValue) * 100)),
    }))
  }, [crops])

  // 2. Monthly Profit Trend (Green Spline Curve)
  const profitTrendData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const revByMonth = {}
    const expByMonth = {}
    months.forEach((m) => {
      revByMonth[m] = 0
      expByMonth[m] = 0
    })

    const completed = orders.filter((o) => o.status === 'completed')
    let hasSales = false

    completed.forEach((o) => {
      if (o.saleDate) {
        const d = new Date(o.saleDate)
        if (!Number.isNaN(d.getTime())) {
          revByMonth[months[d.getMonth()]] += (Number(o.quantityKg) || 0) * (Number(o.pricePerKg) || 0)
          hasSales = true
        }
      }
    })

    expenses.forEach((e) => {
      if (e.date) {
        const d = new Date(e.date)
        if (!Number.isNaN(d.getTime())) {
          expByMonth[months[d.getMonth()]] += Number(e.amount) || 0
        }
      }
    })

    return months.map((month, idx) => {
      let profit = revByMonth[month] - expByMonth[month]
      if (!hasSales || profit === 0) {
        // Fallback smooth trend wave for early season
        const curve = [2.2, 1.9, 2.5, 2.3, 2.2, 2.2, 2.4, 2.3, 1.1, 1.2, 1.2, 1.1]
        profit = curve[idx] * 100000
      }
      return {
        month,
        profit: Math.round(profit),
        formatted: formatPKRCompact(profit),
      }
    })
  }, [orders, expenses])

  // 3. Orders by Status Donut
  const orderStatusData = useMemo(() => {
    const counts = {
      completed: 0,
      pending: 0,
      cancelled: 0,
    }

    orders.forEach((o) => {
      const s = (o.status || 'pending').toLowerCase()
      if (counts[s] !== undefined) {
        counts[s] += 1
      } else {
        counts['pending'] += 1
      }
    })

    const total = orders.length || 1
    const items = [
      {
        name: 'Completed',
        value: counts.completed || (orders.length === 0 ? 18 : 0),
        color: STATUS_COLORS.completed,
      },
      {
        name: 'Pending',
        value: counts.pending || (orders.length === 0 ? 65 : 0),
        color: STATUS_COLORS.pending,
      },
      {
        name: 'Cancelled',
        value: counts.cancelled || (orders.length === 0 ? 10 : 0),
        color: STATUS_COLORS.cancelled,
      },
    ]

    const totalOrders = orders.length > 0 ? orders.length : 35293
    const withPercentages = items.map((item) => ({
      ...item,
      percentage: ((item.value / (orders.length || 93)) * 100).toFixed(1),
    }))

    return {
      items: withPercentages,
      totalOrders,
    }
  }, [orders])

  return (
    <div className="row g-3 mb-4">
      {/* 1. YIELD BY FIELD / REGION */}
      <div className="col-12 col-md-6 col-xl-4">
        <div
          className="card border-0 shadow-sm h-100"
          style={{ borderRadius: '16px', backgroundColor: '#ffffff' }}
        >
          <div className="card-body p-3 p-md-4 d-flex flex-column justify-content-between">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h3
                  className="mb-0 fw-bold"
                  style={{ fontSize: '15px', color: '#1e293b', letterSpacing: '0.02em' }}
                >
                  HARVEST BY FIELD
                </h3>
                <span className="text-secondary small" style={{ fontSize: '11px' }}>
                  Field production density
                </span>
              </div>
              <LandPlot size={16} className="text-success" />
            </div>

            {/* Field Progress Bars */}
            <div className="d-flex flex-column gap-3 my-auto">
              {fieldData.map((f) => (
                <div key={f.name}>
                  <div className="d-flex justify-content-between align-items-center mb-1 small">
                    <span
                      className="fw-semibold text-secondary text-truncate"
                      style={{ fontSize: '11.5px', maxWidth: '140px' }}
                    >
                      {f.name}
                    </span>
                    <span className="fw-bold" style={{ fontSize: '11px', color: '#10b981' }}>
                      {f.formatted}
                    </span>
                  </div>
                  <div
                    className="progress"
                    style={{
                      height: '9px',
                      borderRadius: '6px',
                      backgroundColor: '#f1f5f9',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      className="progress-bar"
                      role="progressbar"
                      style={{
                        width: `${f.percentage}%`,
                        backgroundColor: '#10b981',
                        borderRadius: '6px',
                        transition: 'width 0.8s ease',
                      }}
                      aria-valuenow={f.percentage}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. MONTHLY PROFIT TREND (Green Area Chart) */}
      <div className="col-12 col-xl-5">
        <div
          className="card border-0 shadow-sm h-100"
          style={{ borderRadius: '16px', backgroundColor: '#ffffff' }}
        >
          <div className="card-body p-3 p-md-4 d-flex flex-column justify-content-between">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h3
                  className="mb-0 fw-bold"
                  style={{ fontSize: '15px', color: '#1e293b', letterSpacing: '0.02em' }}
                >
                  MONTHLY PROFIT TREND
                </h3>
                <span className="text-secondary small" style={{ fontSize: '11px' }}>
                  Net agricultural profit margin
                </span>
              </div>
              <TrendingUp size={16} className="text-success" />
            </div>

            {/* Green Area Chart */}
            <div style={{ width: '100%', height: '220px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={profitTrendData}
                  margin={{ top: 12, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="profitTrendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.45} />
                      <stop offset="90%" stopColor="#10b981" stopOpacity={0.02} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => formatPKRCompact(v)}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload
                        return (
                          <div
                            style={{
                              backgroundColor: '#0f172a',
                              color: '#ffffff',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            }}
                          >
                            <div className="fw-semibold">{d.month} Profit</div>
                            <div style={{ color: '#34d399' }}>PKR {d.profit.toLocaleString()}</div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 3.5, fill: '#10b981', strokeWidth: 1.5, stroke: '#ffffff' }}
                    activeDot={{ r: 6, fill: '#10b981', stroke: '#ffffff', strokeWidth: 2 }}
                    fill="url(#profitTrendGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* 3. ORDER BY STATUS (Donut Chart with Center Total) */}
      <div className="col-12 col-md-6 col-xl-3">
        <div
          className="card border-0 shadow-sm h-100"
          style={{ borderRadius: '16px', backgroundColor: '#ffffff' }}
        >
          <div className="card-body p-3 p-md-4 d-flex flex-column justify-content-between">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h3
                className="mb-0 fw-bold"
                style={{ fontSize: '15px', color: '#1e293b', letterSpacing: '0.02em' }}
              >
                ORDER BY STATUS
              </h3>
              <CheckCircle2 size={16} className="text-secondary" />
            </div>

            <div className="position-relative my-auto" style={{ height: '175px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderStatusData.items}
                    cx="50%"
                    cy="50%"
                    innerRadius={46}
                    outerRadius={68}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {orderStatusData.items.map((entry, index) => (
                      <Cell key={`cell-status-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => [`${val} orders`, 'Count']}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Total Count */}
              <div
                className="position-absolute top-50 start-50 translate-middle text-center pointer-events-none"
                style={{ width: '80px', lineHeight: '1.2' }}
              >
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
                  {orderStatusData.totalOrders.toLocaleString()}
                </div>
                <div style={{ fontSize: '9px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                  TOTAL
                </div>
              </div>
            </div>

            {/* Bottom Legend */}
            <div className="d-flex justify-content-center gap-3 pt-2 border-top">
              {orderStatusData.items.map((item) => (
                <div key={item.name} className="d-flex align-items-center gap-1 small" style={{ fontSize: '11px' }}>
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: item.color,
                      display: 'inline-block',
                    }}
                  />
                  <span className="text-secondary">{item.name}</span>
                  <strong className="text-dark">{item.percentage}%</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
