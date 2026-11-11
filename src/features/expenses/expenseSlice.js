import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchExpenses = createAsyncThunk(
  "expenses/fetchExpenses",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/expenses");
      if (!response.data.succeeded) {
        return rejectWithValue(response.data.message);
      }
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch expenses."
      );
    }
  }
);

const expenseSlice = createSlice({
  name: "expenses",
  initialState: { expenses: [], loading: false, error: null },
  reducers: {
    clearExpenseError: (state) => {
      state.error = null;
    },
    expenseAdded: (state, action) => {
      state.expenses.push(action.payload);
    },
    expenseUpdated: (state, action) => {
      const { id, changes } = action.payload;
      const index = state.expenses.findIndex((e) => e.id === id);
      if (index !== -1) {
        state.expenses[index] = { ...state.expenses[index], ...changes };
      }
    },
    expenseDeleted: (state, action) => {
      state.expenses = state.expenses.filter((e) => e.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExpenses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.loading = false;
        state.expenses = action.payload;
      })
      .addCase(fetchExpenses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearExpenseError, expenseAdded, expenseUpdated, expenseDeleted } = expenseSlice.actions;
export default expenseSlice.reducer;
