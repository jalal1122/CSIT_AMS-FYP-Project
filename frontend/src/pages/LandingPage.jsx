import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CheckCircle,
  Clock,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  ArrowDown,
  Menu,
  X,
  ExternalLink,
  Lock,
  Layers
} from "lucide-react";
import logo from "/logo.png";

export default function LandingPage() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const scrollToFeatures = (e) => {
    if (e) e.preventDefault();
    setIsMobileMenuOpen(false);
    const element = document.getElementById("features");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            {/* Logo & Heading */}
            <Link to="/" className="flex items-center gap-2.5 sm:gap-3.5 group min-w-0 flex-1 sm:flex-initial">
              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-white p-1 shadow-sm border border-slate-200/90 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                <img
                  src={logo}
                  alt="The University of Agriculture Peshawar Logo"
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
              <div className="flex flex-col text-left min-w-0">
                <span className="text-xs sm:text-base md:text-lg font-black text-slate-900 tracking-tight leading-snug group-hover:text-sky-600 transition-colors truncate">
                  Institute of Computer Science &amp; IT
                </span>
                <span className="text-[9px] sm:text-xs font-semibold text-slate-500 tracking-normal leading-tight truncate">
                  The University of Agriculture, Peshawar
                </span>
              </div>
            </Link>

            {/* Desktop Nav Items */}
            <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
              <button
                onClick={scrollToFeatures}
                className="text-sm font-semibold text-slate-600 hover:text-sky-600 transition-colors cursor-pointer"
              >
                Features
              </button>
              <div className="h-5 w-px bg-slate-200"></div>
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

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center shrink-0">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-slate-600 hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Toggle Menu"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-3 shadow-lg absolute w-full left-0 top-full">
            <button
              onClick={scrollToFeatures}
              className="w-full text-left block px-3 py-2 text-base font-semibold text-slate-700 hover:bg-slate-50 rounded-lg"
            >
              Features
            </button>
            <Link
              to="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 text-base font-semibold text-sky-600 hover:bg-sky-50 rounded-lg"
            >
              Log in
            </Link>
            <Link
              to="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block w-full text-center px-4 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-sky-600 to-indigo-600 shadow-md shadow-sky-500/20"
            >
              Access Portal
            </Link>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-10 pb-16 sm:pt-16 sm:pb-28 lg:pt-24 lg:pb-36">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-sky-50 to-transparent -z-10"></div>
        <div className="absolute top-1/4 left-0 w-72 h-72 bg-sky-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-1/3 right-0 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-sky-100/80 border border-sky-200 text-sky-800 text-[11px] sm:text-sm font-bold mb-6 sm:mb-8 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-sky-600 animate-pulse"></span>
            ICS/IT • Automated Attendance Management System
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 mb-4 sm:mb-8 max-w-4xl mx-auto leading-tight">
            The Future of <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-indigo-600">Smart Attendance</span> in Education
          </h1>
          <p className="mt-2 sm:mt-4 text-sm sm:text-lg md:text-xl text-slate-600 max-w-3xl mx-auto mb-6 sm:mb-10 font-medium">
            Seamlessly track, manage, and analyze student attendance with cutting-edge QR technology and real-time analytics designed for modern universities.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-6">
            <button
              onClick={() => navigate('/login')}
              className="px-6 sm:px-8 py-3 sm:py-4 rounded-full text-sm sm:text-lg font-bold text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 shadow-xl shadow-sky-500/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              Enter Portal <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={scrollToFeatures}
              className="group px-6 sm:px-8 py-3 sm:py-4 rounded-full text-sm sm:text-lg font-bold text-slate-700 bg-white border-2 border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 hover:text-sky-700 shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Explore Features</span>
              <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-sky-600 group-hover:translate-y-1 transition-all" />
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-sky-900 text-white py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center sm:divide-x sm:divide-sky-800/50">
            <div>
              <p className="text-2xl sm:text-4xl font-black text-sky-400 mb-1 sm:mb-2">99%</p>
              <p className="text-xs sm:text-sm font-medium text-sky-100 uppercase tracking-wider">Accuracy Rate</p>
            </div>
            <div>
              <p className="text-2xl sm:text-4xl font-black text-sky-400 mb-1 sm:mb-2">&lt; 3s</p>
              <p className="text-xs sm:text-sm font-medium text-sky-100 uppercase tracking-wider">Scan Time</p>
            </div>
            <div>
              <p className="text-2xl sm:text-4xl font-black text-sky-400 mb-1 sm:mb-2">10k+</p>
              <p className="text-xs sm:text-sm font-medium text-sky-100 uppercase tracking-wider">Students Tracked</p>
            </div>
            <div>
              <p className="text-2xl sm:text-4xl font-black text-sky-400 mb-1 sm:mb-2">0</p>
              <p className="text-xs sm:text-sm font-medium text-sky-100 uppercase tracking-wider">Paper Waste</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="scroll-mt-24 py-24 bg-white">
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
              <h3 className="text-xl font-bold text-slate-900 mb-3">Secure &amp; Verified</h3>
              <p className="text-slate-600 font-medium">Enterprise-grade security with 2FA, device binding for students, and strict role-based access control.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 pt-16 pb-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-slate-800/80">
            {/* Brand column */}
            <div className="md:col-span-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white p-1 shadow-md flex items-center justify-center flex-shrink-0">
                  <img src={logo} alt="The University of Agriculture, Peshawar Logo" className="w-full h-full object-contain rounded-full" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
                    Institute of Computer Science &amp; IT
                  </h3>
                  <p className="text-xs font-medium text-slate-400">
                    The University of Agriculture, Peshawar
                  </p>
                </div>
              </div>
              <p className="text-sm text-slate-400 max-w-md leading-relaxed">
                Smart Attendance Management System (CSIT AMS) featuring dynamic QR authentication, real-time analytics, and role-based academic monitoring.
              </p>
            </div>

            {/* Quick Navigation */}
            <div className="md:col-span-3 space-y-3">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Quick Navigation</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <button onClick={scrollToFeatures} className="hover:text-sky-400 transition-colors cursor-pointer">
                    Core Capabilities
                  </button>
                </li>
                <li>
                  <Link to="/login" className="hover:text-sky-400 transition-colors">
                    Student &amp; Faculty Portal
                  </Link>
                </li>
                <li>
                  <Link to="/admin/bootstrap" className="hover:text-sky-400 transition-colors">
                    System Setup &amp; Initialization
                  </Link>
                </li>
              </ul>
            </div>

            {/* Department & University Details */}
            <div className="md:col-span-3 space-y-3">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Department</h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                Faculty of Management &amp; Computer Science<br />
                The University of Agriculture<br />
                Peshawar, Khyber Pakhtunkhwa, Pakistan
              </p>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-xs font-bold text-sky-400 hover:text-sky-300 transition-colors"
                >
                  Enter Portal <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-medium text-slate-500">
            <p className="text-center sm:text-left">
              © {new Date().getFullYear()} Institute of Computer Science &amp; IT (ICS/IT), The University of Agriculture, Peshawar. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                CSIT AMS v2.0
              </span>
              <Link to="/admin/bootstrap" className="hover:text-slate-400 transition-colors">
                System Setup
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

