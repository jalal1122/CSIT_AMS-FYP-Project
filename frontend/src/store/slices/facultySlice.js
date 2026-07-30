import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api.js";

const initialState = {
  teachers: [],
  isLoading: false,
  error: null,
};

export const fetchTeachers = createAsyncThunk("faculty/fetchTeachers", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get("/api/v2/admin/users?role=teacher");
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to fetch teachers");
  }
});

export const createTeacher = createAsyncThunk("faculty/createTeacher", async (data, { rejectWithValue }) => {
  try {
    const res = await api.post("/api/v2/system/teacher", data);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to create teacher");
  }
});

export const resetTeacherPassword = createAsyncThunk("faculty/resetTeacherPassword", async (id, { rejectWithValue }) => {
  try {
    const res = await api.patch(`/api/v2/admin/users/${id}/reset-password`);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to reset password");
  }
});

export const offboardTeacher = createAsyncThunk("faculty/offboardTeacher", async (id, { rejectWithValue }) => {
  try {
    const res = await api.post(`/api/v2/admin/teacher/${id}/offboard`);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to offboard teacher");
  }
});

export const updateTeacherStatus = createAsyncThunk("faculty/updateTeacherStatus", async ({ id, status }, { rejectWithValue }) => {
  try {
    const res = await api.patch(`/api/v2/admin/users/${id}/status`, { accountStatus: status });
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to update status");
  }
});

const facultySlice = createSlice({
  name: "faculty",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder.addCase(fetchTeachers.pending, (state) => { state.isLoading = true; });
    builder.addCase(fetchTeachers.fulfilled, (state, { payload }) => { state.isLoading = false; state.teachers = payload; });
    builder.addCase(fetchTeachers.rejected, (state, { payload }) => { state.isLoading = false; state.error = payload; });
  },
});

export const { clearError } = facultySlice.actions;
export default facultySlice.reducer;
