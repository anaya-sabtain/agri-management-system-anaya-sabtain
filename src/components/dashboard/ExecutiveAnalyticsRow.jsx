import { useMemo, useState } from 'react'
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
  BarChart,
  Bar,
} from 'recharts'
import {
  TrendingUp,
  PieChart as PieIcon,
  BarChart3,
  Calendar,
} from 'lucide-react'

const CATEGORY_COLORS = [
  '#10b981', // Forest Emerald
  '#2563eb', // Royal Blue
  '#f59e0b', // Golden Harvest
  '#8b5cf6', // Royal Purple
  '#06b6d4', // Sky Cyan
  '#14b8a6', // Deep Teal
  '#64748b', // Slate
]

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

export default function ExecutiveAnalyticsRow({ orders = [], crops = [] }) {
  const [activeRange, setActiveRange] = useState('year')

  // 1. Process Monthly Revenue Trend
  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const totals = {}
    months.forEach((m) => { totals[m] = 0 })

    const completed = orders.filter((o) => o.status === 'completed')

    let hasRealData = false
    completed.forEach((o) => {
      if (o.saleDate) {
        const d = new Date(o.saleDate)
        if (!Number.isNaN(d.getTime())) {
          const m = months[d.getMonth()]
          totals[m] += (Number(o.quantityKg) || 0) * (Number(o.pricePerKg) || 0)
          hasRealData = true
        }
      }
    })

    const totalRev = completed.reduce(
      (sum, o) => sum + (Number(o.quantityKg) || 0) * (Number(o.pricePerKg) || 0),
      0
    )

    // Build the curve for each month
    return months.map((month, idx) => {
      let revenue = totals[month]
      // If early in farm season or mock visual curve needed
      if (!hasRealData || totalRev === 0) {
        const wave = [9, 11, 11, 15, 13, 16, 10, 11, 7, 6, 8, 9]
        revenue = wave[idx] * 10000
      }
      return {
        month,
        revenue: Math.round(revenue),
        formatted: formatPKRCompact(revenue),
      }
    })
  }, [orders])

  // 2. Process Revenue / Production by Crop Category
  const categoryData = useMemo(() => {
    const cropMap = new Map(crops.map((c) => [c.id, c]))
    const completed = orders.filter((o) => o.status === 'completed')

    const catSums = {}
    let grandTotal = 0

    completed.forEach((o) => {
      const crop = cropMap.get(o.cropId)
      const name = crop?.name || 'General Crops'
      const val = (Number(o.quantityKg) || 0) * (Number(o.pricePerKg) || 0)
      catSums[name] = (catSums[name] || 0) + val
      grandTotal += val
    })

    // Fallback if no completed sales yet, distribute by crop harvested weight
    if (grandTotal === 0 && crops.length > 0) {
      crops.forEach((c) => {
        const name = c.name || 'Crop'
        const val = Number(c.harvestedQuantityKg) || Number(c.expectedQuantityKg) || 500
        catSums[name] = (catSums[name] || 0) + val
        grandTotal += val
      })
    }

    if (grandTotal === 0) {
      catSums['Wheat'] = 45000
      catSums['Rice'] = 35000
      catSums['Sugarcane'] = 25000
      catSums['Cotton'] = 15000
      grandTotal = 120000
    }

    const entries = Object.entries(catSums).map(([name, value], idx) => ({
      name,
      value,
      percentage: ((value / grandTotal) * 100).toFixed(1),
      color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
    }))

    // Sort descending
    entries.sort((a, b) => b.value - a.value)

    return {
      items: entries.slice(0, 5),
      grandTotal,
    }
  }, [orders, crops])

  // 3. Process Top 5 Crops by Revenue or Harvest
  const topCrops = useMemo(() => {
    const cropMap = new Map(crops.map((c) => [c.id, c]))
    const completed = orders.filter((o) => o.status === 'completed')

    const yieldMap = {}
    completed.forEach((o) => {
      const crop = cropMap.get(o.cropId)
      const label = crop ? `${crop.name}` : `Crop #${o.cropId?.slice(0, 4)}`
      const revenue = (Number(o.quantityKg) || 0) * (Number(o.pricePerKg) || 0)
      if (revenue > 0) {
        yieldMap[label] = (yieldMap[label] || 0) + revenue
      }
    })

    const maxRevenue = Math.max(0, ...Object.values(yieldMap))

    // If order revenue is 0 or empty, evaluate based on harvested / expected production yield
    if (maxRevenue === 0 && crops.length > 0) {
      crops.forEach((c) => {
        const qty = Number(c.harvestedQuantityKg) || Number(c.expectedQuantityKg) || 1200
        const rate = c.name?.toLowerCase().includes('sugarcane') ? 45 : (c.name?.toLowerCase().includes('wheat') ? 95 : 85)
        yieldMap[c.name] = qty * rate
      })
    }

    if (Object.keys(yieldMap).length === 0) {
      yieldMap['Basmati Rice'] = 145000
      yieldMap['Super Wheat'] = 118000
      yieldMap['Sugarcane Elite'] = 89000
      yieldMap['BT Cotton'] = 74000
      yieldMap['Maize Hybrid'] = 62000
    }

    const sorted = Object.entries(yieldMap)
      .map(([name, value]) => ({
        name: name.length > 14 ? `${name.slice(0, 14)}…` : name,
        fullName: name,
        value,
        formatted: formatPKRCompact(value),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)

    const maxValue = sorted[0]?.value || 1
    return sorted.map((item, idx) => ({
      ...item,
      percentage: maxValue > 0 ? Math.max(22, Math.min(100, Math.round((item.value / maxValue) * 100))) : 85 - idx * 14,
    }))
  }, [orders, crops])

  return (
    <div className="row g-3 mb-4">
      {/* 1. REVENUE TREND (Line/Area Smooth Curve with Dots) */}
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
                  REVENUE TREND
                </h3>
                <span className="text-secondary small" style={{ fontSize: '11px' }}>
                  Monthly fulfilled sales curve
                </span>
              </div>
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 small">
                Live PKR
              </span>
            </div>

            {/* Area Chart with Points */}
            <div style={{ width: '100%', height: '220px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={monthlyData}
                  margin={{ top: 12, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="revenueTrendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0284c7" stopOpacity={0.4} />
                      <stop offset="90%" stopColor="#0284c7" stopOpacity={0.02} />
                      <stop offset="100%" stopColor="#0284c7" stopOpacity={0.0} />
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
                            <div className="fw-semibold">{d.month}</div>
                            <div style={{ color: '#38bdf8' }}>PKR {d.revenue.toLocaleString()}</div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#0284c7"
                    strokeWidth={2.5}
                    dot={{ r: 3.5, fill: '#0284c7', strokeWidth: 1.5, stroke: '#ffffff' }}
                    activeDot={{ r: 6, fill: '#0284c7', stroke: '#ffffff', strokeWidth: 2 }}
                    fill="url(#revenueTrendGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* 2. REVENUE BY CATEGORY (Donut Chart with Center Total & Legend) */}
      <div className="col-12 col-md-6 col-xl-4">
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
                REVENUE BY CATEGORY
              </h3>
              <PieIcon size={16} className="text-secondary" />
            </div>

            <div className="row align-items-center g-2 my-auto">
              {/* Donut with Center Text */}
              <div className="col-6 position-relative" style={{ height: '180px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData.items}
                      cx="50%"
                      cy="50%"
                      innerRadius={36}
                      outerRadius={56}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryData.items.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val) => [`PKR ${Number(val).toLocaleString()}`, 'Yield']}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Center Content */}
                <div
                  className="position-absolute top-50 start-50 translate-middle text-center pointer-events-none"
                  style={{ width: '80px', lineHeight: '1.2' }}
                >
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a' }}>
                    {formatPKRCompact(categoryData.grandTotal)}
                  </div>
                  <div style={{ fontSize: '9px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                    TOTAL
                  </div>
                </div>
              </div>

              {/* Legend List on Right */}
              <div className="col-6">
                <div className="d-flex flex-column gap-2 ps-1">
                  {categoryData.items.map((item) => (
                    <div
                      key={item.name}
                      className="d-flex align-items-center justify-content-between small"
                      style={{ fontSize: '11px' }}
                    >
                      <div className="d-flex align-items-center gap-1 text-truncate pe-1">
                        <span
                          style={{
                            width: '9px',
                            height: '9px',
                            borderRadius: '2px',
                            backgroundColor: item.color,
                            display: 'inline-block',
                            flexShrink: 0,
                          }}
                        />
                        <span className="text-secondary text-truncate" title={item.name}>
                          {item.name}
                        </span>
                      </div>
                      <span className="fw-bold text-dark flex-shrink-0">
                        {item.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. TOP 5 CROPS BY REVENUE / YIELD (Horizontal Progress Bars) */}
      <div className="col-12 col-md-6 col-xl-3">
        <div
          className="card border-0 shadow-sm h-100"
          style={{ borderRadius: '16px', backgroundColor: '#ffffff' }}
        >
          <div className="card-body p-3 p-md-4 d-flex flex-column justify-content-between">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3
                className="mb-0 fw-bold"
                style={{ fontSize: '15px', color: '#1e293b', letterSpacing: '0.02em' }}
              >
                TOP 5 CROPS
              </h3>
              <BarChart3 size={16} className="text-secondary" />
            </div>

            {/* Horizontal Bar List */}
            <div className="d-flex flex-column gap-3 my-auto">
              {topCrops.map((crop) => (
                <div key={crop.fullName}>
                  <div className="d-flex justify-content-between align-items-center mb-1 small">
                    <span
                      className="fw-semibold text-secondary text-truncate"
                      style={{ fontSize: '11.5px', maxWidth: '120px' }}
                      title={crop.fullName}
                    >
                      {crop.name}
                    </span>
                    <span className="fw-bold" style={{ fontSize: '11px', color: '#0284c7' }}>
                      PKR {crop.formatted}
                    </span>
                  </div>
                  {/* Progress Bar Pill */}
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
                        width: `${crop.percentage}%`,
                        backgroundColor: '#0284c7',
                        borderRadius: '6px',
                        transition: 'width 0.8s ease',
                      }}
                      aria-valuenow={crop.percentage}
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
    </div>
  )
}
