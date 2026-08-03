import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice.js";
import systemReducer from "./slices/systemSlice.js";
import academicReducer from "./slices/academicSlice.js";
import sessionReducer from "./slices/sessionSlice.js";
import analyticsReducer from "./slices/analyticsSlice.js";
import toastReducer from "./slices/toastSlice.js";
import facultyReducer from "./slices/facultySlice.js";
import studentReducer from "./slices/studentSlice.js";
import teacherReducer from "./slices/teacherSlice.js";
import notificationReducer from "./slices/notificationSlice.js";
import { injectStore } from "../services/api.js";

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
    teacher: teacherReducer,
    notifications: notificationReducer,
  },
});

// Inject store into API interceptors to break circular dependency
injectStore(store);

// Selectors
export const selectAuth = (state) => state.auth;
export const selectSystem = (state) => state.system;
export const selectAcademic = (state) => state.academic;
export const selectFaculty = (state) => state.faculty;
export const selectStudent = (state) => state.student;
export const selectTeacher = (state) => state.teacher;
