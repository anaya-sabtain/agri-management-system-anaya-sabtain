import { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Plus,
  Trash2,
  Pencil,
  Clock,
  AlertTriangle,
  Download,
  Printer,
  ShieldCheck,
  Check,
} from 'lucide-react'

import { selectAllTasks, taskAdded, taskUpdated, taskDeleted } from '../store/tasksSlice'
import { selectAllCrops } from '../store/cropsSlice'
import { selectUserRole } from '../store/authSlice'
import { activityAdded } from '../store/activitySlice'
import { exportToCSV } from '../services/csvExport'

const TASK_TYPES = ['Irrigation', 'Fertilizer', 'Spraying', 'Labour']
const FILTERS = ['All', 'Pending', 'Done', 'Overdue']

function getTaskStatus(task) {
  if (task.status === 'Done') return 'Done'
  if (task.dueDate && task.dueDate < new Date().toLocaleDateString('en-CA')) {
    return 'Overdue'
  }
  return 'Pending'
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    if (Number.isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export default function FarmTasks() {
  const dispatch = useDispatch()
  const tasks = useSelector(selectAllTasks)
  const crops = useSelector(selectAllCrops)
  const role = useSelector(selectUserRole)
  const isAdmin = role === 'Admin'

  const [title, setTitle] = useState('')
  const [type, setType] = useState('Irrigation')
  const [cropId, setCropId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [filter, setFilter] = useState('All')
  const [message, setMessage] = useState('')
  const [editingId, setEditingId] = useState(null)

  const today = new Date().toLocaleDateString('en-CA')

  const tasksWithStatus = useMemo(
    () => tasks.map((task) => ({ ...task, displayStatus: getTaskStatus(task) })),
    [tasks, today]
  )

  const visibleTasks = tasksWithStatus.filter(
    (task) => filter === 'All' || task.displayStatus === filter
  )

  const counts = {
    total: tasks.length,
    pending: tasksWithStatus.filter((task) => task.displayStatus === 'Pending').length,
    done: tasksWithStatus.filter((task) => task.displayStatus === 'Done').length,
    overdue: tasksWithStatus.filter((task) => task.displayStatus === 'Overdue').length,
  }

  function handleSubmit(event) {
    event.preventDefault()
    setMessage('')

    if (!title.trim() || !dueDate) {
      setMessage('Please enter a task title and due date.')
      return
    }

    if (dueDate < today && !editingId) {
      setMessage('Please choose today or a future date for a new task.')
      return
    }

    if (editingId && !isAdmin) {
      return
    }

    const taskData = {
      title: title.trim(),
      type,
      cropId: cropId || null,
      dueDate,
      notes: notes.trim(),
    }

    if (editingId) {
      dispatch(
        taskUpdated({
          id: editingId,
          changes: taskData,
        })
      )

      dispatch(
        activityAdded({
          action: 'UPDATE',
          entity: 'Task',
          entityId: editingId,
          description: `Updated task: ${taskData.title}`,
        })
      )

      setMessage('Task updated successfully.')
    } else {
      dispatch(taskAdded(taskData))

      dispatch(
        activityAdded({
          action: 'CREATE',
          entity: 'Task',
          description: `Created task: ${taskData.title}`,
        })
      )

      setMessage('Task added successfully.')
    }

    setEditingId(null)
    setTitle('')
    setType('Irrigation')
    setCropId('')
    setDueDate('')
    setNotes('')
  }

  function handleEdit(task) {
    if (!isAdmin) return

    setEditingId(task.id)
    setTitle(task.title)
    setType(task.type)
    setCropId(task.cropId || '')
    setDueDate(task.dueDate)
    setNotes(task.notes || '')
    setMessage('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditingId(null)
    setTitle('')
    setType('Irrigation')
    setCropId('')
    setDueDate('')
    setNotes('')
    setMessage('')
  }

  function markDone(task) {
    dispatch(
      taskUpdated({
        id: task.id,
        changes: { status: 'Done' },
      })
    )

    dispatch(
      activityAdded({
        action: 'UPDATE',
        entity: 'Task',
        entityId: task.id,
        description: `Completed task: ${task.title}`,
      })
    )

    setMessage(`Task "${task.title}" marked as completed!`)
  }

  function deleteTask(task) {
    if (!isAdmin) return

    if (window.confirm(`Delete task "${task.title}"?`)) {
      dispatch(taskDeleted(task.id))

      dispatch(
        activityAdded({
          action: 'DELETE',
          entity: 'Task',
          entityId: task.id,
          description: `Deleted task: ${task.title}`,
        })
      )

      setMessage('Task deleted successfully.')
    }
  }

  const handleExportCSV = () => {
    const exportData = visibleTasks.map((t) => {
      const crop = crops.find((c) => c.id === t.cropId)
      return {
        Task_Title: t.title,
        Type: t.type,
        Related_Crop: crop?.name || 'General',
        Due_Date: t.dueDate,
        Status: t.displayStatus,
        Notes: t.notes || '',
      }
    })
    exportToCSV(exportData, `Farm_Tasks_Schedule_${new Date().toISOString().slice(0, 10)}.csv`)
  }

  return (
    <main className="container-fluid py-4 px-md-4">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="analytics-eyebrow text-success mb-0">
              OPERATIONAL FIELD SCHEDULER
            </span>
            <span className="badge rounded-pill bg-light text-secondary border small">
              <ShieldCheck size={12} className="me-1 inline" />
              Live Workflows
            </span>
          </div>
          <h1 className="h3 fw-bold mb-1 text-dark">Farm Task Scheduler</h1>
          <p className="text-secondary small mb-0">
            Plan daily field tasks, track irrigation & fertilizer schedules, and monitor deadlines.
          </p>
        </div>

        <div className="d-flex flex-wrap align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm rounded-pill d-inline-flex align-items-center gap-2 px-3 py-2 shadow-sm"
            onClick={handleExportCSV}
            title="Download CSV"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            className="btn btn-outline-secondary btn-sm rounded-pill d-inline-flex align-items-center gap-2 px-3 py-2 shadow-sm"
            onClick={() => window.print()}
            title="Print"
          >
            <Printer size={14} />
            <span>Print</span>
          </button>

          <span className="badge bg-white text-secondary border rounded-pill px-3 py-2 small shadow-sm">
            <ClipboardList size={14} className="me-1 inline text-success" />
            {counts.total} Total Tasks
          </span>
        </div>
      </div>

      {message && (
        <div className="alert alert-success alert-dismissible fade show rounded-3 mb-4" role="status">
          {message}
          <button type="button" className="btn-close" aria-label="Close" onClick={() => setMessage('')} />
        </div>
      )}

      {/* 4 Stat Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-xl-3">
          <div className="pnl-stat-card card--pipeline h-100">
            <div className="stat-card-top">
              <span className="stat-card-title fw-semibold">Total Workflows</span>
              <div className="stat-card-icon" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                <ClipboardList size={20} />
              </div>
            </div>
            <div className="stat-card-value text-dark">{counts.total}</div>
            <div className="stat-card-subtitle d-flex justify-content-between">
              <span>All recorded tasks</span>
              <span className="badge rounded-pill bg-light text-secondary border small">Total</span>
            </div>
          </div>
        </div>

        <div className="col-6 col-xl-3">
          <div className="pnl-stat-card card--pipeline h-100">
            <div className="stat-card-top">
              <span className="stat-card-title fw-semibold">Pending Action</span>
              <div className="stat-card-icon" style={{ background: '#fef3c7', color: '#b45309' }}>
                <Clock size={20} />
              </div>
            </div>
            <div className="stat-card-value text-warning">{counts.pending}</div>
            <div className="stat-card-subtitle d-flex justify-content-between">
              <span>Awaiting field work</span>
              <span className="badge rounded-pill bg-warning-subtle text-warning-emphasis small">Active</span>
            </div>
          </div>
        </div>

        <div className="col-6 col-xl-3">
          <div className="pnl-stat-card card--profit h-100">
            <div className="stat-card-top">
              <span className="stat-card-title fw-semibold">Completed</span>
              <div className="stat-card-icon" style={{ background: '#e8f5e9', color: '#1b5e20' }}>
                <CheckCircle2 size={20} />
              </div>
            </div>
            <div className="stat-card-value text-success">{counts.done}</div>
            <div className="stat-card-subtitle d-flex justify-content-between">
              <span>Successfully finished</span>
              <span className="badge rounded-pill bg-success-subtle text-success small">Done</span>
            </div>
          </div>
        </div>

        <div className="col-6 col-xl-3">
          <div className={`pnl-stat-card ${counts.overdue > 0 ? 'card--expense' : 'card--profit'} h-100`}>
            <div className="stat-card-top">
              <span className="stat-card-title fw-semibold">Overdue Tasks</span>
              <div
                className="stat-card-icon"
                style={{
                  background: counts.overdue > 0 ? '#fff1f2' : '#e8f5e9',
                  color: counts.overdue > 0 ? '#e11d48' : '#2e7d32',
                }}
              >
                <AlertTriangle size={20} />
              </div>
            </div>
            <div className={`stat-card-value ${counts.overdue > 0 ? 'text-danger' : 'text-success'}`}>
              {counts.overdue}
            </div>
            <div className="stat-card-subtitle d-flex justify-content-between">
              <span>Past deadline date</span>
              <span
                className={`badge rounded-pill small ${
                  counts.overdue > 0
                    ? 'bg-danger-subtle text-danger'
                    : 'bg-success-subtle text-success'
                }`}
              >
                {counts.overdue > 0 ? 'Action Required' : 'On Track'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Create Task Form Column */}
        <div className="col-12 col-xl-4">
          <section className="analytics-card">
            <div className="analytics-card-header mb-3">
              <div>
                <p className="analytics-eyebrow">TASK DISPATCH</p>
                <h3 className="h6 fw-bold mb-0">
                  {editingId ? 'Edit Scheduled Task' : 'Dispatch New Task'}
                </h3>
              </div>
              <div className="analytics-header-icon" style={{ background: '#e8f5e9', color: '#2e7d32' }}>
                <Plus size={19} />
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label fw-semibold small" htmlFor="task-title">
                  Task Title *
                </label>
                <input
                  id="task-title"
                  className="form-control"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. Irrigate Sector B Wheat"
                  maxLength={100}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold small" htmlFor="task-type">
                  Operation Type *
                </label>
                <select
                  id="task-type"
                  className="form-select"
                  value={type}
                  onChange={(event) => setType(event.target.value)}
                >
                  {TASK_TYPES.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold small" htmlFor="task-crop">
                  Target Field / Crop
                </label>
                <select
                  id="task-crop"
                  className="form-select"
                  value={cropId}
                  onChange={(event) => setCropId(event.target.value)}
                >
                  <option value="">General Farm Routine</option>
                  {crops.map((crop) => (
                    <option key={crop.id} value={crop.id}>
                      {crop.name} {crop.field ? `— ${crop.field}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold small" htmlFor="task-date">
                  Execution Due Date *
                </label>
                <input
                  id="task-date"
                  type="date"
                  className="form-control"
                  value={dueDate}
                  min={today}
                  onChange={(event) => setDueDate(event.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold small" htmlFor="task-notes">
                  Instructions & Notes
                </label>
                <textarea
                  id="task-notes"
                  className="form-control"
                  rows="3"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Operational details, personnel assigned, or pump hours..."
                />
              </div>

              <div className="d-flex gap-2 pt-2">
                <button className="btn btn-success flex-grow-1 rounded-pill fw-semibold" type="submit">
                  {editingId ? 'Save Changes' : 'Schedule Task'}
                </button>

                {editingId && (
                  <button
                    className="btn btn-outline-secondary rounded-pill px-3"
                    type="button"
                    onClick={cancelEdit}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>
        </div>

        {/* Task Schedule List Column */}
        <div className="col-12 col-xl-8">
          <section className="analytics-card p-0 overflow-hidden">
            <div className="p-3 p-md-4 border-bottom bg-white d-flex flex-wrap justify-content-between align-items-center gap-3">
              <div>
                <p className="analytics-eyebrow">FIELD SCHEDULE</p>
                <h3 className="h6 fw-bold mb-0">Scheduled Tasks ({visibleTasks.length})</h3>
              </div>

              <div className="btn-group btn-group-sm rounded-pill border p-1 bg-light" role="group">
                {FILTERS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`btn btn-sm rounded-pill border-0 px-3 ${
                      filter === item ? 'btn-white bg-white shadow-sm fw-semibold text-dark' : 'text-secondary'
                    }`}
                    onClick={() => setFilter(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 p-md-4">
              {visibleTasks.length === 0 ? (
                <div className="text-center text-secondary py-5">
                  <CalendarDays size={36} className="mb-2 opacity-50" />
                  <p className="fw-semibold mb-1">No tasks in this view</p>
                  <p className="small mb-0">Select another filter or schedule a new task on the left.</p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {visibleTasks.map((task) => {
                    const crop = crops.find((item) => item.id === task.cropId)
                    const status = task.displayStatus

                    return (
                      <article
                        className="p-3 rounded-3 border bg-white shadow-xs transition-hover"
                        key={task.id}
                        style={{ borderLeftWidth: 4, borderLeftColor: status === 'Done' ? '#198754' : status === 'Overdue' ? '#dc3545' : '#ffc107' }}
                      >
                        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                          <div className="flex-grow-1">
                            <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                              <h4 className="h6 fw-bold mb-0 text-dark">{task.title}</h4>
                              <span
                                className={`badge rounded-pill small ${
                                  status === 'Done'
                                    ? 'bg-success-subtle text-success border border-success-subtle'
                                    : status === 'Overdue'
                                      ? 'bg-danger-subtle text-danger border border-danger-subtle'
                                      : 'bg-warning-subtle text-warning-emphasis border border-warning-subtle'
                                }`}
                              >
                                {status}
                              </span>
                            </div>

                            <div className="d-flex flex-wrap align-items-center gap-3 small text-secondary">
                              <span>
                                <span className="badge text-bg-light border me-1">{task.type}</span>
                                {crop ? `${crop.name} (${crop.field || 'Field'})` : 'General Farm'}
                              </span>
                              <span>
                                <CalendarDays size={13} className="me-1 inline" />
                                Due: {formatDate(task.dueDate)}
                              </span>
                            </div>

                            {task.notes && (
                              <p className="small text-secondary mb-0 mt-2 bg-light p-2 rounded-2">
                                {task.notes}
                              </p>
                            )}
                          </div>

                          <div className="d-flex align-items-center gap-1">
                            {status !== 'Done' && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-success rounded-pill d-inline-flex align-items-center gap-1 px-3 py-1"
                                onClick={() => markDone(task)}
                                title="Mark task as finished"
                              >
                                <Check size={14} />
                                <span>Complete</span>
                              </button>
                            )}

                            {isAdmin && (
                              <>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => handleEdit(task)}
                                  title="Edit task"
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => deleteTask(task)}
                                  title="Delete task"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="p-3 bg-white border-top d-flex justify-content-between align-items-center small text-secondary">
              <span>Displaying <strong>{visibleTasks.length}</strong> tasks</span>
              <span>Filter: <strong>{filter}</strong></span>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
