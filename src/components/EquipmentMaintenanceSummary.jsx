import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import {
  Tractor,
  Wrench,
  CalendarClock,
  Banknote,
  ArrowRight,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function formatPKR(amount) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(amount || 0)
}

export default function EquipmentMaintenanceSummary() {
  const navigate = useNavigate()

  const equipment = useSelector(
    (state) => state.equipment?.items ?? [],
  )

  const maintenance = useSelector(
    (state) => state.maintenance?.items ?? [],
  )

  const summary = useMemo(() => {
    const activeMaintenance = maintenance.filter((item) =>
      ['scheduled', 'in progress'].includes(
        String(item.status).toLowerCase(),
      ),
    )

    const today = new Date().toISOString().slice(0, 10)

    const upcoming = maintenance.filter(
      (item) =>
        item.nextServiceDate &&
        item.nextServiceDate >= today &&
        item.status?.toLowerCase() === 'completed',
    )

    const totalCost = maintenance.reduce(
      (sum, item) => sum + (Number(item.cost) || 0),
      0,
    )

    return {
      totalEquipment: equipment.length,
      availableEquipment: equipment.filter(
        (item) => item.status?.toLowerCase() === 'available',
      ).length,
      underMaintenance: equipment.filter(
        (item) =>
          item.status?.toLowerCase() === 'under-maintenance',
      ).length,
      activeMaintenance: activeMaintenance.length,
      upcoming: upcoming.length,
      totalCost,
    }
  }, [equipment, maintenance])

  const cards = [
    {
      title: 'Total Equipment',
      value: summary.totalEquipment,
      detail: `${summary.availableEquipment} available`,
      Icon: Tractor,
      color: 'primary',
    },
    {
      title: 'Under Maintenance',
      value: summary.underMaintenance,
      detail: `${summary.activeMaintenance} active service records`,
      Icon: Wrench,
      color: 'warning',
    },
    {
      title: 'Upcoming Service',
      value: summary.upcoming,
      detail: 'Based on recorded next-service dates',
      Icon: CalendarClock,
      color: 'info',
    },
    {
      title: 'Maintenance Cost',
      value: formatPKR(summary.totalCost),
      detail: 'Total recorded cost',
      Icon: Banknote,
      color: 'success',
    },
  ]

  return (
    <section className="mb-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <h2 className="h5 fw-bold mb-1">Equipment & Maintenance</h2>
          <p className="text-secondary small mb-0">
            Live summary from your saved records
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2"
          onClick={() => navigate('/equipment')}
        >
          Manage Equipment <ArrowRight size={15} />
        </button>
      </div>

      <div className="row g-3">
        {cards.map(({ title, value, detail, Icon, color }) => (
          <div className="col-12 col-sm-6 col-xl-3" key={title}>
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex align-items-start justify-content-between gap-2">
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

      <div className="d-flex justify-content-end mt-3">
        <button
          type="button"
          className="btn btn-link btn-sm text-decoration-none"
          onClick={() => navigate('/maintenance')}
        >
          View maintenance history <ArrowRight size={15} />
        </button>
      </div>
    </section>
  )
}
