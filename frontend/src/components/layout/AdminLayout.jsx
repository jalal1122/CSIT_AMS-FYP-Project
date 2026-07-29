import { Link, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logoutUser } from "../../store/slices/authSlice.js";
import {
  LayoutDashboard,
  Building2,
  BookOpen,
  Users,
  GraduationCap,
  ClipboardList,
  ArrowUpRight,
  UserCheck,
  BarChart3,
  LogOut,
} from "lucide-react";

export default function AdminLayout({ children }) {
  const location = useLocation();
  const dispatch = useDispatch();

  const navigation = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Foundation", href: "/admin/foundation", icon: Building2 },
    { name: "Curriculum", href: "/admin/curriculum", icon: BookOpen },
    { name: "Faculty", href: "/admin/faculty", icon: Users },
    { name: "Batch Create", href: "/admin/batch/create", icon: GraduationCap },
    { name: "Allocations", href: "/admin/allocation", icon: ClipboardList },
    { name: "Promotions", href: "/admin/promotion", icon: ArrowUpRight },
    { name: "Students", href: "/admin/students", icon: UserCheck },
    { name: "Reports", href: "/admin/reports", icon: BarChart3 },
  ];

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Sidebar */}
      <div className="w-64 bg-surface-light border-r border-white/10 flex flex-col hidden md:flex">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-white tracking-tight">AttendX</h1>
          <p className="text-xs text-text-muted mt-1 uppercase tracking-wider">Admin Portal</p>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive
                    ? "bg-primary/20 text-primary border-l-4 border-primary"
                    : "text-text-muted hover:bg-white/5 hover:text-white border-l-4 border-transparent"
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? "text-primary" : "opacity-70"}`} />
                <span className="font-medium text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-danger hover:bg-danger/10 transition-colors"
          >
            <LogOut className="w-5 h-5 opacity-70" />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Mobile Header (simplified for now) */}
        <header className="md:hidden bg-surface-light border-b border-white/10 p-4 flex justify-between items-center">
          <h1 className="text-lg font-bold text-white">AttendX Admin</h1>
          <button onClick={handleLogout} className="text-danger"><LogOut className="w-5 h-5" /></button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
