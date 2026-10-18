/**
 * AgriSense data models
 * Step 5.1: Define consistent record structures.
 * This file does not read or write localStorage yet.
 */

export const STORAGE_KEYS = {
  CROPS: "agri_crops",
  ORDERS: "agri_orders",
  BUYERS: "agri_buyers",
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
