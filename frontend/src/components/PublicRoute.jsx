import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectIsAuthenticated, selectCurrentUser } from "../store/slices/authSlice.js";

export default function PublicRoute({ children }) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);

  if (isAuthenticated && user) {
    if (user.mustChangePassword) {
      return <Navigate to="/setup-profile" replace />;
    }
    const routes = { admin: "/admin/dashboard", teacher: "/teacher/dashboard", student: "/student/dashboard" };
    return <Navigate to={routes[user.role] || "/login"} replace />;
  }

  return children;
}
