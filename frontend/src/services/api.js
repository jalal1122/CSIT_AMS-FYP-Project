import axios from "axios";
import { refreshAccessToken, logout } from "../store/slices/authSlice.js";

let store;
export const injectStore = (_store) => {
  store = _store;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001",
  withCredentials: true,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  if (store) {
    const token = store.getState().auth?.accessToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise = null;

api.interceptors.response.use(
  (response) => {
    if (typeof response.data === "string" && response.data.trim().startsWith("<")) {
      const error = new Error("API returned HTML instead of JSON. Please check your VITE_API_URL configuration in .env");
      error.response = { data: { message: error.message } };
      return Promise.reject(error);
    }
    return response;
  },
  async (error) => {
    const original = error.config;
    const noRetryUrls = ["/auth/refresh", "/auth/login", "/auth/me"];
    const isNoRetryUrl = noRetryUrls.some((u) => original.url?.includes(u));

    if (error.response?.status === 401 && !original._retry && !isNoRetryUrl) {
      original._retry = true;

      if (!refreshPromise && store) {
        refreshPromise = store.dispatch(refreshAccessToken()).unwrap().finally(() => {
          refreshPromise = null;
        });
      }

      try {
        await refreshPromise;
        const newToken = store?.getState()?.auth?.accessToken;
        if (newToken) {
            original.headers.Authorization = `Bearer ${newToken}`;
        }
        return api(original);
      } catch {
        if (store) store.dispatch(logout());
        window.location.href = "/login";
        return Promise.reject(error);
      }
    }

    if (error.response?.data?.errorCode === "ACCOUNT_INACTIVE") {
      if (store) store.dispatch(logout());
      window.location.href = "/login?reason=inactive";
    }

    return Promise.reject(error);
  }
);

export default api;

