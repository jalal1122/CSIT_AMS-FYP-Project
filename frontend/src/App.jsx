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
import PublicRoute from "./components/PublicRoute.jsx";
import AdminLayout from "./components/layout/AdminLayout.jsx";
import StudentLayout from "./components/layout/StudentLayout.jsx";
import TeacherLayout from "./components/layout/TeacherLayout.jsx";
import ErrorBoundary from "./components/shared/ErrorBoundary.jsx";
import ToastContainer from "./components/shared/ToastContainer.jsx";

// Auth & Public Pages
const Login = lazy(() => import("./pages/auth/Login.jsx"));
const SetupProfile = lazy(() => import("./pages/auth/SetupProfile.jsx"));
const LandingPage = lazy(() => import("./pages/LandingPage.jsx"));
const RegisterAdmin = lazy(() => import("./pages/RegisterAdmin.jsx"));
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
const AdminLiveMonitor = lazy(() => import("./pages/admin/AdminLiveMonitor.jsx"));
const SecurityAnalytics = lazy(() => import("./pages/admin/SecurityAnalytics.jsx"));
const BehavioralAnalytics = lazy(() => import("./pages/admin/BehavioralAnalytics.jsx"));

// Teacher Pages
const TeacherDashboard = lazy(() => import("./pages/teacher/TeacherDashboard.jsx"));
const LiveSession = lazy(() => import("./pages/teacher/LiveSession.jsx"));
const ClassDetails = lazy(() => import("./pages/teacher/ClassDetails.jsx"));
const SessionHistory = lazy(() => import("./pages/teacher/SessionHistory.jsx"));
const TeacherReports = lazy(() => import("./pages/teacher/TeacherReports.jsx"));

// Student Pages
const StudentDashboard = lazy(() => import("./pages/student/StudentDashboard.jsx"));
const ScanAttendance = lazy(() => import("./pages/student/ScanAttendance.jsx"));
const StudentProfile = lazy(() => import("./pages/student/StudentProfile.jsx"));
const MyAttendance = lazy(() => import("./pages/student/MyAttendance.jsx"));
const StudentReports = lazy(() => import("./pages/student/StudentReports.jsx"));

// Shared Components

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
  return (
    <Router>
      <ErrorBoundary>
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
              <p className="text-slate-500 font-medium">Loading...</p>
            </div>
          </div>
        }>
          <ToastContainer />
          <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/setup-profile" element={<PrivateRoute><SetupProfile /></PrivateRoute>} />
            <Route path="/admin/bootstrap" element={<RegisterAdmin />} />
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
          <Route path="/admin/live-monitor" element={<PrivateRoute allowedRoles={["admin"]}><AdminLayout><AdminLiveMonitor /></AdminLayout></PrivateRoute>} />
          <Route path="/admin/reports" element={<PrivateRoute allowedRoles={["admin"]}><AdminLayout><AdminReports /></AdminLayout></PrivateRoute>} />
          <Route path="/admin/security-analytics" element={<PrivateRoute allowedRoles={["admin"]}><AdminLayout><SecurityAnalytics /></AdminLayout></PrivateRoute>} />
          <Route path="/admin/behavioral-analytics" element={<PrivateRoute allowedRoles={["admin"]}><AdminLayout><BehavioralAnalytics /></AdminLayout></PrivateRoute>} />

          {/* Teacher */}
          <Route path="/teacher/dashboard" element={<PrivateRoute allowedRoles={["teacher","admin"]}><TeacherLayout><TeacherDashboard /></TeacherLayout></PrivateRoute>} />
          <Route path="/teacher/session/live/:sessionId" element={<PrivateRoute allowedRoles={["teacher","admin"]}><TeacherLayout><LiveSession /></TeacherLayout></PrivateRoute>} />
          <Route path="/teacher/class/:allocationId/:sectionName" element={<PrivateRoute allowedRoles={["teacher","admin"]}><TeacherLayout><ClassDetails /></TeacherLayout></PrivateRoute>} />
          <Route path="/teacher/class/:allocationId/:sectionName/history" element={<PrivateRoute allowedRoles={["teacher","admin"]}><TeacherLayout><SessionHistory /></TeacherLayout></PrivateRoute>} />
          <Route path="/teacher/reports" element={<PrivateRoute allowedRoles={["teacher","admin"]}><TeacherLayout><TeacherReports /></TeacherLayout></PrivateRoute>} />

          {/* Student */}
          <Route path="/student/dashboard" element={<PrivateRoute allowedRoles={["student"]}><StudentLayout><StudentDashboard /></StudentLayout></PrivateRoute>} />
          <Route path="/student/scan" element={<PrivateRoute allowedRoles={["student"]}><ScanAttendance /></PrivateRoute>} />
          <Route path="/student/classes/:allocationId" element={<PrivateRoute allowedRoles={["student"]}><StudentLayout><MyAttendance /></StudentLayout></PrivateRoute>} />
          <Route path="/student/reports" element={<PrivateRoute allowedRoles={["student"]}><StudentLayout><StudentReports /></StudentLayout></PrivateRoute>} />
          <Route path="/student/profile" element={<PrivateRoute allowedRoles={["student","teacher","admin"]}><StudentLayout><StudentProfile /></StudentLayout></PrivateRoute>} />

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
