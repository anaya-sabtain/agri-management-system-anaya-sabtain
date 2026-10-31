import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  UserCheck,
  CalendarCheck,
  Banknote,
  ArrowRight,
} from 'lucide-react'

function formatPKR(amount) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0)
}

export default function WorkersAttendanceSummary() {
  const navigate = useNavigate()

  const workers = useSelector(
    (state) => state.workers?.items ?? [],
  )

  const attendance = useSelector(
    (state) => state.attendance?.items ?? [],
  )

  const today = new Date().toISOString().slice(0, 10)

  const summary = useMemo(() => {
    const activeWorkers = workers.filter(
      (worker) => worker.status?.toLowerCase() === 'active',
    )

    const todayRecords = attendance.filter(
      (record) => record.date === today,
    )

    const presentToday = todayRecords.filter(
      (record) => record.status?.toLowerCase() === 'present',
    ).length

    const absentToday = todayRecords.filter(
      (record) => record.status?.toLowerCase() === 'absent',
    ).length

    // Estimate wages only for attendance records marked present.
    // Partial-day calculations depend on your attendance data model.
    const estimatedWages = todayRecords.reduce((total, record) => {
      if (record.status?.toLowerCase() !== 'present') return total

      const worker = workers.find(
        (item) => item.id === record.workerId,
      )

      const dailyWage = Number(worker?.dailyWage) || 0
      const hoursWorked = Number(record.hoursWorked)

      // If hours are missing or zero, assume a full day's wage.
      // Otherwise, calculate proportionally using an 8-hour workday.
      const wage = hoursWorked > 0
        ? dailyWage * Math.min(hoursWorked / 8, 1)
        : dailyWage

      return total + wage
    }, 0)

    return {
      totalWorkers: workers.length,
      activeWorkers: activeWorkers.length,
      presentToday,
      absentToday,
      attendanceRecordsToday: todayRecords.length,
      estimatedWages,
    }
  }, [workers, attendance, today])

  const cards = [
    {
      title: 'Total Workers',
      value: summary.totalWorkers,
      detail: `${summary.activeWorkers} active workers`,
      Icon: Users,
      color: 'primary',
    },
    {
      title: 'Present Today',
      value: summary.presentToday,
      detail: `${summary.absentToday} marked absent`,
      Icon: UserCheck,
      color: 'success',
    },
    {
      title: 'Attendance Records',
      value: summary.attendanceRecordsToday,
      detail: "Today's recorded entries",
      Icon: CalendarCheck,
      color: 'info',
    },
    {
      title: "Today's Estimated Wages",
      value: formatPKR(summary.estimatedWages),
      detail: 'Based on present attendance',
      Icon: Banknote,
      color: 'warning',
    },
  ]

  return (
    <section className="mb-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <h2 className="h5 fw-bold mb-1">Workers & Labour</h2>
          <p className="text-secondary small mb-0">
            Attendance overview and estimated daily labour cost
          </p>
        </div>

        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            onClick={() => navigate('/workers')}
          >
            Workers
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm d-flex align-items-center gap-1"
            onClick={() => navigate('/attendance')}
          >
            Attendance <ArrowRight size={15} />
          </button>
        </div>
      </div>

      <div className="row g-3">
        {cards.map(({ title, value, detail, Icon, color }) => (
          <div className="col-12 col-sm-6 col-xl-3" key={title}>
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start gap-2">
                  <div>
                    <p className="text-secondary small mb-2">{title}</p>
                    <h3 className="fw-bold fs-4 mb-2">{value}</h3>
                    <p className="text-secondary small mb-0">{detail}</p>
                  </div>

                  <div className={`rounded-3 bg-${color}-subtle text-${color} p-2`}>
                    <Icon size={22} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
