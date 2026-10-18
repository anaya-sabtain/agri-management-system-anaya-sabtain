import { STORAGE_KEYS } from "../data/dataModels";
import { getAll } from "./storageService";

export function getDashboardStats() {
  const crops = getAll(STORAGE_KEYS.CROPS);
  const orders = getAll(STORAGE_KEYS.ORDERS);

  const activeCrops = crops.filter((crop) =>
    ["growing", "ready"].includes(crop.status)
  );

  const activeFields = new Set(
    activeCrops
      .map((crop) => crop.field?.trim().toLowerCase())
      .filter(Boolean)
  );

  const expectedHarvestKg = crops.reduce((total, crop) => {
    const quantity = Number(crop.expectedQuantityKg);

    return total + (
      Number.isFinite(quantity) && quantity > 0 ? quantity : 0
    );
  }, 0);

  const pendingOrders = orders.filter(
    (order) => order.status === "pending"
  );

  return {
    totalCrops: crops.length,
    activeFields: activeFields.size,
    expectedHarvestKg,
    pendingOrders: pendingOrders.length,
  };
}
