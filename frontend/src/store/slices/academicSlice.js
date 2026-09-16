import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api.js";

const initialState = {
  batches: [],
  allocations: [],
  currentBatch: null,
  batchSubjects: null, // { semester, source, subjects[] }
  isLoading: false,
  uploadLoading: false,
  error: null,
};

// ─── Batch CRUD ───────────────────────────────────────────────────────────────

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

export const createBatch = createAsyncThunk("academic/createBatch", async (data, { rejectWithValue }) => {
  // data: { name, departmentId, disciplineId, sections: ["A", "B", "Evening"] }
  try {
    const res = await api.post("/api/v2/academic/batch/create", data);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to create batch");
  }
});

export const updateBatch = createAsyncThunk("academic/updateBatch", async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await api.patch(`/api/v2/academic/batch/${id}`, data);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to update batch");
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

// ─── Batch Lifecycle ──────────────────────────────────────────────────────────

export const completeBatch = createAsyncThunk("academic/completeBatch", async (id, { rejectWithValue }) => {
  try {
    const res = await api.post(`/api/v2/academic/batch/${id}/complete`);
    return { id, ...res.data.data };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to complete batch");
  }
});

export const deleteBatch = createAsyncThunk("academic/deleteBatch", async ({ id, confirmName }, { rejectWithValue }) => {
  try {
    const res = await api.delete(`/api/v2/academic/batch/${id}`, { data: { confirmName } });
    return { id, ...res.data.data };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to delete batch");
  }
});

// ─── Section Management ───────────────────────────────────────────────────────

export const uploadSectionStudents = createAsyncThunk(
  "academic/uploadSectionStudents",
  async ({ batchId, sectionName, file }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post(
        `/api/v2/academic/batch/${batchId}/section/${encodeURIComponent(sectionName)}/upload`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return { batchId, sectionName, ...res.data.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Upload failed");
    }
  }
);

export const addSection = createAsyncThunk("academic/addSection", async ({ batchId, name }, { rejectWithValue }) => {
  try {
    const res = await api.post(`/api/v2/academic/batch/${batchId}/section`, { name });
    return { batchId, section: res.data.data.section };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to add section");
  }
});

export const deleteSection = createAsyncThunk(
  "academic/deleteSection",
  async ({ batchId, sectionName }, { rejectWithValue }) => {
    try {
      await api.delete(`/api/v2/academic/batch/${batchId}/section/${encodeURIComponent(sectionName)}`);
      return { batchId, sectionName };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete section");
    }
  }
);

export const archiveSection = createAsyncThunk(
  "academic/archiveSection",
  async ({ batchId, sectionName, archive = true }, { rejectWithValue }) => {
    try {
      const res = await api.patch(
        `/api/v2/academic/batch/${batchId}/section/${encodeURIComponent(sectionName)}/archive`,
        { archive }
      );
      return { batchId, sectionName, section: res.data.data.section };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to archive section");
    }
  }
);

// ─── Per-Batch Subject Management (Feature 1) ─────────────────────────────────

export const fetchBatchSubjects = createAsyncThunk(
  "academic/fetchBatchSubjects",
  async (batchId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/api/v2/academic/batch/${batchId}/subjects`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch batch subjects");
    }
  }
);

export const setBatchSubjects = createAsyncThunk(
  "academic/setBatchSubjects",
  async ({ batchId, subjectIds, semester }, { rejectWithValue }) => {
    try {
      const res = await api.post(`/api/v2/academic/batch/${batchId}/subjects`, { subjectIds, semester });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to set batch subjects");
    }
  }
);

// ─── Allocations ──────────────────────────────────────────────────────────────

export const fetchAllocations = createAsyncThunk("academic/fetchAllocations", async (params = {}, { rejectWithValue }) => {
  try {
    const res = await api.get("/api/v2/academic/allocations", { params: { ...params, limit: 1000 } });
    return res.data.data.allocations || res.data.data;
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

export const toggleRetroactivePermission = createAsyncThunk(
  "academic/toggleRetroactive",
  async ({ id, sectionName, allowRetroactiveSessions }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/api/v2/admin/allocation/${id}/retroactive`, { sectionName, allowRetroactiveSessions });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to toggle permission");
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const academicSlice = createSlice({
  name: "academic",
  initialState,
  reducers: {
    clearError: (state) => { state.error = null; },
    clearBatchSubjects: (state) => { state.batchSubjects = null; },
  },
  extraReducers: (builder) => {
    // Batches
    builder.addCase(fetchBatches.pending, (state) => { state.isLoading = true; });
    builder.addCase(fetchBatches.fulfilled, (state, { payload }) => { state.isLoading = false; state.batches = payload; });
    builder.addCase(fetchBatches.rejected, (state, { payload }) => { state.isLoading = false; state.error = payload; });

    // Update Batch
    builder.addCase(updateBatch.pending, (state) => { state.isLoading = true; });
    builder.addCase(updateBatch.fulfilled, (state, { payload }) => {
      state.isLoading = false;
      const idx = state.batches.findIndex(b => b._id === payload._id);
      if (idx !== -1) state.batches[idx] = payload;
    });
    builder.addCase(updateBatch.rejected, (state, { payload }) => { state.isLoading = false; state.error = payload; });

    // Batch Details
    builder.addCase(fetchBatchDetails.pending, (state) => { state.isLoading = true; });
    builder.addCase(fetchBatchDetails.fulfilled, (state, { payload }) => { state.isLoading = false; state.currentBatch = payload; });
    builder.addCase(fetchBatchDetails.rejected, (state, { payload }) => { state.isLoading = false; state.error = payload; });

    // Complete Batch
    builder.addCase(completeBatch.fulfilled, (state, { payload }) => {
      state.isLoading = false;
      const idx = state.batches.findIndex(b => b._id === payload.id);
      if (idx !== -1) state.batches[idx] = { ...state.batches[idx], isActive: false, currentSemester: 0 };
    });

    // Delete Batch
    builder.addCase(deleteBatch.fulfilled, (state, { payload }) => {
      state.isLoading = false;
      state.batches = state.batches.filter(b => b._id !== payload.id);
    });

    // Section: update currentBatch sections optimistically
    builder.addCase(addSection.fulfilled, (state, { payload }) => {
      if (state.currentBatch?._id === payload.batchId) {
        state.currentBatch.sections = [...(state.currentBatch.sections || []), payload.section];
      }
    });
    builder.addCase(deleteSection.fulfilled, (state, { payload }) => {
      if (state.currentBatch?._id === payload.batchId) {
        state.currentBatch.sections = state.currentBatch.sections.filter(
          s => s.name.toUpperCase() !== payload.sectionName.toUpperCase()
        );
      }
    });
    builder.addCase(archiveSection.fulfilled, (state, { payload }) => {
      if (state.currentBatch?._id === payload.batchId) {
        const idx = state.currentBatch.sections.findIndex(
          s => s.name.toUpperCase() === payload.sectionName.toUpperCase()
        );
        if (idx !== -1) state.currentBatch.sections[idx] = payload.section;
      }
    });
    builder.addCase(uploadSectionStudents.fulfilled, (state, { payload }) => {
      if (state.currentBatch?._id === payload.batchId) {
        const idx = state.currentBatch.sections.findIndex(
          s => s.name.toUpperCase() === payload.sectionName.toUpperCase()
        );
        if (idx !== -1) state.currentBatch.sections[idx].studentCount = payload.sectionStudentCount;
      }
    });

    // Batch Subjects
    builder.addCase(fetchBatchSubjects.fulfilled, (state, { payload }) => { state.batchSubjects = payload; });
    builder.addCase(setBatchSubjects.fulfilled, (state, { payload }) => { state.batchSubjects = payload; });

    // Allocations
    builder.addCase(fetchAllocations.pending, (state) => { state.isLoading = true; });
    builder.addCase(fetchAllocations.fulfilled, (state, { payload }) => { state.isLoading = false; state.allocations = payload; });
    builder.addCase(fetchAllocations.rejected, (state, { payload }) => { state.isLoading = false; state.error = payload; });

    // Toggle Retroactive Permission
    builder.addCase(toggleRetroactivePermission.pending, (state) => { state.isLoading = true; });
    builder.addCase(toggleRetroactivePermission.fulfilled, (state, { payload }) => {
      state.isLoading = false;
      const idx = state.allocations.findIndex(a => a._id === payload._id);
      if (idx !== -1) state.allocations[idx] = { ...state.allocations[idx], sections: payload.sections };
    });
    builder.addCase(toggleRetroactivePermission.rejected, (state, { payload }) => { state.isLoading = false; state.error = payload; });
  },
});

export const { clearError, clearBatchSubjects } = academicSlice.actions;
export default academicSlice.reducer;
