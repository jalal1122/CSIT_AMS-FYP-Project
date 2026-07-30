import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api.js";

const initialState = {
  activeAllocations: [],
  pastClasses: [],
  classDetails: null,
  isLoading: false,
  error: null,
};

export const fetchTeacherDashboard = createAsyncThunk(
  "teacher/fetchDashboard",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/api/v2/academic/teacher/dashboard");
      return res.data.data.activeAllocations;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch teacher dashboard");
    }
  }
);

export const fetchTeacherHistory = createAsyncThunk(
  "teacher/fetchHistory",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/api/v2/academic/teacher/history");
      return res.data.data.pastClasses;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch teacher history");
    }
  }
);

export const fetchClassDetails = createAsyncThunk(
  "teacher/fetchClassDetails",
  async ({ allocationId, sectionName }, { rejectWithValue }) => {
    try {
      const res = await api.get(`/api/v2/academic/teacher/class/${allocationId}/${sectionName}`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch class details");
    }
  }
);

const teacherSlice = createSlice({
  name: "teacher",
  initialState,
  reducers: {
    clearTeacherError: (state) => {
      state.error = null;
    },
    clearClassDetails: (state) => {
      state.classDetails = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Dashboard
      .addCase(fetchTeacherDashboard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTeacherDashboard.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.activeAllocations = payload;
      })
      .addCase(fetchTeacherDashboard.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = payload;
      })
      // History
      .addCase(fetchTeacherHistory.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchTeacherHistory.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.pastClasses = payload;
      })
      .addCase(fetchTeacherHistory.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = payload;
      })
      // Class Details
      .addCase(fetchClassDetails.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchClassDetails.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.classDetails = payload;
      })
      .addCase(fetchClassDetails.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = payload;
      });
  },
});

export const { clearTeacherError, clearClassDetails } = teacherSlice.actions;
export default teacherSlice.reducer;
