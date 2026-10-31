import { useCallback, useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from 'react-redux'
import {
  Sprout,
  LandPlot,
  Wheat,
  ClipboardList,
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
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      setStatsError("Dashboard statistics could not be loaded.");
    }
  }, []);

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

  const statItems = [
    {
      title: 'Total Crops',
      value: stats.totalCrops,
      subtitle: 'Registered crops',
      icon: Sprout,
      accent: '#52865B',
    },
    {
      title: 'Active Fields',
      value: stats.activeFields,
      subtitle: 'Currently monitored',
      icon: LandPlot,
      accent: '#52865B',
    },
    {
      title: 'Expected Harvest',
      value: `${stats.expectedHarvestKg.toLocaleString()} kg`,
      subtitle: 'Estimated production',
      icon: Wheat,
      accent: '#B8860B',
    },
    {
      title: 'Pending Orders',
      value: stats.pendingOrders,
      subtitle: 'Awaiting completion',
      icon: ClipboardList,
      accent: '#52865B',
    },
  ];

  return (
    <section>
      {/* Smart Agricultural Alerts Banner */}
      <FarmAlertsBanner alerts={farmAlerts} />

      <div className="dashboard-section">
        <h2 className="page-heading">Farm Overview</h2>
        <p className="text-secondary mt-2 mb-0">
          Monitor your agricultural operations, atmospheric conditions and yield metrics.
        </p>
      </div>

      {statsError && (
        <div className="alert alert-warning mb-3" role="alert">
          {statsError}
        </div>
      )}

      {/* KPI Cards */}
      <div className="row g-3 dashboard-section">
        {statItems.map((stat) => (
          <div
            className="col-12 col-sm-6 col-xl-3"
            key={stat.title}
          >
            <StatCard {...stat} />
          </div>
        ))}
      </div>

      {/* Weather & Environment */}
      <div className="dashboard-section">
        <h2 className="dashboard-section-title">
          Weather & Environment
        </h2>

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

      {/* Crop Health & Harvest Schedule */}
      <div className="dashboard-section">
        <div className="row g-3">
          <div className="col-12 col-xl-6">
            <CropHealthList crops={crops} />
          </div>

          <div className="col-12 col-xl-6">
            <HarvestSchedule crops={crops} />
          </div>
        </div>
      </div>

      {/* Crop Analytics: Production & Health Distribution Charts */}
      <div className="dashboard-section">
        <div className="row g-3 align-items-stretch">
          <div className="col-12 col-xl-7">
            <HarvestChart crops={crops} orders={orders} />
          </div>
          <div className="col-12 col-xl-5">
            <CropHealthDistributionChart crops={crops} />
          </div>
        </div>
      </div>

      {/* Harvest vs Sales & Stock Balance Summary */}
      <div className="dashboard-section">
        <div className="row g-3">
          <div className="col-12">
            <StockSummaryWidget crops={crops} orders={orders} buyers={buyers} />
          </div>
        </div>
      </div>

      {/* Workers & Labour Attendance Live Summary */}
      <div className="dashboard-section">
        <WorkersAttendanceSummary />
      </div>

      {/* Equipment & Maintenance Live Summary */}
      <div className="dashboard-section">
        <EquipmentMaintenanceSummary />
      </div>
    </section>
  )
}
