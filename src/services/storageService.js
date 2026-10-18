import { STORAGE_KEYS } from "../data/dataModels";

// Only allow the three collections used by AgriSense.
const allowedKeys = Object.values(STORAGE_KEYS);

function validateKey(key) {
  if (!allowedKeys.includes(key)) {
    throw new Error(`Unsupported storage key: ${key}`);
  }
}

function readCollection(key) {
  validateKey(key);

  const rawData = localStorage.getItem(key);

  if (rawData === null) {
    return [];
  }

  let records;

  try {
    records = JSON.parse(rawData);
  } catch {
    throw new Error(
      `Invalid JSON in "${key}". Existing data was not overwritten.`
    );
  }

  if (!Array.isArray(records)) {
    throw new Error(
      `Stored data for "${key}" must be an array.`
    );
  }

  return records;
}

// READ: Get all records.
export function getAll(key) {
  return readCollection(key);
}

// CREATE: Add a new record.
export function createRecord(key, record) {
  const records = readCollection(key);

  if (!record?.id) {
    throw new Error("A record must have a unique ID.");
  }

  if (records.some((item) => item.id === record.id)) {
    throw new Error(`Record ID already exists: ${record.id}`);
  }

  const updatedRecords = [...records, record];

  localStorage.setItem(key, JSON.stringify(updatedRecords));

  return record;
}

// UPDATE: Replace an existing record by ID.
export function updateRecord(key, id, updates) {
  const records = readCollection(key);
  const index = records.findIndex((item) => item.id === id);

  if (index === -1) {
    throw new Error(`Record not found: ${id}`);
  }

  // Keep the original ID and merge the new fields.
  const updatedRecord = {
    ...records[index],
    ...updates,
    id: records[index].id,
  };

  const updatedRecords = records.map((item, i) =>
    i === index ? updatedRecord : item
  );

  localStorage.setItem(key, JSON.stringify(updatedRecords));

  return updatedRecord;
}

// DELETE: Remove a record by ID.
export function deleteRecord(key, id) {
  const records = readCollection(key);
  const exists = records.some((item) => item.id === id);

  if (!exists) {
    throw new Error(`Record not found: ${id}`);
  }

  const updatedRecords = records.filter((item) => item.id !== id);

  localStorage.setItem(key, JSON.stringify(updatedRecords));

  return true;
}
