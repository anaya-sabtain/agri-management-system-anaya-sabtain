import { createSlice, nanoid, createSelector } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  loading: false,
  error: null,
};

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {
    attendanceAdded: {
      reducer(state, action) {
        const record = action.payload;

        const alreadyExists = state.items.some(
          (item) =>
            item.workerId === record.workerId &&
            item.date === record.date
        );

        if (alreadyExists) {
          state.error =
            'Attendance for this worker and date already exists.';
          return;
        }

        state.items.push(record);
        state.error = null;
      },

      prepare(data) {
        return {
          payload: {
            id: nanoid(),
            workerId: data.workerId,
            date: data.date,
            status: data.status,
            hoursWorked: Number(data.hoursWorked ?? 0),
            notes: (data.notes ?? '').trim(),
            createdAt: new Date().toISOString(),
          },
        };
      },
    },

    attendanceUpdated(state, action) {
      const { id, changes } = action.payload;
      const record = state.items.find((item) => item.id === id);

      if (!record) return;

      Object.assign(record, changes);
      record.hoursWorked = Number(record.hoursWorked ?? 0);
      state.error = null;
    },

    attendanceDeleted(state, action) {
      state.items = state.items.filter(
        (item) => item.id !== action.payload
      );
      state.error = null;
    },

    attendanceLoaded(state, action) {
      state.items = Array.isArray(action.payload)
        ? action.payload
        : [];
      state.loading = false;
      state.error = null;
    },

    attendanceErrorCleared(state) {
      state.error = null;
    },
  },
});

export const {
  attendanceAdded,
  attendanceUpdated,
  attendanceDeleted,
  attendanceLoaded,
  attendanceErrorCleared,
} = attendanceSlice.actions;

export const selectAllAttendance = (state) =>
  state.attendance.items;

export const selectAttendanceError = (state) =>
  state.attendance.error;

export const selectAttendanceLoading = (state) =>
  state.attendance.loading;

export const selectAttendanceByWorker = createSelector(
  [selectAllAttendance, (_, workerId) => workerId],
  (items, workerId) =>
    items.filter((item) => item.workerId === workerId)
);

export default attendanceSlice.reducer;
