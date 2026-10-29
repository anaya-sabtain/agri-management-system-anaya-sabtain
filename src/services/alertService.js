import { STORAGE_KEYS } from "../data/dataModels";
import { getAll } from "./storageService";
import { getAvailableStock } from "./orderUtils";

export function getFarmAlerts(weather = null) {
  const crops = getAll(STORAGE_KEYS.CROPS);
  const orders = getAll(STORAGE_KEYS.ORDERS);
  const tasks = getAll(STORAGE_KEYS.TASKS);
  const inventory = getAll(STORAGE_KEYS.INVENTORY);
  const alerts = [];

  const today = new Date();
  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  // 1. Critical Crop Health Alerts
  crops.forEach((crop) => {
    const score = Number(crop.healthScore) || 0;
    if (score < 60) {
      alerts.push({
        id: `health-${crop.id}`,
        type: "danger",
        category: "Crop Health",
        title: `Critical Health Alert: ${crop.name} (${crop.field || "Field"})`,
        message: `Health score is at ${score}%. Immediate pest/irrigation inspection recommended.`,
      });
    }
  });

  // 2. Harvest Due Soon or Overdue Alerts
  crops
    .filter((c) => ["growing", "ready"].includes(c.status) && c.cuttingDate)
    .forEach((crop) => {
      const cuttingDate = crop.cuttingDate;
      const d1 = new Date(`${todayString}T00:00:00`).getTime();
      const d2 = new Date(`${cuttingDate}T00:00:00`).getTime();
      const diffDays = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));

      if (crop.status === "ready" || diffDays <= 0) {
        alerts.push({
          id: `harvest-due-${crop.id}`,
          type: "warning",
          category: "Harvest Operations",
          title: `Harvest Ready/Overdue: ${crop.name}`,
          message: diffDays < 0
            ? `Cutting was due ${Math.abs(diffDays)} day(s) ago (${cuttingDate}). Harvest immediately to avoid crop spoilage.`
            : `Scheduled for cutting today (${cuttingDate}). Prepare harvest machinery.`,
        });
      } else if (diffDays <= 3) {
        alerts.push({
          id: `harvest-soon-${crop.id}`,
          type: "info",
          category: "Harvest Operations",
          title: `Harvest Approaching: ${crop.name}`,
          message: `Cutting scheduled in ${diffDays} day(s) (${cuttingDate}) on ${crop.field || "field"}.`,
        });
      }
    });

  // 3. Low Available Stock Alerts
  crops.forEach((crop) => {
    const available = getAvailableStock(crop, orders);
    const harvested = Number(crop.harvestedQuantityKg) || 0;
    if (harvested > 0 && available < 200 && available > 0) {
      alerts.push({
        id: `stock-low-${crop.id}`,
        type: "warning",
        category: "Inventory",
        title: `Low Warehouse Stock: ${crop.name}`,
        message: `Only ${available.toLocaleString()} kg remaining for buyer allocation.`,
      });
    } else if (harvested > 0 && available === 0) {
      alerts.push({
        id: `stock-out-${crop.id}`,
        type: "secondary",
        category: "Inventory",
        title: `Out of Stock: ${crop.name}`,
        message: `All harvested stock has been fully committed or delivered to buyers.`,
      });
    }
  });

  // 4. Farm Task Scheduler Alerts
  tasks.forEach((task) => {
    // Completed tasks should not generate alerts.
    if (String(task.status).toLowerCase() === "done") return;

    if (!task.dueDate) return;

    const diffDays = Math.round(
      (
        new Date(`${task.dueDate}T00:00:00`).getTime() -
        new Date(`${todayString}T00:00:00`).getTime()
      ) / (1000 * 60 * 60 * 24)
    );

    const taskName = task.title || task.type || "Farm task";

    if (diffDays < 0) {
      alerts.push({
        id: `task-overdue-${task.id}`,
        type: "danger",
        category: "Farm Tasks",
        title: `Overdue Task: ${taskName}`,
        message: `This task was due ${Math.abs(diffDays)} day(s) ago. Complete it as soon as possible.`,
      });
    } else if (diffDays === 0) {
      alerts.push({
        id: `task-due-${task.id}`,
        type: "warning",
        category: "Farm Tasks",
        title: `Task Due Today: ${taskName}`,
        message: "This farm task is scheduled for today. Please complete it on time.",
      });
    } else if (diffDays <= 2) {
      alerts.push({
        id: `task-soon-${task.id}`,
        type: "info",
        category: "Farm Tasks",
        title: `Task Approaching: ${taskName}`,
        message: `This task is due in ${diffDays} day(s).`,
      });
    }
  });

  // 5. Atmospheric / Humidity Alerts
  if (weather && Number.isFinite(weather.humidity)) {
    if (weather.humidity > 70) {
      alerts.push({
        id: "weather-high-humidity",
        type: "warning",
        category: "Atmospheric",
        title: `Elevated Relative Humidity (${Math.round(weather.humidity)}%)`,
        message: "High moisture levels increase vulnerability to fungal infections and blight. Monitor field canopies.",
      });
    } else if (weather.humidity < 40) {
      alerts.push({
        id: "weather-low-humidity",
        type: "info",
        category: "Atmospheric",
        title: `Low Humidity Conditions (${Math.round(weather.humidity)}%)`,
        message: "Accelerated soil evaporation expected. Ensure sufficient irrigation for active growing crops.",
      });
    }
  }

  // 6. Inputs Inventory Alerts
  inventory.forEach((item) => {
    const qty = Number(item.quantity) || 0;
    const min = Number(item.minimumStock) || 0;
    const itemName = item.name || "Supply item";

    if (qty === 0) {
      alerts.push({
        id: `inventory-out-${item.id}`,
        type: "danger",
        category: "Inputs Inventory",
        title: `Out of Stock: ${itemName}`,
        message: `${itemName} is completely depleted. Reorder supplies immediately.`,
      });
    } else if (qty <= min) {
      alerts.push({
        id: `inventory-low-${item.id}`,
        type: "warning",
        category: "Inputs Inventory",
        title: `Low Stock: ${itemName}`,
        message: `Only ${qty} ${item.unit || "units"} remaining (minimum required: ${min} ${item.unit || "units"}).`,
      });
    }
  });

  return alerts;
}
