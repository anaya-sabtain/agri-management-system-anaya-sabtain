import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../services/api";

// Fetch all orders
export const fetchOrders = createAsyncThunk(
  "orders/fetchOrders",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/orders");

      if (!response.data.succeeded) {
        return rejectWithValue(
          response.data.message || "Unable to fetch orders."
        );
      }

      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch orders."
      );
    }
  }
);

const orderSlice = createSlice({
  name: "orders",

  initialState: {
    orders: [],
    loading: false,
    error: null,
  },

  reducers: {
    clearOrderError: (state) => {
      state.error = null;
    },
    ordersLoaded: (state, action) => {
      state.orders = action.payload;
    },
    orderAdded: (state, action) => {
      state.orders.push(action.payload);
    },
    orderUpdated: (state, action) => {
      const { id, changes } = action.payload;
      const index = state.orders.findIndex((order) => order.id === id);
      if (index !== -1) {
        state.orders[index] = { ...state.orders[index], ...changes };
      }
    },
    orderDeleted: (state, action) => {
      state.orders = state.orders.filter((order) => order.id !== action.payload);
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })

      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearOrderError,
  ordersLoaded,
  orderAdded,
  orderUpdated,
  orderDeleted,
} = orderSlice.actions;

export const selectAllOrders = (state) => state.orders?.orders || [];

export default orderSlice.reducer;
