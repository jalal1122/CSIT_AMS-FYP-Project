import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  GraduationCap, 
  CheckCircle, 
  Clock, 
  ShieldCheck, 
  TrendingUp, 
  ArrowRight,
  Menu,
  X
} from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
                <GraduationCap className="w-6 h-6" />
              </div>
              <span className="text-2xl font-black bg-gradient-to-r from-sky-700 to-indigo-700 bg-clip-text text-transparent tracking-tight">
                AttendX
              </span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-sm font-semibold text-slate-600 hover:text-sky-600 transition-colors">Features</a>
              <a href="#benefits" className="text-sm font-semibold text-slate-600 hover:text-sky-600 transition-colors">Benefits</a>
              <div className="h-6 w-px bg-slate-200"></div>
              <Link to="/login" className="text-sm font-bold text-sky-600 hover:text-sky-700 transition-colors">
                Log in
              </Link>
              <Link 
                to="/login" 
                className="px-5 py-2.5 rounded-full text-sm font-bold text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 shadow-lg shadow-sky-500/30 transition-all hover:scale-105 active:scale-95"
              >
                Access Portal
              </Link>
            </div>

            <div className="md:hidden flex items-center">
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-600 hover:text-slate-900 p-2">
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-4 shadow-lg absolute w-full">
            <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 text-base font-semibold text-slate-700 hover:bg-slate-50 rounded-lg">Features</a>
            <a href="#benefits" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 text-base font-semibold text-slate-700 hover:bg-slate-50 rounded-lg">Benefits</a>
            <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 text-base font-semibold text-sky-600 hover:bg-sky-50 rounded-lg">Log in</Link>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32 lg:pt-32 lg:pb-40">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-sky-50 to-transparent -z-10"></div>
        <div className="absolute top-1/4 left-0 w-72 h-72 bg-sky-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-1/3 right-0 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 mb-8 max-w-4xl mx-auto leading-tight">
            The Future of <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-indigo-600">Smart Attendance</span> in Education
          </h1>
          <p className="mt-4 text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto mb-10 font-medium">
            Seamlessly track, manage, and analyze student attendance with cutting-edge QR technology and real-time analytics designed for modern universities.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6">
            <button 
              onClick={() => navigate('/login')}
              className="px-8 py-4 rounded-full text-lg font-bold text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 shadow-xl shadow-sky-500/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            >
              Enter Portal <ArrowRight className="w-5 h-5" />
            </button>
            <a 
              href="#features"
              className="px-8 py-4 rounded-full text-lg font-bold text-slate-700 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center"
            >
              Explore Features
            </a>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-sky-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-sky-800/50">
            <div>
              <p className="text-4xl font-black text-sky-400 mb-2">99%</p>
              <p className="text-sm font-medium text-sky-100 uppercase tracking-wider">Accuracy Rate</p>
            </div>
            <div>
              <p className="text-4xl font-black text-sky-400 mb-2">&lt; 3s</p>
              <p className="text-sm font-medium text-sky-100 uppercase tracking-wider">Scan Time</p>
            </div>
            <div>
              <p className="text-4xl font-black text-sky-400 mb-2">10k+</p>
              <p className="text-sm font-medium text-sky-100 uppercase tracking-wider">Students Tracked</p>
            </div>
            <div>
              <p className="text-4xl font-black text-sky-400 mb-2">0</p>
              <p className="text-sm font-medium text-sky-100 uppercase tracking-wider">Paper Waste</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-sm font-black text-sky-600 tracking-widest uppercase mb-3">Core Capabilities</h2>
            <p className="text-3xl md:text-4xl font-extrabold text-slate-900">Everything you need for academic attendance</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:shadow-xl hover:border-sky-200 transition-all group">
              <div className="w-14 h-14 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <CheckCircle className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">One-Tap QR Scanning</h3>
              <p className="text-slate-600 font-medium">Students simply scan a dynamic QR code using their portal. Say goodbye to manual roll calls and buddy punching.</p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:shadow-xl hover:border-sky-200 transition-all group">
              <div className="w-14 h-14 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Real-time Analytics</h3>
              <p className="text-slate-600 font-medium">Instantly identify defaulters and track attendance trends across batches, disciplines, and departments.</p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:shadow-xl hover:border-sky-200 transition-all group">
              <div className="w-14 h-14 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Secure & Verified</h3>
              <p className="text-slate-600 font-medium">Enterprise-grade security with 2FA, device binding for students, and strict role-based access control.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-white">
            <GraduationCap className="w-6 h-6" />
            <span className="text-xl font-black tracking-tight">AttendX</span>
          </div>
          <p className="text-sm font-medium">© {new Date().getFullYear()} University Attendance Management System.</p>
          <div className="flex gap-4">
             <Link to="/admin/bootstrap" className="text-slate-500 hover:text-slate-300 text-xs font-semibold">System Setup</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
