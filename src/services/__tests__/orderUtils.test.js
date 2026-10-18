import { describe, it, expect } from "vitest";
import { getAvailableStock } from "../orderUtils";

describe("Order & Stock Utils (Unit Tests)", () => {
  it("should calculate correct available stock when pending and completed orders exist", () => {
    const crop = { id: "c1", harvestedQuantityKg: 1000 };
    const orders = [
      { id: "o1", cropId: "c1", quantityKg: 300, status: "pending" },
      { id: "o2", cropId: "c1", quantityKg: 200, status: "completed" },
      { id: "o3", cropId: "c1", quantityKg: 500, status: "cancelled" }, // cancelled should not deduct stock
    ];

    const available = getAvailableStock(crop, orders);
    expect(available).toBe(500); // 1000 - 300 - 200 = 500
  });

  it("should return 0 when committed orders exceed harvested stock (no negative inventory)", () => {
    const crop = { id: "c1", harvestedQuantityKg: 300 };
    const orders = [
      { id: "o1", cropId: "c1", quantityKg: 500, status: "pending" },
    ];

    const available = getAvailableStock(crop, orders);
    expect(available).toBe(0);
  });

  it("should properly exclude order when updating existing order", () => {
    const crop = { id: "c1", harvestedQuantityKg: 1000 };
    const orders = [
      { id: "o1", cropId: "c1", quantityKg: 400, status: "pending" },
      { id: "o2", cropId: "c1", quantityKg: 200, status: "pending" },
    ];

    // Exclude o1 because it is currently being edited
    const available = getAvailableStock(crop, orders, "o1");
    expect(available).toBe(800); // 1000 - 200 = 800
  });
});
