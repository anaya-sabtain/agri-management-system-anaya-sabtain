import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../services/api";

const createFetchThunk = (name, endpoint) =>
  createAsyncThunk(
    `farmOperations/${name}`,
    async (_, { rejectWithValue }) => {
      try {
        const response = await api.get(endpoint);

        if (!response.data.succeeded) {
          return rejectWithValue(
            response.data.message || `Failed to fetch ${name}.`
          );
        }

        return response.data.data;
      } catch (error) {
        return rejectWithValue(
          error.response?.data?.message || `Failed to fetch ${name}.`
        );
      }
    }
  );

export const fetchWorkers = createFetchThunk("fetchWorkers", "/workers");
export const fetchAttendance = createFetchThunk(
  "fetchAttendance",
  "/attendance"
);
export const fetchEquipment = createFetchThunk(
  "fetchEquipment",
  "/equipment"
);
export const fetchMaintenance = createFetchThunk(
  "fetchMaintenance",
  "/maintenance"
);

const initialState = {
  workers: [],
  attendance: [],
  equipment: [],
  maintenance: [],
  loading: {
    workers: false,
    attendance: false,
    equipment: false,
    maintenance: false,
  },
  error: {
    workers: null,
    attendance: null,
    equipment: null,
    maintenance: null,
  },
};

const farmOperationsSlice = createSlice({
  name: "farmOperations",
  initialState,
  reducers: {
    clearFarmOperationErrors: (state) => {
      Object.keys(state.error).forEach((key) => {
        state.error[key] = null;
      });
    },
  },
  extraReducers: (builder) => {
    const operations = [
      { thunk: fetchWorkers, key: "workers" },
      { thunk: fetchAttendance, key: "attendance" },
      { thunk: fetchEquipment, key: "equipment" },
      { thunk: fetchMaintenance, key: "maintenance" },
    ];

    operations.forEach(({ thunk, key }) => {
      builder
        .addCase(thunk.pending, (state) => {
          state.loading[key] = true;
          state.error[key] = null;
        })
        .addCase(thunk.fulfilled, (state, action) => {
          state.loading[key] = false;
          state[key] = action.payload;
        })
        .addCase(thunk.rejected, (state, action) => {
          state.loading[key] = false;
          state.error[key] = action.payload;
        });
    });
  },
});

export const { clearFarmOperationErrors } =
  farmOperationsSlice.actions;

export default farmOperationsSlice.reducer;
