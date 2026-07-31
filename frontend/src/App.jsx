import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectIsAuthenticated, selectCurrentUser, selectIsCheckingAuth, checkAuth } from "./store/slices/authSlice.js";
import { fetchSettings } from "./store/slices/systemSlice.js";
import PrivateRoute from "./components/PrivateRoute.jsx";
import AdminLayout from "./components/layout/AdminLayout.jsx";

// Auth Pages
const Login = lazy(() => import("./pages/auth/Login.jsx"));
const SetupProfile = lazy(() => import("./pages/auth/SetupProfile.jsx"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword.jsx"));

// Admin Pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard.jsx"));
const Foundation = lazy(() => import("./pages/admin/Foundation.jsx"));
const Curriculum = lazy(() => import("./pages/admin/Curriculum.jsx"));
const Faculty = lazy(() => import("./pages/admin/Faculty.jsx"));
const BatchCreate = lazy(() => import("./pages/admin/BatchCreate.jsx"));
const Allocation = lazy(() => import("./pages/admin/Allocation.jsx"));
const Promotion = lazy(() => import("./pages/admin/Promotion.jsx"));
const Students = lazy(() => import("./pages/admin/Students.jsx"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports.jsx"));

// Teacher Pages
const TeacherDashboard = lazy(() => import("./pages/teacher/TeacherDashboard.jsx"));
const LiveSession = lazy(() => import("./pages/teacher/LiveSession.jsx"));
const ClassDetails = lazy(() => import("./pages/teacher/ClassDetails.jsx"));

// Student Pages
const StudentDashboard = lazy(() => import("./pages/student/StudentDashboard.jsx"));
const ScanAttendance = lazy(() => import("./pages/student/ScanAttendance.jsx"));
const StudentProfile = lazy(() => import("./pages/student/StudentProfile.jsx"));
const StudentReports = lazy(() => import("./pages/student/StudentReports.jsx"));

// Shared Components
const ToastContainer = lazy(() => import("./components/shared/ToastContainer.jsx"));

function App() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);
  const isCheckingAuth = useSelector(selectIsCheckingAuth);

  const settings = useSelector((state) => state.system?.settings || {});

  useEffect(() => {
    dispatch(checkAuth());
    dispatch(fetchSettings());
  }, [dispatch]);

  // Apply dynamic UI settings
  useEffect(() => {
    if (settings.primaryColor) {
      document.documentElement.style.setProperty("--color-primary", settings.primaryColor);
    }
    if (settings.secondaryColor) {
      document.documentElement.style.setProperty("--color-secondary", settings.secondaryColor);
    }
  }, [settings]);

  const getDefaultRedirect = () => {
    if (!isAuthenticated) return "/login";
    const routes = { admin: "/admin/dashboard", teacher: "/teacher/dashboard", student: "/student/dashboard" };
    return routes[user?.role] || "/login";
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-sky-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Router>
      <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-sky-500 rounded-full animate-spin"></div></div>}>
        <ToastContainer />
        <Routes>
          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/setup-profile" element={<SetupProfile />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Admin */}
          <Route path="/admin/dashboard" element={<PrivateRoute allowedRoles={["admin"]}><AdminLayout><AdminDashboard /></AdminLayout></PrivateRoute>} />
          <Route path="/admin/foundation" element={<PrivateRoute allowedRoles={["admin"]}><AdminLayout><Foundation /></AdminLayout></PrivateRoute>} />
          <Route path="/admin/curriculum" element={<PrivateRoute allowedRoles={["admin"]}><AdminLayout><Curriculum /></AdminLayout></PrivateRoute>} />
          <Route path="/admin/faculty" element={<PrivateRoute allowedRoles={["admin"]}><AdminLayout><Faculty /></AdminLayout></PrivateRoute>} />
          <Route path="/admin/batch/create" element={<PrivateRoute allowedRoles={["admin"]}><AdminLayout><BatchCreate /></AdminLayout></PrivateRoute>} />
          <Route path="/admin/allocation" element={<PrivateRoute allowedRoles={["admin"]}><AdminLayout><Allocation /></AdminLayout></PrivateRoute>} />
          <Route path="/admin/promotion" element={<PrivateRoute allowedRoles={["admin"]}><AdminLayout><Promotion /></AdminLayout></PrivateRoute>} />
          <Route path="/admin/students" element={<PrivateRoute allowedRoles={["admin"]}><AdminLayout><Students /></AdminLayout></PrivateRoute>} />
          <Route path="/admin/reports" element={<PrivateRoute allowedRoles={["admin"]}><AdminLayout><AdminReports /></AdminLayout></PrivateRoute>} />

          {/* Teacher */}
          <Route path="/teacher/dashboard" element={<PrivateRoute allowedRoles={["teacher","admin"]}><TeacherDashboard /></PrivateRoute>} />
          <Route path="/teacher/session/live/:sessionId" element={<PrivateRoute allowedRoles={["teacher","admin"]}><LiveSession /></PrivateRoute>} />
          <Route path="/teacher/class/:allocationId/:sectionName" element={<PrivateRoute allowedRoles={["teacher","admin"]}><ClassDetails /></PrivateRoute>} />

          {/* Student */}
          <Route path="/student/dashboard" element={<PrivateRoute allowedRoles={["student"]}><StudentDashboard /></PrivateRoute>} />
          <Route path="/student/scan" element={<PrivateRoute allowedRoles={["student"]}><ScanAttendance /></PrivateRoute>} />
          <Route path="/student/reports" element={<PrivateRoute allowedRoles={["student"]}><StudentReports /></PrivateRoute>} />
          <Route path="/student/profile" element={<PrivateRoute allowedRoles={["student","teacher","admin"]}><StudentProfile /></PrivateRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to={getDefaultRedirect()} replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
