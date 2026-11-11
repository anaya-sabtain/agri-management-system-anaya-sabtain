import { createAsyncThunk, createSlice, nanoid } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchActivities = createAsyncThunk(
  "activities/fetchActivities",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/activities");

      if (!response.data.succeeded) {
        return rejectWithValue(
          response.data.message || "Unable to fetch activities."
        );
      }

      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch activities."
      );
    }
  }
);

const activitySlice = createSlice({
  name: "activities",

  initialState: {
    activities: [],
    loading: false,
    error: null,
  },

  reducers: {
    clearActivityError: (state) => {
      state.error = null;
    },
    activityAdded: {
      reducer(state, action) {
        state.activities.unshift(action.payload);
        state.activities = state.activities.slice(0, 500);
      },
      prepare({
        action,
        entity,
        entityId = null,
        description,
        user = "Current User",
      }) {
        return {
          payload: {
            id: nanoid(),
            action,
            entity,
            entityId,
            description,
            user,
            timestamp: new Date().toISOString(),
          },
        };
      },
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchActivities.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActivities.fulfilled, (state, action) => {
        state.loading = false;
        state.activities = action.payload;
      })
      .addCase(fetchActivities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearActivityError, activityAdded } = activitySlice.actions;

export default activitySlice.reducer;
