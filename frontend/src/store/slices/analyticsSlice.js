import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchDashboardStats = createAsyncThunk(
  "analytics/fetchDashboardStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/api/v2/analytics/dashboard");
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch stats");
    }
  }
);

export const fetchComprehensiveReport = createAsyncThunk(
  "analytics/fetchComprehensiveReport",
  async (filters, { rejectWithValue }) => {
    try {
      let url = "/api/v2/analytics/comprehensive";
      const params = new URLSearchParams();
      if (filters.groupBy) params.append("groupBy", filters.groupBy);
      if (filters.departmentId) params.append("departmentId", filters.departmentId);
      if (filters.disciplineId) params.append("disciplineId", filters.disciplineId);
      if (filters.batchId) params.append("batchId", filters.batchId);
      if (filters.allocationId) params.append("allocationId", filters.allocationId);
      if (filters.section) params.append("section", filters.section);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      
      const response = await api.get(`${url}?${params.toString()}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch comprehensive report");
    }
  }
);

export const exportAdminReport = createAsyncThunk(
  "analytics/exportAdminReport",
  async ({ reportType, allocationId, sectionName, startDate, endDate, format = "xlsx" }, { rejectWithValue }) => {
    try {
      let url = `/analytics/export/admin?reportType=${reportType}&format=${format}`;
      if (allocationId) url += `&allocationId=${allocationId}`;
      if (sectionName) url += `&sectionName=${sectionName}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;

      const response = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data]);
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `AdminReport_${Date.now()}.${format}`;
      link.click();
      return true;
    } catch (error) {
      return rejectWithValue("Failed to export report");
    }
  }
);

export const exportTeacherReport = createAsyncThunk(
  "analytics/exportTeacherReport",
  async ({ allocationId, sectionName, startDate, endDate, format = "xlsx" }, { rejectWithValue }) => {
    try {
      let url = `/analytics/export/teacher?allocationId=${allocationId}&sectionName=${sectionName}&format=${format}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;

      const response = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data]);
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `TeacherReport_${Date.now()}.${format}`;
      link.click();
      return true;
    } catch (error) {
      return rejectWithValue("Failed to export report");
    }
  }
);

export const exportStudentTranscript = createAsyncThunk(
  "analytics/exportStudentTranscript",
  async ({ startDate, endDate, format = "xlsx" }, { rejectWithValue }) => {
    try {
      let url = `/analytics/export/student?format=${format}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;

      const response = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data]);
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `StudentTranscript_${Date.now()}.${format}`;
      link.click();
      return true;
    } catch (error) {
      return rejectWithValue("Failed to export transcript");
    }
  }
);

const initialState = {
  dashboardStats: null,
  comprehensiveReport: null,
  isLoading: false,
  error: null,
};

const analyticsSlice = createSlice({
  name: "analytics",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dashboardStats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchComprehensiveReport.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchComprehensiveReport.fulfilled, (state, action) => {
        state.isLoading = false;
        state.comprehensiveReport = action.payload;
      })
      .addCase(fetchComprehensiveReport.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export default analyticsSlice.reducer;
