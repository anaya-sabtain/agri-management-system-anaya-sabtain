import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchInventory = createAsyncThunk(
  "inventory/fetchInventory",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/inventory");
      if (!response.data.succeeded) {
        return rejectWithValue(response.data.message);
      }
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch inventory."
      );
    }
  }
);

const inventorySlice = createSlice({
  name: "inventory",
  initialState: { items: [], loading: false, error: null },
  reducers: {
    clearInventoryError: (state) => {
      state.error = null;
    },
    inventoryAdded: (state, action) => {
      state.items.push(action.payload);
    },
    inventoryUpdated: (state, action) => {
      const { id, changes } = action.payload;
      const index = state.items.findIndex((i) => i.id === id);
      if (index !== -1) {
        state.items[index] = { ...state.items[index], ...changes };
      }
    },
    inventoryDeleted: (state, action) => {
      state.items = state.items.filter((i) => i.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInventory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInventory.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchInventory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearInventoryError, inventoryAdded, inventoryUpdated, inventoryDeleted } = inventorySlice.actions;
export default inventorySlice.reducer;
