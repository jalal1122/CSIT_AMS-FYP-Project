import { Link, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { LayoutDashboard, Settings, LogOut } from "lucide-react";
import { logoutUser } from "../../store/slices/authSlice";
import ProfileDropdown from "./ProfileDropdown";

export default function StudentLayout({ children }) {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const { dashboardData } = useSelector((state) => state.student);
  
  const currentSubjects = dashboardData || [];

  return (
    <div className="min-h-screen bg-slate-50 relative pb-28 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 p-2.5 sm:p-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-6 w-full sm:w-auto justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-xl font-extrabold text-sky-600 tracking-tight uppercase truncate">CSIT AMS Student</h1>
              <p className="text-[11px] sm:text-xs font-medium text-slate-500 truncate mt-0.5">Welcome, {user?.name || "Student"}</p>
            </div>
            {/* Mobile Actions */}
            <div className="sm:hidden flex items-center gap-1.5 shrink-0">
              <ProfileDropdown />
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <nav className="flex items-center gap-1 sm:gap-4 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 hide-scrollbar">
              <Link to="/student/dashboard" className={`px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2 whitespace-nowrap rounded-lg transition-colors ${location.pathname === "/student/dashboard" ? "text-sky-600 bg-sky-50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}>
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </Link>
              {currentSubjects.length > 0 && (
                <Link to={`/student/classes/${currentSubjects[0].id}`} className={`px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2 whitespace-nowrap rounded-lg transition-colors ${location.pathname.startsWith("/student/classes") ? "text-sky-600 bg-sky-50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}>
                  Classes
                </Link>
              )}
              <Link to="/student/reports" className={`px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2 whitespace-nowrap rounded-lg transition-colors ${location.pathname.startsWith("/student/reports") ? "text-sky-600 bg-sky-50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}>
                Reports
              </Link>
            </nav>
            
            <div className="hidden sm:flex items-center gap-3 pl-2 sm:pl-4 border-l border-slate-200 shrink-0">
              <ProfileDropdown />
            </div>
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}
