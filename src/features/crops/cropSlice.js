import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../services/api";

// Fetch all crops from backend
export const fetchCrops = createAsyncThunk(
  "crops/fetchCrops",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/crops");

      if (!response.data.succeeded) {
        return rejectWithValue(
          response.data.message || "Unable to fetch crops."
        );
      }

      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch crops."
      );
    }
  }
);

const cropSlice = createSlice({
  name: "crops",

  initialState: {
    crops: [],
    loading: false,
    error: null,
  },

  reducers: {
    clearCropError: (state) => {
      state.error = null;
    },
    cropsLoaded: (state, action) => {
      state.crops = action.payload;
    },
    cropAdded: (state, action) => {
      state.crops.push(action.payload);
    },
    cropUpdated: (state, action) => {
      const { id, changes } = action.payload;
      const index = state.crops.findIndex((crop) => crop.id === id);
      if (index !== -1) {
        state.crops[index] = { ...state.crops[index], ...changes };
      }
    },
    cropDeleted: (state, action) => {
      state.crops = state.crops.filter((crop) => crop.id !== action.payload);
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchCrops.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchCrops.fulfilled, (state, action) => {
        state.loading = false;
        state.crops = action.payload;
      })

      .addCase(fetchCrops.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearCropError,
  cropsLoaded,
  cropAdded,
  cropUpdated,
  cropDeleted,
} = cropSlice.actions;

export const selectAllCrops = (state) => state.crops?.crops || [];

export default cropSlice.reducer;
