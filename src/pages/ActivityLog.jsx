import { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'
import {
  Activity,
  Search,
  Trash2,
  Clock,
  ClipboardList,
  Filter,
} from 'lucide-react'

import {
  selectAllActivities,
  activityCleared,
} from '../store/activitySlice'

const formatDate = (timestamp) => {
  const date = new Date(timestamp)

  if (Number.isNaN(date.getTime())) return 'Invalid date'

  return date.toLocaleString()
}

export default function ActivityLog() {
  const dispatch = useDispatch()
  const activities = useSelector(selectAllActivities)

  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('All')

  const filteredActivities = useMemo(() => {
    return activities.filter((item) => {
      const text = [
        item.description,
        item.entity,
        item.action,
        item.user,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      const matchesSearch = text.includes(search.toLowerCase())
      const matchesAction =
        actionFilter === 'All' || item.action === actionFilter

      return matchesSearch && matchesAction
    })
  }, [activities, search, actionFilter])

  function clearActivities() {
    if (activities.length === 0) return

    const confirmed = window.confirm(
      'Are you sure you want to clear the activity log?'
    )

    if (confirmed) {
      dispatch(activityCleared())
    }
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">Activity Log</h1>
          <p className="text-secondary mb-0">
            Review recorded actions across your farm management system.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline-danger d-flex align-items-center gap-2"
          onClick={clearActivities}
          disabled={activities.length === 0}
        >
          <Trash2 size={17} />
          Clear Log
        </button>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-6">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-3 p-md-4">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-secondary small fw-bold text-uppercase" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>
                Recorded Activities
              </span>
              <div
                className="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{
                  width: 42,
                  height: 42,
                  minWidth: 42,
                  minHeight: 42,
                }}
              >
                <Activity size={22} />
              </div>
            </div>

            <div className="h2 fw-bold text-dark mb-1">{activities.length}</div>

            {/* Sparkline */}
            <div style={{ width: '100%', height: 42, marginTop: 4, marginBottom: 4 }}>
              <ResponsiveContainer width="100%" height={42}>
                <AreaChart
                  data={[
                    { val: Math.max(activities.length - 4, 1) },
                    { val: Math.max(activities.length - 3, 2) },
                    { val: Math.max(activities.length - 2, 3) },
                    { val: Math.max(activities.length - 1, 4) },
                    { val: Math.max(activities.length - 1, 5) },
                    { val: activities.length },
                    { val: activities.length },
                  ]}
                  margin={{ top: 2, right: 0, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="actSparkTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0284c7" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="#0284c7" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="val"
                    stroke="#0284c7"
                    strokeWidth={2}
                    fill="url(#actSparkTotal)"
                    dot={false}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="d-flex align-items-center justify-content-between mt-auto pt-1">
              <span className="small text-secondary">Lifetime audit actions</span>
              <span className="badge rounded-pill bg-primary-subtle text-primary border border-primary-subtle small">
                All Logs Active
              </span>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-3 p-md-4">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-secondary small fw-bold text-uppercase" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>
                Matching Activities
              </span>
              <div
                className="bg-success-subtle text-success rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{
                  width: 42,
                  height: 42,
                  minWidth: 42,
                  minHeight: 42,
                }}
              >
                <ClipboardList size={22} />
              </div>
            </div>

            <div className="h2 fw-bold text-dark mb-1">{filteredActivities.length}</div>

            {/* Sparkline */}
            <div style={{ width: '100%', height: 42, marginTop: 4, marginBottom: 4 }}>
              <ResponsiveContainer width="100%" height={42}>
                <AreaChart
                  data={[
                    { val: Math.max(filteredActivities.length - 3, 1) },
                    { val: Math.max(filteredActivities.length - 2, 2) },
                    { val: Math.max(filteredActivities.length - 2, 2) },
                    { val: Math.max(filteredActivities.length - 1, 3) },
                    { val: Math.max(filteredActivities.length - 1, 4) },
                    { val: filteredActivities.length },
                    { val: filteredActivities.length },
                  ]}
                  margin={{ top: 2, right: 0, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="actSparkFilter" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="val"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#actSparkFilter)"
                    dot={false}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="d-flex align-items-center justify-content-between mt-auto pt-1">
              <span className="small text-secondary">Filtered by query &amp; category</span>
              <span className="badge rounded-pill bg-success-subtle text-success border border-success-subtle small">
                {actionFilter === 'All' ? 'Full Match' : actionFilter}
              </span>
            </div>
          </div>
        </div>
      </div>

      <section className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="card-header bg-white p-3 p-md-4">
          <div className="row g-3">
            <div className="col-12 col-md-8">
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <Search size={18} />
                </span>
                <input
                  className="form-control"
                  aria-label="Search activity log"
                  placeholder="Search description, module or user..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
            </div>

            <div className="col-12 col-md-4">
              <select
                className="form-select"
                aria-label="Filter by action type"
                value={actionFilter}
                onChange={(event) => setActionFilter(event.target.value)}
              >
                <option value="All">All Actions</option>
                <option value="CREATE">Create</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
              </select>
            </div>
          </div>
        </div>

        <div className="list-group list-group-flush">
          {filteredActivities.map((item) => (
            <div
              className="list-group-item p-3 p-md-4"
              key={item.id}
            >
              <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
                <div className="d-flex gap-3">
                  <div
                    className="bg-light rounded-circle p-2 align-self-start flex-shrink-0"
                    style={{
                      width: 36,
                      height: 36,
                      minWidth: 36,
                      minHeight: 36,
                      aspectRatio: '1 / 1',
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    <Activity size={18} className="text-success" />
                  </div>

                  <div>
                    <div className="fw-semibold">
                      {item.description || 'Activity recorded'}
                    </div>
                    <div className="small text-secondary mt-1">
                      {item.entity || 'General'} · {item.user || 'Unknown user'}
                    </div>
                    <div className="small text-secondary mt-2 d-flex align-items-center gap-1">
                      <Clock size={14} />
                      {formatDate(item.timestamp)}
                    </div>
                  </div>
                </div>

                <span className="badge text-bg-light border">
                  {item.action || 'OTHER'}
                </span>
              </div>
            </div>
          ))}

          {filteredActivities.length === 0 && (
            <div className="text-center py-5 px-3">
              <Activity size={34} className="text-secondary mb-2" />
              <h2 className="h6 fw-bold">No activities found</h2>
              <p className="text-secondary small mb-0">
                Activities will appear here when they are recorded.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
