import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api.js";

const initialState = {
  currentSession: null,
  liveFeed: [],
  qrToken: null,
  qrRefreshRate: 15,
  isLoading: false,
  error: null,
};

export const startLiveSession = createAsyncThunk(
  "session/start",
  async (sessionData, { rejectWithValue }) => {
    try {
      const res = await api.post("/api/v2/session/start", sessionData);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to start session");
    }
  }
);

export const endLiveSession = createAsyncThunk(
  "session/end",
  async (sessionId, { rejectWithValue }) => {
    try {
      const res = await api.post(`/api/v2/session/${sessionId}/end`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to end session");
    }
  }
);

export const fetchActiveSession = createAsyncThunk(
  "session/fetchActive",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/api/v2/session/active");
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch active session");
    }
  }
);

export const fetchLiveAttendance = createAsyncThunk(
  "session/fetchLiveAttendance",
  async (sessionId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/api/v2/session/${sessionId}/live`);
      return res.data.data.liveFeed;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch live attendance");
    }
  }
);

export const refreshQrToken = createAsyncThunk(
  "session/refreshQrToken",
  async (sessionId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/api/v2/session/${sessionId}/qr`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to refresh QR token");
    }
  }
);

export const updateAttendanceStatus = createAsyncThunk(
  "session/updateAttendanceStatus",
  async ({ attendanceId, status }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/api/v2/attendance/${attendanceId}`, { status });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update attendance status");
    }
  }
);

export const updateSecuritySettings = createAsyncThunk(
  "session/updateSecuritySettings",
  async ({ sessionId, settings }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/api/v2/session/${sessionId}/security`, settings);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update security settings");
    }
  }
);

const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    clearSessionError: (state) => {
      state.error = null;
    },
    resetSession: (state) => {
      state.currentSession = null;
      state.liveFeed = [];
      state.qrToken = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Start Session
      .addCase(startLiveSession.pending, (state) => { state.isLoading = true; })
      .addCase(startLiveSession.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.currentSession = payload.session;
        state.qrToken = payload.qrToken;
      })
      .addCase(startLiveSession.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = payload;
      })
      // End Session
      .addCase(endLiveSession.fulfilled, (state) => {
        state.currentSession = null;
        state.liveFeed = [];
        state.qrToken = null;
      })
      // Fetch Active
      .addCase(fetchActiveSession.pending, (state) => { state.isLoading = true; })
      .addCase(fetchActiveSession.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.currentSession = payload; // Can be null if no session
      })
      .addCase(fetchActiveSession.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = payload;
      })
      // Fetch Live Attendance
      .addCase(fetchLiveAttendance.fulfilled, (state, { payload }) => {
        state.liveFeed = payload;
      })
      // Refresh QR
      .addCase(refreshQrToken.fulfilled, (state, { payload }) => {
        state.qrToken = payload.qrToken;
        state.qrRefreshRate = payload.refreshRate || 15;
      })
      // Update Security Settings
      .addCase(updateSecuritySettings.fulfilled, (state, action) => {
        if (state.currentSession) {
          state.currentSession.securityConfig = action.payload.securityConfig;
        }
      });
  },
});

export const { clearSessionError, resetSession } = sessionSlice.actions;
export default sessionSlice.reducer;
