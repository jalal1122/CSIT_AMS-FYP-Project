import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-inter">
      <div className="text-center max-w-lg w-full">
        <div className="mx-auto w-24 h-24 bg-sky-100 rounded-full flex items-center justify-center text-sky-600 mb-8 shadow-inner">
          <ShieldAlert className="w-12 h-12" />
        </div>
        <h1 className="text-6xl font-extrabold text-slate-800 tracking-tighter mb-4">404</h1>
        <h2 className="text-2xl font-bold text-slate-700 mb-3">Page Not Found</h2>
        <p className="text-slate-500 mb-8 leading-relaxed">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <Link 
          to="/" 
          className="btn-primary inline-flex items-center px-8 py-3 text-base"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
