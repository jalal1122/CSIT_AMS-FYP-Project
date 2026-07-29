import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useSelector } from "react-redux";
import { lazy, Suspense } from "react";
import { selectIsAuthenticated, selectCurrentUser } from "./store/slices/authSlice.js";
import PrivateRoute from "./components/PrivateRoute.jsx";

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

function App() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);

  const getDefaultRedirect = () => {
    if (!isAuthenticated) return "/login";
    const routes = { admin: "/admin/dashboard", teacher: "/teacher/dashboard", student: "/student/dashboard" };
    return routes[user?.role] || "/login";
  };

  return (
    <Router>
      <Suspense fallback={<div className="min-h-screen bg-surface" />}>
        <Routes>
          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/setup-profile" element={<SetupProfile />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Admin */}
          <Route path="/admin/dashboard" element={<PrivateRoute allowedRoles={["admin"]}><AdminDashboard /></PrivateRoute>} />
          <Route path="/admin/foundation" element={<PrivateRoute allowedRoles={["admin"]}><Foundation /></PrivateRoute>} />
          <Route path="/admin/curriculum" element={<PrivateRoute allowedRoles={["admin"]}><Curriculum /></PrivateRoute>} />
          <Route path="/admin/faculty" element={<PrivateRoute allowedRoles={["admin"]}><Faculty /></PrivateRoute>} />
          <Route path="/admin/batch/create" element={<PrivateRoute allowedRoles={["admin"]}><BatchCreate /></PrivateRoute>} />
          <Route path="/admin/allocation" element={<PrivateRoute allowedRoles={["admin"]}><Allocation /></PrivateRoute>} />
          <Route path="/admin/promotion" element={<PrivateRoute allowedRoles={["admin"]}><Promotion /></PrivateRoute>} />
          <Route path="/admin/students" element={<PrivateRoute allowedRoles={["admin"]}><Students /></PrivateRoute>} />
          <Route path="/admin/reports" element={<PrivateRoute allowedRoles={["admin"]}><AdminReports /></PrivateRoute>} />

          {/* Teacher */}
          <Route path="/teacher/dashboard" element={<PrivateRoute allowedRoles={["teacher","admin"]}><TeacherDashboard /></PrivateRoute>} />
          <Route path="/teacher/session/live/:sessionId" element={<PrivateRoute allowedRoles={["teacher","admin"]}><LiveSession /></PrivateRoute>} />
          <Route path="/teacher/class/:allocationId" element={<PrivateRoute allowedRoles={["teacher","admin"]}><ClassDetails /></PrivateRoute>} />

          {/* Student */}
          <Route path="/student/dashboard" element={<PrivateRoute allowedRoles={["student"]}><StudentDashboard /></PrivateRoute>} />
          <Route path="/student/scan" element={<PrivateRoute allowedRoles={["student"]}><ScanAttendance /></PrivateRoute>} />
          <Route path="/student/profile" element={<PrivateRoute allowedRoles={["student","teacher","admin"]}><StudentProfile /></PrivateRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to={getDefaultRedirect()} replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
