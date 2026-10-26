/**
 * Navbar Component
 * Strict 3-Color Design System: Slate (#0f172a), Emerald (#059669), Amber (#d97706)
 * Zero icons, interactive animated sound equalizer, and clean light styling.
 */

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navLinks = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/map', label: 'Monitoring Map' },
  { path: '/analytics', label: 'Analytics' },
  { path: '/reports', label: 'Reports & Complaints' },
];

const adminLinks = [
  { path: '/admin', label: 'Admin Panel' },
];

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const allLinks = isAdmin ? [...navLinks, ...adminLinks] : navLinks;

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-[#e2e8f0] shadow-xs">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Pure Typography Logo (Zero Icons) */}
          <Link to="/" className="flex items-center gap-2.5 text-[#0f172a] no-underline group">
            <span className="text-xl font-bold tracking-tight">
              Noise<span className="text-[#059669]">Watch</span>
            </span>
            <span className="hidden sm:inline-block text-[11px] font-mono text-[#475569] border-l border-[#cbd5e1] pl-2 uppercase tracking-wider font-semibold">
              Acoustic Compliance
            </span>
          </Link>

          {/* Desktop Nav Links */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center gap-1.5 bg-[#f1f5f9] p-1 rounded-full border border-[#e2e8f0]">
              {allLinks.map(({ path, label }) => {
                const isActive = location.pathname === path;
                return (
                  <Link
                    key={path}
                    to={path}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all no-underline ${
                      isActive
                        ? 'text-[#059669] bg-white border border-[#a7f3d0] shadow-xs'
                        : 'text-[#475569] hover:text-[#0f172a] hover:bg-white/60'
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Demo Badge */}
            <span className="demo-badge hidden sm:inline-flex">
              Demo Mode
            </span>

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                {/* User Info */}
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-xs font-bold text-[#0f172a]">
                    {user?.display_name || 'User'}
                  </span>
                  <span className="text-[10px] text-[#475569] uppercase tracking-wider font-mono font-semibold">
                    {user?.role || 'user'}
                  </span>
                </div>

                {/* Logout Button */}
                <button
                  onClick={logout}
                  className="btn btn-secondary btn-sm text-xs py-1.5 px-4 font-semibold rounded-full"
                  aria-label="Logout"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn btn-secondary btn-sm text-xs rounded-full">Login</Link>
                <Link to="/register" className="btn btn-primary btn-sm text-xs rounded-full">Sign Up</Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden px-3 py-1.5 rounded-full text-xs font-semibold text-[#475569] hover:bg-[#f1f5f9] border border-[#cbd5e1]"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-navigation"
            >
              {mobileOpen ? 'Close' : 'Menu'}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileOpen && (
          <div id="mobile-navigation" className="md:hidden py-3 px-2 border border-[#e2e8f0] rounded-2xl bg-white shadow-lg space-y-1 my-2 animate-fade-in">
            {isAuthenticated && allLinks.map(({ path, label }) => (
              <Link
                key={path}
                to={path}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-2 rounded-full text-xs font-semibold no-underline ${
                  location.pathname === path
                    ? 'text-[#059669] bg-[#ecfdf5]'
                    : 'text-[#475569] hover:bg-[#f1f5f9]'
                }`}
              >
                {label}
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
  );
}
