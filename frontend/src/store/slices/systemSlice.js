import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api.js";

const initialState = {
  departments: [],
  subjects: [],
  disciplines: [],
  settings: {}, // Store UI colors and dynamic settings
  isLoading: false,
  error: null,
};

export const fetchSettings = createAsyncThunk("system/fetchSettings", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get("/api/v2/settings");
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to fetch settings");
  }
});

export const fetchDepartments = createAsyncThunk("system/fetchDepartments", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get("/api/v2/system/departments");
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to fetch departments");
  }
});

export const createDepartment = createAsyncThunk("system/createDepartment", async (data, { rejectWithValue }) => {
  try {
    const res = await api.post("/api/v2/system/department", data);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to create department");
  }
});

export const fetchSubjects = createAsyncThunk("system/fetchSubjects", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get("/api/v2/system/subjects");
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to fetch subjects");
  }
});

export const createSubject = createAsyncThunk("system/createSubject", async (data, { rejectWithValue }) => {
  try {
    const res = await api.post("/api/v2/system/subject", data);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to create subject");
  }
});

export const fetchDisciplines = createAsyncThunk("system/fetchDisciplines", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get("/api/v2/system/disciplines");
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to fetch disciplines");
  }
});

export const createDiscipline = createAsyncThunk("system/createDiscipline", async (data, { rejectWithValue }) => {
  try {
    const res = await api.post("/api/v2/system/discipline", data);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to create discipline");
  }
});

export const updateDepartment = createAsyncThunk("system/updateDepartment", async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await api.put(`/api/v2/system/department/${id}`, data);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to update department");
  }
});

export const deleteDepartment = createAsyncThunk("system/deleteDepartment", async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/api/v2/system/department/${id}`);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to delete department");
  }
});

export const updateSubject = createAsyncThunk("system/updateSubject", async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await api.put(`/api/v2/system/subject/${id}`, data);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to update subject");
  }
});

export const updateDiscipline = createAsyncThunk("system/updateDiscipline", async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await api.put(`/api/v2/system/discipline/${id}`, data);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to update discipline");
  }
});

export const deleteDiscipline = createAsyncThunk("system/deleteDiscipline", async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/api/v2/system/discipline/${id}`);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to delete discipline");
  }
});

export const updateSyllabus = createAsyncThunk("system/updateSyllabus", async ({ id, syllabusData }, { rejectWithValue }) => {
  try {
    const res = await api.put(`/api/v2/system/discipline/${id}/syllabus`, syllabusData);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to update syllabus");
  }
});

const systemSlice = createSlice({
  name: "system",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // Departments
    builder.addCase(fetchDepartments.pending, (state) => { state.isLoading = true; });
    builder.addCase(fetchDepartments.fulfilled, (state, { payload }) => { state.isLoading = false; state.departments = payload; });
    builder.addCase(fetchDepartments.rejected, (state, { payload }) => { state.isLoading = false; state.error = payload; });
    
    // Subjects
    builder.addCase(fetchSubjects.pending, (state) => { state.isLoading = true; });
    builder.addCase(fetchSubjects.fulfilled, (state, { payload }) => { state.isLoading = false; state.subjects = payload; });
    builder.addCase(fetchSubjects.rejected, (state, { payload }) => { state.isLoading = false; state.error = payload; });
    
    // Disciplines
    builder.addCase(fetchDisciplines.pending, (state) => { state.isLoading = true; });
    builder.addCase(fetchDisciplines.fulfilled, (state, { payload }) => { state.isLoading = false; state.disciplines = payload; });
    builder.addCase(fetchDisciplines.rejected, (state, { payload }) => { state.isLoading = false; state.error = payload; });
    
    // Settings
    builder.addCase(fetchSettings.pending, (state) => { state.isLoading = true; });
    builder.addCase(fetchSettings.fulfilled, (state, { payload }) => { state.isLoading = false; state.settings = payload; });
    builder.addCase(fetchSettings.rejected, (state, { payload }) => { state.isLoading = false; state.error = payload; });
  },
});

export const { clearError } = systemSlice.actions;
export default systemSlice.reducer;
