import { Link, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { LayoutDashboard, FileSpreadsheet, User } from "lucide-react";
import { logoutUser } from "../../store/slices/authSlice";
import ProfileDropdown from "./ProfileDropdown";

export default function TeacherLayout({ children }) {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 p-2.5 sm:p-4 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-6 w-full sm:w-auto justify-between relative z-40">
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-xl font-extrabold text-sky-600 tracking-tight truncate">CSIT AMS Teacher</h1>
              <p className="text-[11px] sm:text-xs font-medium text-slate-500 truncate mt-0.5">Welcome, {user?.name || "Teacher"}</p>
            </div>
            {/* Mobile Actions */}
            <div className="sm:hidden flex items-center gap-1.5 shrink-0 relative z-50">
              <ProfileDropdown />
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <nav className="flex items-center gap-1 sm:gap-4 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 hide-scrollbar">
              <Link to="/teacher/dashboard" className={`px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2 whitespace-nowrap rounded-lg transition-colors ${location.pathname === "/teacher/dashboard" ? "text-sky-600 bg-sky-50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}>
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </Link>
              <Link to="/teacher/reports" className={`px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2 whitespace-nowrap rounded-lg transition-colors ${location.pathname.startsWith("/teacher/reports") ? "text-sky-600 bg-sky-50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}>
                 <FileSpreadsheet className="w-4 h-4" /> Reports
              </Link>
            </nav>
            
            <div className="hidden sm:flex items-center gap-3 pl-2 sm:pl-4 border-l border-slate-200 shrink-0 relative z-50">
              <ProfileDropdown />
            </div>
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}
