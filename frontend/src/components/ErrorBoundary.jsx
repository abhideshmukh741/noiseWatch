/**
 * ErrorBoundary Component (Icon-free, clean light theme).
 */

import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('NoiseWatch Client Runtime Error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 text-center space-y-4 border-[#fecaca] bg-white">
            <span className="inline-block px-3 py-1 rounded bg-[#fef2f2] text-[#dc2626] font-mono text-xs font-semibold uppercase">
              Notice
            </span>

            <div>
              <h2 className="text-lg font-bold text-[#0f172a]">
                Acoustic Interface Interrupted
              </h2>
              <p className="text-xs text-[#64748b] mt-1">
                An unexpected client-side error was caught safely. Underlying sensor data remains protected.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 rounded bg-[#f8fafc] border border-[#e2e8f0] text-left font-mono text-[10px] text-[#dc2626] overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="btn btn-primary btn-sm text-xs"
              >
                Reload View
              </button>
              <button
                onClick={this.handleGoHome}
                className="btn btn-secondary btn-sm text-xs"
              >
                Return Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
