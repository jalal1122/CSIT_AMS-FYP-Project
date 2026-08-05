import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api.js";

const initialState = {
  batches: [],
  allocations: [],
  currentBatch: null,
  isLoading: false,
  error: null,
};

export const fetchBatches = createAsyncThunk("academic/fetchBatches", async (params = {}, { rejectWithValue }) => {
  try {
    const res = await api.get("/api/v2/academic/batches", { params });
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to fetch batches");
  }
});

export const fetchBatchDetails = createAsyncThunk("academic/fetchBatchDetails", async (id, { rejectWithValue }) => {
  try {
    const res = await api.get(`/api/v2/academic/batch/${id}`);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to fetch batch details");
  }
});

export const createBatch = createAsyncThunk("academic/createBatch", async (formData, { rejectWithValue }) => {
  try {
    const res = await api.post("/api/v2/academic/batch/create", formData);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to create batch");
  }
});

export const promoteBatch = createAsyncThunk("academic/promoteBatch", async (id, { rejectWithValue }) => {
  try {
    const res = await api.post(`/api/v2/academic/batch/${id}/promote`);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to promote batch");
  }
});

export const rollbackBatch = createAsyncThunk("academic/rollbackBatch", async (id, { rejectWithValue }) => {
  try {
    const res = await api.post(`/api/v2/academic/batch/${id}/rollback`);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to rollback batch");
  }
});

export const fetchAllocations = createAsyncThunk("academic/fetchAllocations", async (params = {}, { rejectWithValue }) => {
  try {
    const res = await api.get("/api/v2/academic/allocations", { params });
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to fetch allocations");
  }
});

export const assignAllocations = createAsyncThunk("academic/assignAllocations", async (data, { rejectWithValue }) => {
  try {
    const res = await api.post("/api/v2/academic/allocation/assign", data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to assign allocations");
  }
});

export const toggleRetroactivePermission = createAsyncThunk("academic/toggleRetroactive", async ({ id, sectionName, allowRetroactiveSessions }, { rejectWithValue }) => {
  try {
    const res = await api.patch(`/api/v2/admin/allocation/${id}/retroactive`, { sectionName, allowRetroactiveSessions });
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to toggle permission");
  }
});

const academicSlice = createSlice({
  name: "academic",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // Batches
    builder.addCase(fetchBatches.pending, (state) => { state.isLoading = true; });
    builder.addCase(fetchBatches.fulfilled, (state, { payload }) => { state.isLoading = false; state.batches = payload; });
    builder.addCase(fetchBatches.rejected, (state, { payload }) => { state.isLoading = false; state.error = payload; });
    
    // Batch Details
    builder.addCase(fetchBatchDetails.pending, (state) => { state.isLoading = true; });
    builder.addCase(fetchBatchDetails.fulfilled, (state, { payload }) => { state.isLoading = false; state.currentBatch = payload; });
    builder.addCase(fetchBatchDetails.rejected, (state, { payload }) => { state.isLoading = false; state.error = payload; });
    
    // Allocations
    builder.addCase(fetchAllocations.pending, (state) => { state.isLoading = true; });
    builder.addCase(fetchAllocations.fulfilled, (state, { payload }) => { state.isLoading = false; state.allocations = payload; });
    builder.addCase(fetchAllocations.rejected, (state, { payload }) => { state.isLoading = false; state.error = payload; });

    // Toggle Retroactive Permission
    builder.addCase(toggleRetroactivePermission.pending, (state) => { state.isLoading = true; });
    builder.addCase(toggleRetroactivePermission.fulfilled, (state, { payload }) => {
      state.isLoading = false;
      // Update the matching allocation in the list with the new section data
      const idx = state.allocations.findIndex(a => a._id === payload._id);
      if (idx !== -1) {
        state.allocations[idx] = { ...state.allocations[idx], sections: payload.sections };
      }
    });
    builder.addCase(toggleRetroactivePermission.rejected, (state, { payload }) => { state.isLoading = false; state.error = payload; });
  },
});

export const { clearError } = academicSlice.actions;
export default academicSlice.reducer;
