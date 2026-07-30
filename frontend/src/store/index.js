import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice.js";
import systemReducer from "./slices/systemSlice.js";
import academicReducer from "./slices/academicSlice.js";
import sessionReducer from "./slices/sessionSlice.js";
import analyticsReducer from "./slices/analyticsSlice.js";
import toastReducer from "./slices/toastSlice.js";
import facultyReducer from "./slices/facultySlice.js";
import studentReducer from "./slices/studentSlice.js";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    system: systemReducer,
    academic: academicReducer,
    session: sessionReducer,
    analytics: analyticsReducer,
    toast: toastReducer,
    faculty: facultyReducer,
    student: studentReducer,
  },
});

// Selectors
export const selectAuth = (state) => state.auth;
export const selectSystem = (state) => state.system;
export const selectAcademic = (state) => state.academic;
export const selectFaculty = (state) => state.faculty;
export const selectStudent = (state) => state.student;
