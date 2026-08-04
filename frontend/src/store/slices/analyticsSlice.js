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
  examEligibility: [],
  interDisciplineBenchmark: [],
  medicalLeaveLedger: [],
  repeaterTracking: [],
  studentOnboardingStatus: [],
  geofenceDrift: [],
  deviceBindingAudit: [],
  systemUsagePeaks: [],
  timeOfDayAbsenteeism: [],
  reportData: null,
  isReportLoading: false,
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
        state.isReportLoading = true;
        state.error = null;
      })
      .addCase(fetchV2Reports.fulfilled, (state, action) => {
        state.loading = false;
        state.isReportLoading = false;
        const { target, data } = action.payload;
        if (target === "defaulter-matrix") {
          state.defaulterMatrix = data;
        } else if (target === "teacher-utilization") {
          state.teacherUtilization = data;
        } else if (target === "at-risk-trajectory") {
          state.atRiskTrajectory = data;
        } else if (target === "exam-eligibility") {
          state.examEligibility = data;
        } else if (target === "inter-discipline-benchmark") {
          state.interDisciplineBenchmark = data;
        } else if (target === "medical-leave-ledger") {
          state.medicalLeaveLedger = data;
        } else if (target === "repeater-tracking") {
          state.repeaterTracking = data;
        } else if (target === "student-onboarding-status") {
          state.studentOnboardingStatus = data;
        } else if (target === "geofence-drift") {
          state.geofenceDrift = data;
        } else if (target === "device-binding-audit") {
          state.deviceBindingAudit = data;
        } else if (target === "system-usage-peaks") {
          state.systemUsagePeaks = data;
        } else if (target === "time-of-day-absenteeism") {
          state.timeOfDayAbsenteeism = data;
        } else if (target === "universal") {
          state.reportData = data[0];
        }
      })
      .addCase(fetchV2Reports.rejected, (state, action) => {
        state.loading = false;
        state.isReportLoading = false;
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
