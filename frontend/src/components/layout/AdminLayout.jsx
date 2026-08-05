import { Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../../store/slices/authSlice.js";
import { useState } from "react";
import NotificationCenter from "./NotificationCenter";
import {
  LayoutDashboard,
  Building2,
  BookOpen,
  Users,
  GraduationCap,
  ClipboardList,
  TrendingUp,
  UserCheck,
  BarChart3,
  LogOut,
  Bell,
  Search,
  Menu,
  X,
  PieChart,
  HeartPulse,
  ShieldAlert,
  BrainCircuit,
  Activity
} from "lucide-react";

export default function AdminLayout({ children }) {
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Foundation", href: "/admin/foundation", icon: Building2 },
    { name: "Curriculum", href: "/admin/curriculum", icon: BookOpen },
    { name: "Faculty", href: "/admin/faculty", icon: Users },
    { name: "Batch Create", href: "/admin/batch/create", icon: GraduationCap },
    { name: "Allocations", href: "/admin/allocation", icon: ClipboardList },
    { name: "Promotions", href: "/admin/promotion", icon: TrendingUp },
    { name: "Students", href: "/admin/students", icon: UserCheck },
    { name: "Live Monitor", href: "/admin/live-monitor", icon: Activity },
    { name: "Reports", href: "/admin/reports", icon: BarChart3 },
    { name: "Security Analytics", href: "/admin/security-analytics", icon: ShieldAlert },
    { name: "Behavioral Analytics", href: "/admin/behavioral-analytics", icon: BrainCircuit },
  ];

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  const getInitials = (name) => {
    if (!name) return "A";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2);
  };

  const SidebarContent = () => (
    <>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-sky-500 tracking-tight">CSIT AMS</h1>
        <div className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">Admin</div>
        <div className="text-[10px] text-slate-400 mt-0.5">Academic Management</div>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium ${
                isActive
                  ? "bg-sky-50 text-sky-600 border-l-4 border-sky-500"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700 border-l-4 border-transparent"
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? "text-sky-500" : "text-slate-400"}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 w-full rounded-lg text-rose-500 hover:bg-rose-50 transition-colors font-medium text-sm"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden font-inter text-slate-700">
      {/* Desktop Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 flex-col hidden md:flex h-full">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl flex flex-col z-50 transform transition-transform duration-300">
            <div className="absolute top-4 right-4">
              <button onClick={() => setMobileMenuOpen(false)} className="text-slate-500">
                <X className="w-6 h-6" />
              </button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 z-10 shrink-0">
          <div className="flex items-center flex-1">
            <button className="md:hidden mr-4 text-slate-500" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            
            {/* Search Bar */}
            <div className="hidden md:flex items-center bg-slate-100 rounded-full px-4 py-2 w-96 border border-slate-200">
              <Search className="w-4 h-4 text-slate-400 mr-2" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder-slate-400"
              />
            </div>
          </div>

          {/* Right Header Items */}
          <div className="flex items-center gap-4">
            <NotificationCenter />
            <div className="h-6 w-px bg-slate-200 mx-2"></div>
            <div className="flex items-center gap-3">
              <div className="hidden md:block text-right">
                <div className="text-sm font-semibold text-slate-700">{user?.name || "Admin User"}</div>
                <div className="text-xs text-slate-500">{user?.email || "admin@csit-ams.com"}</div>
              </div>
              <Link
                to="/admin/profile"
                title="My Profile"
                className="group flex items-center"
              >
                <div className="w-9 h-9 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm border border-sky-200 group-hover:bg-sky-200 group-hover:border-sky-400 transition-all cursor-pointer">
                  {getInitials(user?.name)}
                </div>
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-6">
          <div className="max-w-7xl mx-auto h-full pb-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
