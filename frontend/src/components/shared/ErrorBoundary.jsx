import React, { Component } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-inter">
          <div className="card max-w-md w-full bg-white p-8 text-center border-rose-200 shadow-xl">
            <div className="mx-auto w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center text-rose-500 mb-6 shadow-inner">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-800 mb-2 tracking-tight">Something went wrong</h1>
            <p className="text-slate-500 mb-6 leading-relaxed text-sm">
              We encountered an unexpected error. Don't worry, our team has been notified. Please try refreshing the page or navigating back to safety.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button 
                onClick={() => window.location.reload()}
                className="btn-primary"
              >
                Refresh Page
              </button>
              <Link 
                to="/"
                className="btn-outline"
                onClick={() => this.setState({ hasError: false })}
              >
                Go to Homepage
              </Link>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-8 text-left bg-slate-900 rounded-lg p-4 overflow-x-auto shadow-inner">
                <p className="text-rose-400 font-mono text-sm font-semibold mb-2">{this.state.error.toString()}</p>
                <pre className="text-slate-300 font-mono text-xs whitespace-pre-wrap">
                  {this.state.errorInfo?.componentStack}
                </pre>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
