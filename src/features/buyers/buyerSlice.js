import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchBuyers = createAsyncThunk(
  "buyers/fetchBuyers",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/buyers");

      if (!response.data.succeeded) {
        return rejectWithValue(response.data.message || "Unable to fetch buyers.");
      }

      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch buyers."
      );
    }
  }
);

const buyerSlice = createSlice({
  name: "buyers",

  initialState: {
    buyers: [],
    loading: false,
    error: null,
  },

  reducers: {
    clearBuyerError: (state) => {
      state.error = null;
    },
    buyersLoaded: (state, action) => {
      state.buyers = action.payload;
    },
    buyerAdded: (state, action) => {
      state.buyers.push(action.payload);
    },
    buyerUpdated: (state, action) => {
      const { id, changes } = action.payload;
      const index = state.buyers.findIndex((buyer) => buyer.id === id);
      if (index !== -1) {
        state.buyers[index] = { ...state.buyers[index], ...changes };
      }
    },
    buyerDeleted: (state, action) => {
      state.buyers = state.buyers.filter((buyer) => buyer.id !== action.payload);
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchBuyers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBuyers.fulfilled, (state, action) => {
        state.loading = false;
        state.buyers = action.payload;
      })
      .addCase(fetchBuyers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearBuyerError,
  buyersLoaded,
  buyerAdded,
  buyerUpdated,
  buyerDeleted,
} = buyerSlice.actions;

export const selectAllBuyers = (state) => state.buyers?.buyers || [];

export default buyerSlice.reducer;
