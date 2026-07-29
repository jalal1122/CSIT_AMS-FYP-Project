import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  currentSession: null,
};

const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {},
});

export default sessionSlice.reducer;
