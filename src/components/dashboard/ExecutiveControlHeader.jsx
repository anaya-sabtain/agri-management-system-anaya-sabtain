import { useState, useMemo } from 'react'
import {
  TrendingUp,
  Download,
  RefreshCw,
  LayoutDashboard,
  Sprout,
  Users,
  Layers,
  CheckCircle2,
  Calendar,
  Filter,
} from 'lucide-react'
import { exportToCSV } from '../../services/csvExport'

export default function ExecutiveControlHeader({
  orders = [],
  expenses = [],
  crops = [],
  buyers = [],
  onRefresh,
  viewMode = 'analytics',
  onViewModeChange,
  period = 'year',
  onPeriodChange,
}) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [justRefreshed, setJustRefreshed] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [justExported, setJustExported] = useState(false)

  // Compute live period metrics for badge display
  const periodStats = useMemo(() => {
    const completed = orders.filter((o) => o.status === 'completed')
    const totalRev = completed.reduce((sum, o) => {
      return sum + (Number(o.quantityKg) || 0) * (Number(o.pricePerKg) || 0)
    }, 0)

    return {
      orderCount: orders.length,
      completedCount: completed.length,
      revenue: totalRev,
    }
  }, [orders])

  const handleRefreshClick = async () => {
    if (isRefreshing) return
    setIsRefreshing(true)
    setJustRefreshed(false)

    try {
      if (onRefresh) {
        await onRefresh()
      }
      setJustRefreshed(true)
      setTimeout(() => setJustRefreshed(false), 2200)
    } catch (err) {
      console.error('Refresh failed:', err)
    } finally {
      setTimeout(() => setIsRefreshing(false), 500)
    }
  }

  const handleExportSummary = () => {
    if (isExporting) return
    setIsExporting(true)

    try {
      const buyerMap = new Map((buyers || []).map((b) => [b.id, b.fullName || b.name]))
      const cropMap = new Map((crops || []).map((c) => [c.id, c]))

      const exportRows = orders.map((o) => {
        const crop = cropMap.get(o.cropId)
        const qty = Number(o.quantityKg) || 0
        const price = Number(o.pricePerKg) || 0
        const total = qty * price

        return {
          'Order ID': o.id || 'N/A',
          'Sale Date': o.saleDate || o.createdAt?.slice(0, 10) || 'N/A',
          'Buyer Name': buyerMap.get(o.buyerId) || 'Walk-in Purchaser',
          'Crop Name': crop?.name || o.cropId || 'General Crop',
          'Field / Plot': crop?.field || 'Main Farm',
          'Quantity (kg)': qty,
          'Rate (PKR/kg)': price,
          'Total Revenue (PKR)': total,
          'Order Status': (o.status || 'pending').toUpperCase(),
        }
      })

      // Add a summary row at the bottom if records exist
      if (exportRows.length > 0) {
        const grandTotal = exportRows.reduce((sum, r) => sum + (Number(r['Total Revenue (PKR)']) || 0), 0)
        exportRows.push({
          'Order ID': 'TOTAL SUMMARY',
          'Sale Date': new Date().toISOString().slice(0, 10),
          'Buyer Name': `${orders.length} Total Orders`,
          'Crop Name': '-',
          'Field / Plot': '-',
          'Quantity (kg)': exportRows.reduce((sum, r) => sum + (Number(r['Quantity (kg)']) || 0), 0),
          'Rate (PKR/kg)': '-',
          'Total Revenue (PKR)': grandTotal,
          'Order Status': 'AGGREGATE',
        })
      }

      const todayStr = new Date().toISOString().slice(0, 10)
      exportToCSV(exportRows, `AgriSense_Executive_Report_${period}_${todayStr}.csv`)

      setJustExported(true)
      setTimeout(() => setJustExported(false), 2500)
    } catch (err) {
      console.error('Export error:', err)
      alert('Could not export CSV. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const views = [
    { id: 'analytics', label: 'Executive Analytics', Icon: LayoutDashboard, accent: '#10b981' },
    { id: 'operations', label: 'Field & Crop Operations', Icon: Sprout, accent: '#0284c7' },
    { id: 'labour', label: 'Labour & Machinery', Icon: Users, accent: '#f59e0b' },
    { id: 'all', label: 'All-in-One Overview', Icon: Layers, accent: '#8b5cf6' },
  ]

  const periodOptions = [
    { id: 'year', label: 'All Year' },
    { id: 'h1', label: 'Q1 - Q2' },
    { id: 'h2', label: 'Q3 - Q4' },
    { id: 'month', label: 'This Month' },
  ]

  return (
    <div
      className="card border-0 shadow-sm p-3 mb-4"
      style={{
        borderRadius: '16px',
        background: '#ffffff',
        border: '1px solid #eef2f6',
      }}
    >
      {/* Top Bar: Section Title + Badges + Action Buttons */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 pb-3 border-bottom">
        {/* Left: Section Identity */}
        <div className="d-flex align-items-center gap-3">
          <div
            className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm"
            style={{
              width: 44,
              height: 44,
              minWidth: 44,
              minHeight: 44,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
            }}
          >
            <TrendingUp size={22} strokeWidth={2.4} />
          </div>

          <div>
            <div className="d-flex flex-wrap align-items-center gap-2">
              <h2
                className="fs-5 fw-bold text-dark mb-0"
                style={{ letterSpacing: '-0.02em' }}
              >
                Sales &amp; Profit Customer Analysis
              </h2>
              <span className="badge bg-success-subtle text-success border border-success-subtle d-inline-flex align-items-center gap-1.5 py-1 px-2">
                <span
                  className="rounded-circle bg-success"
                  style={{
                    width: 7,
                    height: 7,
                    display: 'inline-block',
                    boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.25)',
                  }}
                />
                Live Telemetry
              </span>

              {/* Dynamic feedback tag */}
              <span
                className="badge bg-light text-secondary border d-none d-sm-inline-flex align-items-center gap-1 py-1 px-2"
                style={{ fontSize: '11px' }}
              >
                <Filter size={11} className="text-muted" />
                <span>
                  {periodStats.orderCount} Orders • {period === 'year' ? 'All Year' : period === 'h1' ? 'Q1-Q2' : period === 'h2' ? 'Q3-Q4' : 'This Month'}
                </span>
              </span>
            </div>

            <p className="text-secondary small mb-0 mt-0.5" style={{ fontSize: '12px' }}>
              Agricultural market metrics, yield trends, customer revenue and field intelligence.
            </p>
          </div>
        </div>

        {/* Right: Refresh & Export Controls */}
        <div className="d-flex align-items-center gap-2">
          {onRefresh && (
            <button
              type="button"
              className={`btn btn-sm rounded-3 px-3 py-1.5 d-inline-flex align-items-center gap-1.5 transition-all ${
                justRefreshed
                  ? 'btn-success text-white'
                  : 'btn-outline-secondary bg-white text-dark border'
              }`}
              onClick={handleRefreshClick}
              disabled={isRefreshing}
              title="Reload live farm records and atmospheric conditions"
              style={{ fontSize: '12.5px', fontWeight: '600' }}
            >
              {justRefreshed ? (
                <>
                  <CheckCircle2 size={14} />
                  <span>Synced!</span>
                </>
              ) : (
                <>
                  <RefreshCw
                    size={14}
                    style={{
                      transition: 'transform 0.5s ease',
                      transform: isRefreshing ? 'rotate(360deg)' : 'none',
                    }}
                  />
                  <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            className={`btn btn-sm rounded-3 px-3 py-1.5 d-inline-flex align-items-center gap-1.5 shadow-sm transition-all ${
              justExported
                ? 'btn-dark text-white'
                : 'btn-success text-white'
            }`}
            onClick={handleExportSummary}
            disabled={isExporting}
            title="Download executive CSV data for current view"
            style={{ fontSize: '12.5px', fontWeight: '600' }}
          >
            {justExported ? (
              <>
                <CheckCircle2 size={14} />
                <span>Downloaded!</span>
              </>
            ) : (
              <>
                <Download size={14} />
                <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Bottom Bar: View Switcher Tabs + Period Filter Pills */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 pt-3">
        {/* View Mode Segmented Controls */}
        <div className="overflow-x-auto py-1" style={{ maxWidth: '100%', WebkitOverflowScrolling: 'touch' }}>
          <div
            className="btn-group p-1 rounded-pill border shadow-2xs"
            style={{ backgroundColor: '#f1f5f9', whiteSpace: 'nowrap' }}
            role="group"
            aria-label="Dashboard view modes"
          >
          {views.map(({ id, label, Icon, accent }) => {
            const isActive = viewMode === id
            return (
              <button
                key={id}
                type="button"
                className={`btn btn-sm rounded-pill px-3 py-1.5 d-inline-flex align-items-center gap-2 transition-all ${
                  isActive
                    ? 'bg-white text-dark fw-bold shadow-sm'
                    : 'text-secondary border-0 bg-transparent'
                }`}
                style={{
                  fontSize: '12.5px',
                  fontWeight: isActive ? '700' : '500',
                }}
                onClick={() => onViewModeChange && onViewModeChange(id)}
              >
                <Icon
                  size={14}
                  style={{
                    color: isActive ? accent : '#94a3b8',
                    transition: 'color 0.2s ease',
                  }}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span>{label}</span>
              </button>
            )
          })}
          </div>
        </div>

        {/* Period Filter Segmented Pills (Jan..Dec filters that REALLY filter) */}
        <div className="d-flex align-items-center gap-2 ms-auto ms-lg-0">
          <span
            className="text-secondary small fw-bold d-inline-flex align-items-center gap-1"
            style={{ fontSize: '11.5px', color: '#64748b' }}
          >
            <Calendar size={13} />
            <span>Period:</span>
          </span>

          <div
            className="btn-group btn-group-sm p-1 rounded-pill border shadow-2xs"
            style={{ backgroundColor: '#f1f5f9' }}
            role="group"
            aria-label="Time period filter"
          >
            {periodOptions.map((tab) => {
              const isActive = period === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`btn btn-sm rounded-pill px-2.5 px-md-3 py-1 transition-all ${
                    isActive
                      ? 'bg-white text-dark fw-bold shadow-sm'
                      : 'text-secondary border-0 bg-transparent'
                  }`}
                  style={{
                    fontSize: '11.5px',
                    fontWeight: isActive ? '700' : '500',
                  }}
                  onClick={() => onPeriodChange && onPeriodChange(tab.id)}
                  title={`Filter telemetry to ${tab.label}`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
