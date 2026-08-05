import { Link, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { LayoutDashboard, FileSpreadsheet, User } from "lucide-react";
import { logoutUser } from "../../store/slices/authSlice";
import NotificationCenter from "./NotificationCenter";

export default function TeacherLayout({ children }) {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 p-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-6 w-full sm:w-auto justify-between">
            <div>
              <h1 className="text-xl font-extrabold text-sky-600 tracking-tight">CSIT AMS Teacher Portal</h1>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Welcome, {user?.name || "Teacher"}</p>
            </div>
            {/* Mobile Actions */}
            <div className="sm:hidden flex items-center gap-3">
               <button 
                className="text-rose-500 text-sm font-semibold hover:bg-rose-50 px-2 py-1 rounded transition-colors"
                onClick={() => dispatch(logoutUser())}
              >
                Logout
              </button>
            </div>
          </div>
          
          <nav className="flex items-center gap-1 sm:gap-4 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 hide-scrollbar">
            <Link to="/teacher/dashboard" className={`px-3 py-2 text-sm font-semibold flex items-center gap-2 whitespace-nowrap rounded-lg transition-colors ${location.pathname === "/teacher/dashboard" ? "text-sky-600 bg-sky-50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}>
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </Link>
            <Link to="/teacher/reports" className={`px-3 py-2 text-sm font-semibold flex items-center gap-2 whitespace-nowrap rounded-lg transition-colors ${location.pathname.startsWith("/teacher/reports") ? "text-sky-600 bg-sky-50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}>
               <FileSpreadsheet className="w-4 h-4" /> Reports
            </Link>
            
            <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-slate-200 ml-2">
              <NotificationCenter />
              <Link
                to="/teacher/profile"
                className="flex items-center gap-2 hover:bg-sky-50 p-1.5 pr-3 rounded-full transition-colors border border-transparent hover:border-sky-200 group"
                title="My Profile"
              >
                <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 font-bold border border-sky-200 group-hover:bg-sky-200 transition-colors">
                  {user?.name?.charAt(0) || "T"}
                </div>
                <span className="text-sm font-medium text-slate-600 group-hover:text-sky-600 transition-colors">{user?.name?.split(' ')[0] || 'Profile'}</span>
              </Link>
              <button 
                className="text-rose-500 text-sm font-semibold hover:bg-rose-50 px-3 py-1.5 rounded transition-colors"
                onClick={() => dispatch(logoutUser())}
              >
                Logout
              </button>
            </div>
          </nav>
        </div>
      </header>

      {children}
    </div>
  );
}
