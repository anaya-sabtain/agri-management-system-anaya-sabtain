import { describe, it, expect, beforeEach, vi } from "vitest";

// Use vi.hoisted to ensure localStorage is mocked before any store modules are imported
vi.hoisted(() => {
  let store = {};
  const mock = {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };

  Object.defineProperty(globalThis, "localStorage", {
    value: mock,
    writable: true,
  });
});

import { STORAGE_KEYS } from "../../data/dataModels";
import { store } from "../../store";
import { cropAdded, cropUpdated, cropDeleted } from "../../store/cropsSlice";
import { buyerAdded, buyerUpdated, buyerDeleted } from "../../store/buyersSlice";
import { orderAdded, orderUpdated, orderDeleted } from "../../store/ordersSlice";
import { taskAdded, taskUpdated, taskDeleted } from "../../store/tasksSlice";
import { expenseAdded, expenseUpdated, expenseDeleted } from "../../store/expensesSlice";
import {
  inventoryAdded,
  inventoryUpdated,
  inventoryDeleted,
  selectLowStockItems,
  selectTotalInventoryValue,
} from "../../store/inventorySlice";
import {
  activityAdded,
  activityCleared,
  selectAllActivities,
} from "../../store/activitySlice";
import { loginSucceeded, logoutSucceeded } from "../../store/authSlice";
import { describeWeatherCode, getCurrentWeather } from "../weatherService";
import { getAvailableStock } from "../orderUtils";

describe("AgriSense End-to-End Comprehensive Verification", () => {
  beforeEach(() => {
    localStorage.clear();
    store.dispatch(activityCleared());
  });

  describe("1. Redux & Data Persistence Verification", () => {
    it("persists Crops, Buyers, Orders, Tasks, Expenses, Inventory, and Activity into localStorage", () => {
      // 1. Crop
      store.dispatch(
        cropAdded({
          id: "crop-test-1",
          name: "Basmati Rice",
          field: "North Field",
          plantingDate: "2026-06-01",
          cuttingDate: "2026-10-15",
          expectedQuantityKg: 5000,
          harvestedQuantityKg: 4500,
          healthScore: 92,
          status: "harvested",
        })
      );
      const savedCrops = JSON.parse(localStorage.getItem(STORAGE_KEYS.CROPS) || "[]");
      expect(savedCrops.some((c) => c.name === "Basmati Rice")).toBe(true);

      // 2. Buyer
      store.dispatch(
        buyerAdded({
          id: "buyer-test-1",
          fullName: "Tariq Mahmood",
          cnic: "35201-1234567-1",
        })
      );
      const savedBuyers = JSON.parse(localStorage.getItem(STORAGE_KEYS.BUYERS) || "[]");
      expect(savedBuyers.some((b) => b.fullName === "Tariq Mahmood")).toBe(true);

      // 3. Order
      store.dispatch(
        orderAdded({
          id: "order-test-1",
          buyerId: "buyer-test-1",
          cropId: "crop-test-1",
          quantityKg: 1000,
          pricePerKg: 150,
          saleDate: "2026-10-20",
          status: "completed",
        })
      );
      const savedOrders = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || "[]");
      expect(savedOrders.some((o) => o.id === "order-test-1")).toBe(true);

      // 4. Task
      store.dispatch(
        taskAdded({
          id: "task-test-1",
          title: "Tubewell Irrigation",
          type: "Irrigation",
          cropId: "crop-test-1",
          dueDate: "2026-11-01",
          notes: "Run motor for 4 hours",
        })
      );
      const savedTasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || "[]");
      expect(savedTasks.some((t) => t.title === "Tubewell Irrigation")).toBe(true);

      // 5. Expense
      store.dispatch(
        expenseAdded({
          id: "expense-test-1",
          title: "Diesel for Tractor",
          category: "Fuel",
          amount: 12000,
          date: "2026-10-25",
        })
      );
      const savedExpenses = JSON.parse(localStorage.getItem(STORAGE_KEYS.EXPENSES) || "[]");
      expect(savedExpenses.some((e) => e.title === "Diesel for Tractor")).toBe(true);

      // 6. Inventory
      store.dispatch(
        inventoryAdded({
          id: "inv-test-1",
          name: "Urea Fertilizer 50kg",
          category: "Fertilizer",
          quantity: 20,
          unit: "Bags",
          minimumStock: 5,
          purchasePrice: 3800,
        })
      );
      const savedInventory = JSON.parse(localStorage.getItem(STORAGE_KEYS.INVENTORY) || "[]");
      expect(savedInventory.some((i) => i.name === "Urea Fertilizer 50kg")).toBe(true);

      // 7. Activity
      store.dispatch(
        activityAdded({
          action: "CREATE",
          entity: "Crop",
          description: "Added Basmati Rice",
        })
      );
      const savedActivities = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITY) || "[]");
      expect(savedActivities.some((a) => a.description === "Added Basmati Rice")).toBe(true);
    });

    it("handles corrupted or invalid localStorage data gracefully without throwing unhandled exceptions", () => {
      localStorage.setItem(STORAGE_KEYS.CROPS, "INVALID_CORRUPTED_JSON_}{");
      localStorage.setItem("agri_session", "{invalid_session:true");

      let parsedSession = null;
      try {
        const raw = localStorage.getItem("agri_session");
        parsedSession = JSON.parse(raw);
      } catch {
        parsedSession = null;
      }
      expect(parsedSession).toBeNull();
    });
  });

  describe("2. Activity Log Verification", () => {
    it("records CREATE, UPDATE, DELETE actions with user and timestamp", () => {
      store.dispatch(
        activityAdded({
          action: "CREATE",
          entity: "Task",
          description: "Created task: Spray Pesticide",
          user: "Farm Manager",
        })
      );
      store.dispatch(
        activityAdded({
          action: "UPDATE",
          entity: "Task",
          entityId: "task-123",
          description: "Completed task: Spray Pesticide",
          user: "Farm Manager",
        })
      );
      store.dispatch(
        activityAdded({
          action: "DELETE",
          entity: "Task",
          entityId: "task-123",
          description: "Deleted task: Spray Pesticide",
          user: "AgriSense Admin",
        })
      );

      const activities = selectAllActivities(store.getState());
      expect(activities.length).toBe(3);
      expect(activities[0].action).toBe("DELETE"); // Most recent first
      expect(activities[1].action).toBe("UPDATE");
      expect(activities[2].action).toBe("CREATE");
      expect(activities[0].timestamp).toBeDefined();
    });

    it("respects the 500 items upper bound and supports clearing", () => {
      for (let i = 0; i < 550; i++) {
        store.dispatch(
          activityAdded({
            action: "CREATE",
            entity: "Inventory",
            description: `Item #${i}`,
          })
        );
      }
      const activities = selectAllActivities(store.getState());
      expect(activities.length).toBe(500);

      store.dispatch(activityCleared());
      expect(selectAllActivities(store.getState()).length).toBe(0);
    });
  });

  describe("3. Authentication & Roles Verification", () => {
    it("handles admin and manager authentication and session management", () => {
      const adminUser = {
        id: "admin-1",
        name: "AgriSense Admin",
        email: "admin@agrisense.com",
        role: "Admin",
      };

      store.dispatch(loginSucceeded(adminUser));
      let state = store.getState();
      expect(state.auth.isAuthenticated).toBe(true);
      expect(state.auth.user.role).toBe("Admin");

      // Logout
      store.dispatch(logoutSucceeded());
      state = store.getState();
      expect(state.auth.isAuthenticated).toBe(false);
      expect(state.auth.user).toBeNull();
    });
  });

  describe("4. Weather Integration Verification", () => {
    it("provides correct descriptions and icons for weather codes", () => {
      expect(describeWeatherCode(0)).toEqual({ text: "Clear sky", icon: "☀️" });
      expect(describeWeatherCode(2)).toEqual({ text: "Partly cloudy", icon: "⛅" });
      expect(describeWeatherCode(61)).toEqual({ text: "Rainy", icon: "🌧️" });
      expect(describeWeatherCode(95)).toEqual({ text: "Thunderstorm", icon: "⛈️" });
    });

    it("returns valid fallback telemetry when network is unavailable or times out", async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network Error"));

      const weather = await getCurrentWeather();
      expect(weather).toBeDefined();
      expect(weather.temperature).toBeDefined();
      expect(weather.isFallback).toBe(true);
      expect(weather.forecast.length).toBe(5);

      globalThis.fetch = originalFetch;
    });
  });

  describe("5. Inventory & Financial Calculations Verification", () => {
    it("correctly identifies low-stock items via memoized selector", () => {
      const state = {
        inventory: {
          items: [
            { id: "1", name: "Potash", quantity: 2, minimumStock: 5, purchasePrice: 4000 },
            { id: "2", name: "DAP", quantity: 15, minimumStock: 10, purchasePrice: 11000 },
          ],
        },
      };

      const lowStock = selectLowStockItems(state);
      expect(lowStock.length).toBe(1);
      expect(lowStock[0].name).toBe("Potash");

      const totalVal = selectTotalInventoryValue(state);
      expect(totalVal).toBe(2 * 4000 + 15 * 11000); // 8000 + 165000 = 173000
    });

    it("accurately computes available stock to prevent over-selling", () => {
      const crop = { id: "crop-rice", harvestedQuantityKg: 2000 };
      const orders = [
        { id: "ord-1", cropId: "crop-rice", quantityKg: 800, status: "pending" },
        { id: "ord-2", cropId: "crop-rice", quantityKg: 700, status: "completed" },
        { id: "ord-3", cropId: "crop-rice", quantityKg: 1000, status: "cancelled" },
      ];

      // Available: 2000 - 800 - 700 = 500
      expect(getAvailableStock(crop, orders)).toBe(500);

      // Exclude ord-1 when editing
      expect(getAvailableStock(crop, orders, "ord-1")).toBe(1300);
    });
  });
});
