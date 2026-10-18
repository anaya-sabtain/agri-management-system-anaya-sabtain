import { describe, it, expect, beforeEach, vi } from "vitest";
import { getFarmAlerts } from "../alertService";
import { STORAGE_KEYS } from "../../data/dataModels";

// Mock storageService so tests can inject custom crops and orders
vi.mock("../storageService", () => {
  let mockStorage = {};
  return {
    getAll: vi.fn((key) => mockStorage[key] || []),
    __setMockStorage: (key, data) => {
      mockStorage[key] = data;
    },
    __clearMockStorage: () => {
      mockStorage = {};
    },
  };
});

import { getAll, __setMockStorage, __clearMockStorage } from "../storageService";

describe("Farm Alert Service (Unit Tests)", () => {
  beforeEach(() => {
    __clearMockStorage();
  });

  it("should trigger Critical Health Alert when crop healthScore is < 60", () => {
    __setMockStorage(STORAGE_KEYS.CROPS, [
      { id: "c1", name: "Sugarcane", field: "Field 1", healthScore: 45, status: "growing" },
      { id: "c2", name: "Wheat", field: "Field 2", healthScore: 88, status: "growing" },
    ]);
    __setMockStorage(STORAGE_KEYS.ORDERS, []);

    const alerts = getFarmAlerts();
    const criticalAlerts = alerts.filter((a) => a.category === "Crop Health");

    expect(criticalAlerts.length).toBe(1);
    expect(criticalAlerts[0].type).toBe("danger");
    expect(criticalAlerts[0].title).toContain("Critical Health Alert: Sugarcane");
    expect(criticalAlerts[0].message).toContain("45%");
  });

  it("should trigger Harvest Overdue/Ready Alert for crops due today or overdue", () => {
    const today = new Date();
    const todayString = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("-");

    __setMockStorage(STORAGE_KEYS.CROPS, [
      {
        id: "c-due",
        name: "Rice",
        field: "East Basin",
        cuttingDate: todayString,
        status: "ready",
        healthScore: 85,
      },
    ]);
    __setMockStorage(STORAGE_KEYS.ORDERS, []);

    const alerts = getFarmAlerts();
    const harvestAlerts = alerts.filter((a) => a.category === "Harvest Operations");

    expect(harvestAlerts.length).toBeGreaterThanOrEqual(1);
    expect(harvestAlerts[0].title).toContain("Harvest Ready/Overdue: Rice");
  });

  it("should trigger Low Stock Alert when available stock is below 200 kg", () => {
    __setMockStorage(STORAGE_KEYS.CROPS, [
      {
        id: "c-stock",
        name: "Cotton",
        harvestedQuantityKg: 500,
        expectedQuantityKg: 600,
        healthScore: 80,
      },
    ]);
    // 400 kg committed out of 500 kg harvested = 100 kg remaining (low stock!)
    __setMockStorage(STORAGE_KEYS.ORDERS, [
      { id: "o1", cropId: "c-stock", quantityKg: 400, status: "pending" },
    ]);

    const alerts = getFarmAlerts();
    const stockAlerts = alerts.filter((a) => a.category === "Inventory");

    expect(stockAlerts.length).toBe(1);
    expect(stockAlerts[0].title).toContain("Low Warehouse Stock: Cotton");
    expect(stockAlerts[0].message).toContain("100 kg");
  });

  it("should trigger Atmospheric Elevated Humidity Alert when humidity > 70%", () => {
    __setMockStorage(STORAGE_KEYS.CROPS, []);
    __setMockStorage(STORAGE_KEYS.ORDERS, []);

    const mockWeather = {
      humidity: 82,
      temperatureC: 28,
    };

    const alerts = getFarmAlerts(mockWeather);
    const humidityAlerts = alerts.filter((a) => a.category === "Atmospheric");

    expect(humidityAlerts.length).toBe(1);
    expect(humidityAlerts[0].type).toBe("warning");
    expect(humidityAlerts[0].title).toContain("Elevated Relative Humidity (82%)");
  });

  it("should trigger Atmospheric Low Humidity Alert when humidity < 40%", () => {
    __setMockStorage(STORAGE_KEYS.CROPS, []);
    __setMockStorage(STORAGE_KEYS.ORDERS, []);

    const mockWeather = {
      humidity: 32,
      temperatureC: 34,
    };

    const alerts = getFarmAlerts(mockWeather);
    const humidityAlerts = alerts.filter((a) => a.category === "Atmospheric");

    expect(humidityAlerts.length).toBe(1);
    expect(humidityAlerts[0].title).toContain("Low Humidity Conditions (32%)");
  });
});
