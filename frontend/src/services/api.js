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

// Response interceptor: handle 401 -> refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        await store.dispatch(refreshAccessToken()).unwrap();
        const newToken = store.getState().auth.accessToken;
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        store.dispatch(logout());
        window.location.href = "/login";
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
