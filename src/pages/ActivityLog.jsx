import { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Activity,
  Search,
  Trash2,
  Clock,
  ClipboardList,
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
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4 d-flex align-items-center gap-3">
              <div
                className="bg-primary-subtle text-primary rounded-circle flex-shrink-0"
                style={{
                  width: 48,
                  height: 48,
                  minWidth: 48,
                  minHeight: 48,
                  aspectRatio: '1 / 1',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <Activity size={24} />
              </div>
              <div>
                <div className="text-secondary small">Recorded Activities</div>
                <div className="h3 fw-bold mb-0">{activities.length}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4 d-flex align-items-center gap-3">
              <div
                className="bg-success-subtle text-success rounded-circle flex-shrink-0"
                style={{
                  width: 48,
                  height: 48,
                  minWidth: 48,
                  minHeight: 48,
                  aspectRatio: '1 / 1',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <ClipboardList size={24} />
              </div>
              <div>
                <div className="text-secondary small">Matching Activities</div>
                <div className="h3 fw-bold mb-0">
                  {filteredActivities.length}
                </div>
              </div>
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
