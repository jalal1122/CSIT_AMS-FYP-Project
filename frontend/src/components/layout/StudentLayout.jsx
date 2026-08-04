import { Link, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { LayoutDashboard, Settings, LogOut } from "lucide-react";
import { logoutUser } from "../../store/slices/authSlice";
import NotificationCenter from "./NotificationCenter";

export default function StudentLayout({ children }) {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const { dashboardData } = useSelector((state) => state.student);
  
  const currentSubjects = dashboardData || [];

  return (
    <div className="min-h-screen bg-slate-50 relative pb-28 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 p-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-6 w-full sm:w-auto justify-between">
            <div>
              <h1 className="text-xl font-extrabold text-sky-600 tracking-tight uppercase">CSIT AMS Student Portal</h1>
            </div>
            {/* Mobile Avatar & Logout */}
            <div className="sm:hidden flex items-center gap-3">
              <button 
                onClick={() => dispatch(logoutUser())}
                className="p-1.5 text-rose-500 bg-rose-50 rounded-full hover:bg-rose-100 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
               <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold border border-sky-200">
                {(user?.name || "S").charAt(0)}
              </div>
            </div>
          </div>
          
          <nav className="flex items-center gap-1 sm:gap-4 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 hide-scrollbar">
            <Link to="/student/dashboard" className={`px-3 py-2 text-sm font-semibold flex items-center gap-2 whitespace-nowrap rounded-lg transition-colors ${location.pathname === "/student/dashboard" ? "text-sky-600 bg-sky-50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}>
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </Link>
            {currentSubjects.length > 0 && (
              <Link to={`/student/classes/${currentSubjects[0].id}`} className={`px-3 py-2 text-sm font-semibold flex items-center gap-2 whitespace-nowrap rounded-lg transition-colors ${location.pathname.startsWith("/student/classes") ? "text-sky-600 bg-sky-50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}>
                Classes
              </Link>
            )}
            <Link to="/student/reports" className={`px-3 py-2 text-sm font-semibold flex items-center gap-2 whitespace-nowrap rounded-lg transition-colors ${location.pathname.startsWith("/student/reports") ? "text-sky-600 bg-sky-50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}>
              Reports
            </Link>
            
            <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-slate-200 ml-2">
              <NotificationCenter />
              <button className="p-2 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-full transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              <button 
                onClick={() => dispatch(logoutUser())}
                className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
              <Link to="/student/profile" className="flex items-center gap-3 hover:bg-slate-50 p-1.5 pr-3 rounded-full transition-colors border border-transparent hover:border-slate-200 group">
                <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold border border-sky-200 group-hover:bg-sky-200 transition-colors">
                  {(user?.name || "S").charAt(0)}
                </div>
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {children}
    </div>
  );
}
