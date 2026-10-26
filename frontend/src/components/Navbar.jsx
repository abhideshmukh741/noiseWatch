/**
 * Navbar Component with Animated Curved Scoop Bubble Navigation
 * 
 * Professional UI/UX Refinement:
 * - Proper vertical clearance (88px) so the raised circular bubble floats with ample breathing room
 * - Unified single-contour SVG background with zero seam artifacts
 * - Clean brand mark and minimalist user status area (no visual clutter)
 * - Responsive: centered desktop integration + floating bottom dock on mobile
 */

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CurvedNavbar } from './CurvedNavbar';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* ── Top Header Bar ── */}
      <nav className="sticky top-0 z-40 bg-[#f8fafc]/95 border-b border-[#e2e8f0]/80">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[88px]">

            {/* Brand Logo */}
            <Link to="/" className="flex items-center gap-2.5 text-[#0f172a] no-underline group shrink-0">
              <span className="text-xl font-bold tracking-tight">
                Noise<span className="text-[#7c3aed]">Watch</span>
              </span>
              <span className="hidden xl:inline-block text-[11px] font-mono text-[#64748b] border-l border-[#cbd5e1] pl-2 uppercase tracking-wider font-semibold">
                Acoustic Compliance
              </span>
            </Link>

            {/* ── Center: Precision Curved Scoop Bubble Navigation ── */}
            {isAuthenticated && (
              <div className="hidden md:flex items-center justify-center flex-1 max-w-lg mx-auto">
                <CurvedNavbar />
              </div>
            )}

            {/* Right Section: Status, Profile & Actions */}
            <div className="flex items-center gap-3 shrink-0">
              
              {/* Status Badge */}
              <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#e2e8f0] text-xs font-medium text-[#475569] shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
                <span className="text-[11px] font-mono font-semibold">CPCB Network</span>
              </div>

              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  {/* User Profile Pill */}
                  <div className="hidden sm:flex items-center gap-2 bg-white border border-[#e2e8f0] px-3 py-1 rounded-full shadow-2xs">
                    <div className="w-6 h-6 rounded-full bg-[#f5f3ff] text-[#7c3aed] font-bold text-xs flex items-center justify-center border border-[#ddd6fe]">
                      {(user?.display_name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-bold text-[#0f172a]">
                      {user?.display_name || 'Demo User'}
                    </span>
                  </div>

                  {/* Logout Button */}
                  <button
                    onClick={logout}
                    className="btn btn-secondary btn-sm text-xs py-1.5 px-3.5 font-semibold rounded-full hover:bg-[#fee2e2] hover:text-[#dc2626] hover:border-[#fca5a5] transition-colors"
                    aria-label="Logout"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="btn btn-secondary btn-sm text-xs rounded-full">Login</Link>
                  <Link to="/register" className="btn btn-primary btn-sm text-xs rounded-full bg-[#7c3aed] hover:bg-[#6d28d9] border-[#7c3aed]">Sign Up</Link>
                </div>
              )}

              {/* Mobile Quick Dropdown Toggle */}
              <button
                className="md:hidden px-3 py-1.5 rounded-full text-xs font-semibold text-[#475569] hover:bg-[#f1f5f9] border border-[#cbd5e1]"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? 'Close' : 'Menu'}
              </button>
            </div>

          </div>

          {/* Mobile Fallback Dropdown */}
          {mobileOpen && (
            <div className="md:hidden py-3 px-2 border border-[#e2e8f0] rounded-2xl bg-white shadow-lg space-y-1 my-2">
              {['/dashboard', '/map', '/analytics', '/reports'].map((p) => (
                <Link
                  key={p}
                  to={p}
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-2 rounded-full text-xs font-semibold text-[#475569] hover:bg-[#f1f5f9]"
                >
                  {p.replace('/', '').toUpperCase()}
                </Link>
              ))}
              {isAuthenticated && (
                <button
                  onClick={() => { logout(); setMobileOpen(false); }}
                  className="block w-full text-left px-4 py-2 text-xs font-semibold text-[#b45309] hover:bg-[#fef3c7] rounded-full"
                >
                  Logout
                </button>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* ── Mobile Floating Curved Scoop Bottom Navigation ── */}
      {isAuthenticated && (
        <div className="fixed bottom-4 inset-x-0 z-50 flex justify-center px-3 md:hidden pointer-events-none">
          <div className="pointer-events-auto">
            <CurvedNavbar isFloating={true} />
          </div>
        </div>
      )}
    </>
  );
}
