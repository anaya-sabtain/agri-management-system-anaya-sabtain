export function getAvailableStock(crop, orders, excludeOrderId = null) {
  const harvested = Number(crop?.harvestedQuantityKg ?? 0);

  const committedQuantity = orders
    .filter(
      (order) =>
        order.cropId === crop.id &&
        order.id !== excludeOrderId &&
        ["pending", "completed"].includes(order.status)
    )
    .reduce(
      (total, order) => total + Number(order.quantityKg || 0),
      0
    );

  return Math.max(0, harvested - committedQuantity);
}
