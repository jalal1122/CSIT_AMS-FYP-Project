import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api.js";

const initialState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  mustChangePassword: false,
  accountStatus: null, // "Active" | "Inactive" | "Suspended"
  isLoading: false,
  isCheckingAuth: true, // Start true so App.jsx shows a loader initially
  error: null,
};

export const login = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const res = await api.post("/api/v2/auth/login", credentials);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Login failed");
    }
  }
);

export const setupProfile = createAsyncThunk(
  "auth/setupProfile",
  async ({ newPassword }, { rejectWithValue }) => {
    try {
      const res = await api.post("/api/v2/auth/setup-profile", { newPassword });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Setup failed");
    }
  }
);

export const refreshAccessToken = createAsyncThunk(
  "auth/refresh",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.post("/api/v2/auth/refresh");
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Session expired");
    }
  }
);

export const checkAuth = createAsyncThunk(
  "auth/checkAuth",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/api/v2/auth/me");
      return res.data.data; // Should contain user object
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Not authenticated");
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      await api.post("/api/v2/auth/logout");
      return null;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Logout failed");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      Object.assign(state, initialState);
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(login.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(login.fulfilled, (state, { payload }) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = payload.user;
      state.accessToken = payload.accessToken;
      state.mustChangePassword = payload.user.mustChangePassword;
      state.accountStatus = payload.user.accountStatus;
    });
    builder.addCase(login.rejected, (state, { payload }) => {
      state.isLoading = false;
      state.error = payload;
    });

    // Setup Profile
    builder.addCase(setupProfile.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(setupProfile.fulfilled, (state, { payload }) => {
      state.isLoading = false;
      state.user = payload.user;
      state.mustChangePassword = false;
    });
    builder.addCase(setupProfile.rejected, (state, { payload }) => {
      state.isLoading = false;
      state.error = payload;
    });

    // Refresh Token
    builder.addCase(refreshAccessToken.fulfilled, (state, { payload }) => {
      state.accessToken = payload.accessToken;
    });
    builder.addCase(refreshAccessToken.rejected, (state) => {
      Object.assign(state, initialState);
    });

    // Logout
    builder.addCase(logoutUser.fulfilled, (state) => {
      Object.assign(state, initialState);
      state.isCheckingAuth = false; // Need to make sure this doesn't trap us in loading
    });

    // Check Auth
    builder.addCase(checkAuth.pending, (state) => {
      state.isCheckingAuth = true;
    });
    builder.addCase(checkAuth.fulfilled, (state, { payload }) => {
      state.isCheckingAuth = false;
      state.isAuthenticated = true;
      state.user = payload.user;
      state.accountStatus = payload.user.accountStatus;
    });
    builder.addCase(checkAuth.rejected, (state) => {
      state.isCheckingAuth = false;
      state.isAuthenticated = false;
      state.user = null;
    });
  },
});

export const { logout, clearError } = authSlice.actions;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectCurrentUser = (state) => state.auth.user;
export const selectIsCheckingAuth = (state) => state.auth.isCheckingAuth;
export default authSlice.reducer;
