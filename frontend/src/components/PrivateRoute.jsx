import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectIsAuthenticated, selectCurrentUser } from "../store/slices/authSlice.js";

export default function PrivateRoute({ children, allowedRoles }) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Handle users that must change their password (and haven't yet)
  if (user?.mustChangePassword && location.pathname !== "/setup-profile") {
    return <Navigate to="/setup-profile" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // If not allowed, redirect to default dashboard for their role
    const routes = { admin: "/admin/dashboard", teacher: "/teacher/dashboard", student: "/student/dashboard" };
    return <Navigate to={routes[user?.role] || "/login"} replace />;
  }

  return children;
}
