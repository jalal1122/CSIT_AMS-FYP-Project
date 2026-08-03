import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchDashboardStats = createAsyncThunk(
  "analytics/fetchDashboardStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/api/v2/analytics/dashboard");
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch dashboard stats");
    }
  }
);

export const fetchV2Reports = createAsyncThunk(
  "analytics/fetchV2Reports",
  async ({ target, timeframe, filters }, { rejectWithValue }) => {
    try {
      // Must send application/json
      const response = await api.post("/api/v2/analytics/generate", {
        target,
        timeframe,
        filters
      });
      return { target, data: response.data.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || `Failed to fetch ${target}`);
    }
  }
);

export const exportV2Report = createAsyncThunk(
  "analytics/exportV2Report",
  async ({ target, timeframe, filters, format = "xlsx" }, { rejectWithValue }) => {
    try {
      const response = await api.post("/api/v2/analytics/export", {
        target,
        timeframe,
        filters,
        format
      }, { responseType: 'blob' });

      const blob = new Blob([response.data]);
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `AttendX_${target}_${timeframe || 'Export'}.${format}`;
      link.click();
      return true;
    } catch (error) {
      return rejectWithValue("Failed to export report");
    }
  }
);

const initialState = {
  dashboardStats: null,
  defaulterMatrix: [],
  teacherUtilization: [],
  atRiskTrajectory: [],
  loading: false,
  error: null,
};

const analyticsSlice = createSlice({
  name: "analytics",
  initialState,
  reducers: {
    clearAnalyticsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Dashboard Stats
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboardStats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // V2 Reports Generate
      .addCase(fetchV2Reports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchV2Reports.fulfilled, (state, action) => {
        state.loading = false;
        const { target, data } = action.payload;
        if (target === "defaulter-matrix") {
          state.defaulterMatrix = data;
        } else if (target === "teacher-utilization") {
          state.teacherUtilization = data;
        } else if (target === "at-risk-trajectory") {
          state.atRiskTrajectory = data;
        }
      })
      .addCase(fetchV2Reports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // V2 Reports Export
      .addCase(exportV2Report.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(exportV2Report.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(exportV2Report.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearAnalyticsError } = analyticsSlice.actions;
export default analyticsSlice.reducer;
