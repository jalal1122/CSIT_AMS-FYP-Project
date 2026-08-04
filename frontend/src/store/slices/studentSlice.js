import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api.js";

const initialState = {
  students: [],
  batchSections: [],
  dashboardData: null,
  historyData: null,
  isLoading: false,
  error: null,
};

export const fetchStudents = createAsyncThunk("student/fetchStudents", async (filters = {}, { rejectWithValue }) => {
  try {
    const params = new URLSearchParams();
    params.append("role", "student");
    if (filters.batchId) params.append("batchId", filters.batchId);
    if (filters.section) params.append("section", filters.section);
    if (filters.accountStatus) params.append("accountStatus", filters.accountStatus);
    if (filters.deviceStatus) params.append("deviceStatus", filters.deviceStatus);
    
    const res = await api.get(`/api/v2/admin/users?${params.toString()}`);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to fetch students");
  }
});

export const resetStudentPassword = createAsyncThunk("student/resetStudentPassword", async (id, { rejectWithValue }) => {
  try {
    const res = await api.patch(`/api/v2/admin/users/${id}/reset-password`);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to reset password");
  }
});

export const resetStudentDevice = createAsyncThunk("student/resetStudentDevice", async (id, { rejectWithValue }) => {
  try {
    const res = await api.patch(`/api/v2/admin/users/${id}/reset-device`);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to reset device");
  }
});

export const transferStudent = createAsyncThunk("student/transferStudent", async ({ id, newSection }, { rejectWithValue }) => {
  try {
    const res = await api.post(`/api/v2/academic/student/${id}/transfer`, { newSection });
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to transfer student");
  }
});

export const updateStudentStatus = createAsyncThunk("student/updateStudentStatus", async ({ id, status }, { rejectWithValue }) => {
  try {
    const res = await api.patch(`/api/v2/admin/users/${id}/status`, { accountStatus: status });
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to update status");
  }
});

export const fetchStudentDashboard = createAsyncThunk("student/fetchDashboard", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get("/api/v2/academic/student/dashboard");
    return res.data.data.currentSubjects;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to fetch student dashboard");
  }
});

export const fetchStudentHistory = createAsyncThunk("student/fetchHistory", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get("/api/v2/academic/student/history");
    return res.data.data.pastSemesters;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to fetch student history");
  }
});

export const fetchBatchSections = createAsyncThunk("student/fetchBatchSections", async (batchId, { rejectWithValue }) => {
  try {
    const res = await api.get(`/api/v2/academic/batch/${batchId}/sections`);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to fetch batch sections");
  }
});

const studentSlice = createSlice({
  name: "student",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder.addCase(fetchStudents.pending, (state) => { state.isLoading = true; });
    builder.addCase(fetchStudents.fulfilled, (state, { payload }) => { state.isLoading = false; state.students = payload; });
    builder.addCase(fetchStudents.rejected, (state, { payload }) => { state.isLoading = false; state.error = payload; });
    
    // Dashboard
    builder.addCase(fetchStudentDashboard.pending, (state) => { state.isLoading = true; });
    builder.addCase(fetchStudentDashboard.fulfilled, (state, { payload }) => { state.isLoading = false; state.dashboardData = payload; });
    builder.addCase(fetchStudentDashboard.rejected, (state, { payload }) => { state.isLoading = false; state.error = payload; });

    // History
    builder.addCase(fetchStudentHistory.pending, (state) => { state.isLoading = true; });
    builder.addCase(fetchStudentHistory.fulfilled, (state, { payload }) => { state.isLoading = false; state.historyData = payload; });
    builder.addCase(fetchStudentHistory.rejected, (state, { payload }) => { state.isLoading = false; state.error = payload; });

    // Batch Sections
    builder.addCase(fetchBatchSections.pending, (state) => { state.isLoading = true; });
    builder.addCase(fetchBatchSections.fulfilled, (state, { payload }) => { state.isLoading = false; state.batchSections = payload; });
    builder.addCase(fetchBatchSections.rejected, (state, { payload }) => { state.isLoading = false; state.error = payload; });
  },
});

export const { clearError } = studentSlice.actions;
export default studentSlice.reducer;
