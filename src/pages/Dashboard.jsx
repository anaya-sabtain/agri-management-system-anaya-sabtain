import { useCallback, useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from 'react-redux'
import {
  Sprout,
  LandPlot,
  Wheat,
  ClipboardList,
  CheckCircle,
  Clock,
} from 'lucide-react'

import StatCard from '../components/common/StatCard'
import WeatherCard from '../components/dashboard/WeatherCard'
import HumidityCard from '../components/dashboard/HumidityCard'
import CropHealthList from '../components/dashboard/CropHealthList'
import HarvestSchedule from '../components/dashboard/HarvestSchedule'
import HarvestChart from '../components/dashboard/HarvestChart'
import CropHealthDistributionChart from '../components/dashboard/CropHealthDistributionChart'
import StockSummaryWidget from '../components/dashboard/StockSummaryWidget'
import FarmAlertsBanner from '../components/dashboard/FarmAlertsBanner'
import EquipmentMaintenanceSummary from '../components/EquipmentMaintenanceSummary'
import WorkersAttendanceSummary from '../components/WorkersAttendanceSummary'
import ExecutiveKpiStrip from '../components/dashboard/ExecutiveKpiStrip'
import ExecutiveControlHeader from '../components/dashboard/ExecutiveControlHeader'
import ExecutiveAnalyticsRow from '../components/dashboard/ExecutiveAnalyticsRow'
import ExecutiveSecondaryRow from '../components/dashboard/ExecutiveSecondaryRow'
import ExecutiveInsightsRow from '../components/dashboard/ExecutiveInsightsRow'
import { selectAllExpenses } from '../store/expensesSlice'

import {
  fetchWeather,
  selectWeather,
  selectWeatherLoading,
  selectWeatherError,
} from '../store/weatherSlice'
import { selectAllTasks } from '../store/tasksSlice'

import { STORAGE_KEYS } from "../data/dataModels";
import { getAll } from "../services/storageService";
import { getDashboardStats } from "../services/dashboardStats";
import { getFarmAlerts } from "../services/alertService";

export default function Dashboard() {
  const [crops, setCrops] = useState([]);
  const [orders, setOrders] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [viewMode, setViewMode] = useState('analytics');
  const [period, setPeriod] = useState('year');
  const [lastSyncedTime, setLastSyncedTime] = useState('Just now');
  const [stats, setStats] = useState({
    totalCrops: 0,
    activeFields: 0,
    expectedHarvestKg: 0,
    pendingOrders: 0,
  });

  const [statsError, setStatsError] = useState("");

  const dispatch = useDispatch()

  const weather = useSelector(selectWeather)
  const weatherLoading = useSelector(selectWeatherLoading)
  const weatherError = useSelector(selectWeatherError)
  const tasks = useSelector(selectAllTasks)
  const expenses = useSelector(selectAllExpenses)

  useEffect(() => {
    dispatch(fetchWeather())

    const refreshInterval = setInterval(() => {
      dispatch(fetchWeather())
    }, 15 * 60 * 1000)

    return () => {
      clearInterval(refreshInterval)
    }
  }, [dispatch])

  const refreshData = useCallback(() => {
    try {
      const savedCrops = getAll(STORAGE_KEYS.CROPS);
      const savedOrders = getAll(STORAGE_KEYS.ORDERS);
      const savedBuyers = getAll(STORAGE_KEYS.BUYERS);
      setCrops(savedCrops);
      setOrders(savedOrders);
      setBuyers(savedBuyers);
      setStats(getDashboardStats());
      setStatsError("");
      dispatch(fetchWeather());
      setLastSyncedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      setStatsError("Dashboard statistics could not be loaded.");
    }
  }, [dispatch]);

  useEffect(() => {
    refreshData();

    // Detect changes made in another browser tab.
    function handleStorageChange(event) {
      const relevantKeys = [
        "agri_crops",
        "agri_orders",
        "agri_buyers",
        "agri_tasks",
        "agri_expenses",
        "agri_inventory",
      ];

      if (event.key === null || relevantKeys.includes(event.key)) {
        refreshData();
      }
    }

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [refreshData]);

  // Compute live smart alerts
  const farmAlerts = useMemo(() => {
    return getFarmAlerts(weather);
  }, [crops, orders, tasks, weather]);

  // Real period filtering for orders
  const filteredOrders = useMemo(() => {
    if (period === 'year') return orders;
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth(); // 0 to 11

    return orders.filter((o) => {
      const dateStr = o.saleDate || o.createdAt;
      if (!dateStr) return true;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return true;
      const m = d.getMonth();
      const y = d.getFullYear();

      if (period === 'h1') return m >= 0 && m <= 5; // Q1 - Q2
      if (period === 'h2') return m >= 6 && m <= 11; // Q3 - Q4
      if (period === 'month') return m === curMonth && y === curYear;
      return true;
    });
  }, [orders, period]);

  // Real period filtering for expenses
  const filteredExpenses = useMemo(() => {
    if (period === 'year') return expenses;
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();

    return expenses.filter((e) => {
      const dateStr = e.date || e.createdAt;
      if (!dateStr) return true;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return true;
      const m = d.getMonth();
      const y = d.getFullYear();

      if (period === 'h1') return m >= 0 && m <= 5;
      if (period === 'h2') return m >= 6 && m <= 11;
      if (period === 'month') return m === curMonth && y === curYear;
      return true;
    });
  }, [expenses, period]);

  const statItems = useMemo(() => {
    const cropsVal = stats.totalCrops || 7;
    const fieldsVal = stats.activeFields || 7;
    const harvestVal = stats.expectedHarvestKg || 10600;
    const ordersVal = stats.pendingOrders || 3;

    return [
      {
        title: 'Total Crops',
        value: stats.totalCrops,
        subtitle: 'Registered crops',
        icon: Sprout,
        accent: '#10b981',
        badgeText: `${cropsVal} Registered`,
        sparkData: [
          { val: Math.max(cropsVal - 3, 2) },
          { val: Math.max(cropsVal - 2, 3) },
          { val: Math.max(cropsVal - 2, 4) },
          { val: Math.max(cropsVal - 1, 5) },
          { val: Math.max(cropsVal - 1, 5) },
          { val: cropsVal },
          { val: cropsVal },
        ],
      },
      {
        title: 'Active Fields',
        value: stats.activeFields,
        subtitle: 'Currently monitored',
        icon: LandPlot,
        accent: '#0284c7',
        badgeText: '100% Active',
        sparkData: [
          { val: Math.max(fieldsVal - 3, 3) },
          { val: Math.max(fieldsVal - 2, 4) },
          { val: Math.max(fieldsVal - 2, 4) },
          { val: Math.max(fieldsVal - 1, 5) },
          { val: Math.max(fieldsVal - 1, 6) },
          { val: fieldsVal },
          { val: fieldsVal },
        ],
      },
      {
        title: 'Expected Harvest',
        value: `${stats.expectedHarvestKg.toLocaleString()} kg`,
        subtitle: 'Estimated production',
        icon: Wheat,
        accent: '#f59e0b',
        badgeText: 'Yield Target',
        sparkData: [
          { val: Math.round(harvestVal * 0.42) },
          { val: Math.round(harvestVal * 0.55) },
          { val: Math.round(harvestVal * 0.62) },
          { val: Math.round(harvestVal * 0.74) },
          { val: Math.round(harvestVal * 0.86) },
          { val: Math.round(harvestVal * 0.95) },
          { val: harvestVal },
        ],
      },
      {
        title: 'Pending Orders',
        value: stats.pendingOrders,
        subtitle: 'Awaiting completion',
        icon: ClipboardList,
        accent: '#8b5cf6',
        badgeText: `${ordersVal} Pending`,
        sparkData: [
          { val: Math.max(ordersVal - 2, 1) },
          { val: Math.max(ordersVal - 1, 2) },
          { val: Math.max(ordersVal - 1, 1) },
          { val: Math.max(ordersVal + 1, 4) },
          { val: Math.max(ordersVal, 2) },
          { val: Math.max(ordersVal + 1, 4) },
          { val: ordersVal },
        ],
      },
    ];
  }, [stats]);

  return (
    <section>
      {/* Smart Agricultural Alerts Banner */}
      <FarmAlertsBanner alerts={farmAlerts} />

      {/* Farm Overview Header with Live Telemetry Stamp */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 dashboard-section mb-3">
        <div>
          <h2 className="page-heading mb-1" style={{ letterSpacing: '-0.02em' }}>
            Farm Overview
          </h2>
          <p className="text-secondary mb-0" style={{ fontSize: '13.5px' }}>
            Monitor your agricultural operations, atmospheric conditions and yield metrics.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-light text-secondary border px-2.5 py-1.5 d-inline-flex align-items-center gap-1.5 shadow-2xs">
            <span
              className="rounded-circle bg-success"
              style={{ width: 6, height: 6, display: 'inline-block' }}
            />
            <span style={{ fontSize: '11.5px', fontWeight: '500' }}>
              Operational • Updated: {lastSyncedTime}
            </span>
          </span>
        </div>
      </div>

      {statsError && (
        <div className="alert alert-warning mb-3" role="alert">
          {statsError}
        </div>
      )}

      {/* Executive Analysis Control Toolbar (Filters & Real-working controls) */}
      <ExecutiveControlHeader
        orders={filteredOrders}
        expenses={filteredExpenses}
        crops={crops}
        buyers={buyers}
        onRefresh={refreshData}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        period={period}
        onPeriodChange={setPeriod}
      />

      {/* 1. EXECUTIVE ANALYTICS SECTION (Filtered according to period) */}
      {(viewMode === 'analytics' || viewMode === 'all') && (
        <>
          <div className="dashboard-section mb-3">
            <ExecutiveKpiStrip
              orders={filteredOrders}
              expenses={filteredExpenses}
              buyers={buyers}
              crops={crops}
            />
          </div>

          <div className="dashboard-section mb-3">
            <ExecutiveAnalyticsRow orders={filteredOrders} crops={crops} />
          </div>

          <div className="dashboard-section mb-3">
            <ExecutiveSecondaryRow
              crops={crops}
              orders={filteredOrders}
              expenses={filteredExpenses}
            />
          </div>

          <div className="dashboard-section mb-3">
            <ExecutiveInsightsRow
              buyers={buyers}
              orders={filteredOrders}
              crops={crops}
              expenses={filteredExpenses}
            />
          </div>
        </>
      )}

      {/* 2. FIELD & CROP OPERATIONS SECTION */}
      {(viewMode === 'operations' || viewMode === 'all') && (
        <>
          <div className="row g-3 dashboard-section mb-3">
            {statItems.map((stat) => (
              <div className="col-12 col-sm-6 col-xl-3" key={stat.title}>
                <StatCard {...stat} />
              </div>
            ))}
          </div>

          <div className="dashboard-section mb-3">
            <div className="row g-3">
              <div className="col-12 col-lg-7">
                <WeatherCard
                  weather={weather}
                  loading={weatherLoading}
                  error={weatherError || ''}
                  onRetry={() => dispatch(fetchWeather())}
                  location="Lahore, Pakistan"
                />
              </div>
              <div className="col-12 col-lg-5">
                <HumidityCard
                  humidity={weather ? weather.humidity : 65}
                  isLive={Boolean(weather)}
                  weather={weather}
                />
              </div>
            </div>
          </div>

          <div className="dashboard-section mb-3">
            <div className="row g-3">
              <div className="col-12 col-xl-6">
                <CropHealthList crops={crops} />
              </div>
              <div className="col-12 col-xl-6">
                <HarvestSchedule crops={crops} />
              </div>
            </div>
          </div>

          <div className="dashboard-section mb-3">
            <div className="row g-3 align-items-stretch">
              <div className="col-12 col-xl-7">
                <HarvestChart crops={crops} orders={filteredOrders} />
              </div>
              <div className="col-12 col-xl-5">
                <CropHealthDistributionChart crops={crops} />
              </div>
            </div>
          </div>

          <div className="dashboard-section mb-3">
            <StockSummaryWidget crops={crops} orders={filteredOrders} buyers={buyers} />
          </div>
        </>
      )}

      {/* 3. LABOUR & MACHINERY SECTION (Twin Cards) */}
      {(viewMode === 'labour' || viewMode === 'all' || viewMode === 'analytics') && (
        <div className="row g-4 mb-4 align-items-stretch">
          <div className="col-12 col-xl-6">
            <WorkersAttendanceSummary />
          </div>
          <div className="col-12 col-xl-6">
            <EquipmentMaintenanceSummary />
          </div>
        </div>
      )}
    </section>
  )
}
