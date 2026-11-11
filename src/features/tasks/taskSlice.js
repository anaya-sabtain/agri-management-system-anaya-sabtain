import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchTasks = createAsyncThunk(
  "tasks/fetchTasks",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/tasks");
      if (!response.data.succeeded) {
        return rejectWithValue(response.data.message);
      }
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch tasks."
      );
    }
  }
);

const taskSlice = createSlice({
  name: "tasks",
  initialState: { tasks: [], loading: false, error: null },
  reducers: {
    clearTaskError: (state) => {
      state.error = null;
    },
    taskAdded: (state, action) => {
      state.tasks.push(action.payload);
    },
    taskUpdated: (state, action) => {
      const { id, changes } = action.payload;
      const index = state.tasks.findIndex((t) => t.id === id);
      if (index !== -1) {
        state.tasks[index] = { ...state.tasks[index], ...changes };
      }
    },
    taskDeleted: (state, action) => {
      state.tasks = state.tasks.filter((t) => t.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearTaskError, taskAdded, taskUpdated, taskDeleted } = taskSlice.actions;
export default taskSlice.reducer;
