/**
 * AgriSense data models
 * Step 5.1: Define consistent record structures.
 * This file does not read or write localStorage yet.
 */

export const STORAGE_KEYS = {
  CROPS: "agri_crops",
  ORDERS: "agri_orders",
  BUYERS: "agri_buyers",
  TASKS: "agri_tasks",
  EXPENSES: "agri_expenses",
  INVENTORY: "agri_inventory",
  ACTIVITY: "agri_activity",
};

export const createCrop = ({
  name,
  field,
  plantingDate,
  cuttingDate,
  expectedQuantityKg,
  harvestedQuantityKg = 0,
  healthScore = 0,
  status = "growing",
}) => ({
  id: crypto.randomUUID(),
  name,
  field,
  plantingDate,
  cuttingDate,
  expectedQuantityKg: Number(expectedQuantityKg),
  harvestedQuantityKg: Number(harvestedQuantityKg),
  healthScore: Number(healthScore),
  status,
});

export const createBuyer = ({
  fullName,
  cnic,
  photoDataUrl = null,
}) => ({
  id: crypto.randomUUID(),
  fullName,
  cnic,
  photoDataUrl,
  createdAt: new Date().toISOString(),
});

export const createOrder = ({
  buyerId,
  cropId,
  quantityKg,
  saleDate,
  status = "pending",
}) => ({
  id: crypto.randomUUID(),
  buyerId,
  cropId,
  quantityKg: Number(quantityKg),
  saleDate,
  status,
  createdAt: new Date().toISOString(),
});

export const createExpense = ({
  title,
  category,
  amount,
  date,
  cropId = null,
  notes = "",
}) => ({
  id: crypto.randomUUID(),
  title: title.trim(),
  category,
  amount: Number(amount),
  date,
  cropId,
  notes: notes.trim(),
  createdAt: new Date().toISOString(),
});

export const createInventoryItem = ({
  name,
  category,
  quantity,
  unit,
  minimumStock,
  purchasePrice,
  purchaseDate,
  supplier = "",
  notes = "",
}) => ({
  id: crypto.randomUUID(),
  name: name.trim(),
  category,
  quantity: Number(quantity),
  unit,
  minimumStock: Number(minimumStock),
  purchasePrice: Number(purchasePrice),
  purchaseDate,
  supplier: supplier.trim(),
  notes: notes.trim(),
  createdAt: new Date().toISOString(),
});
