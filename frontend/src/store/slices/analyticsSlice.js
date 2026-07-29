import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  dashboardStats: null,
};

const analyticsSlice = createSlice({
  name: "analytics",
  initialState,
  reducers: {},
});

export default analyticsSlice.reducer;
