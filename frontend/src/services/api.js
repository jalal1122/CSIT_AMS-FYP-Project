import axios from "axios";
import { store } from "../store/index.js";
import { logout, refreshAccessToken } from "../store/slices/authSlice.js";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001",
  withCredentials: true,
  timeout: 15000,
});

// Request interceptor: attach access token
api.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Singleton refresh promise to prevent concurrent refresh calls
// (React StrictMode fires effects twice in dev, causing race conditions)
let refreshPromise = null;

// Response interceptor: handle 401 -> refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // URLs that should NEVER trigger a refresh attempt
    const noRetryUrls = ["/auth/refresh", "/auth/login", "/auth/me"];
    const isNoRetryUrl = noRetryUrls.some((u) => original.url?.includes(u));

    if (error.response?.status === 401 && !original._retry && !isNoRetryUrl) {
      original._retry = true;

      // Reuse in-flight refresh if one is already in progress
      if (!refreshPromise) {
        refreshPromise = store
          .dispatch(refreshAccessToken())
          .unwrap()
          .finally(() => {
            refreshPromise = null;
          });
      }

      try {
        await refreshPromise;
        const newToken = store.getState().auth.accessToken;
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        store.dispatch(logout());
        window.location.href = "/login";
        return Promise.reject(error);
      }
    }

    // Handle ACCOUNT_INACTIVE error code
    if (error.response?.data?.errorCode === "ACCOUNT_INACTIVE") {
      store.dispatch(logout());
      window.location.href = "/login?reason=inactive";
    }

    return Promise.reject(error);
  }
);

export default api;

