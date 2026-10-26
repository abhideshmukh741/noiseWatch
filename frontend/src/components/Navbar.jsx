/**
 * Navbar Component with Animated Curved Scoop Bubble Navigation
 * 
 * Features:
 * - Fluid curved cutout scoop matching user reference design
 * - Elevated floating circular bubble that pops up on the active tab
 * - Spring physics animation on tab transition
 * - Desktop header integration & mobile floating bottom navigation
 */

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CurvedNavbar } from './CurvedNavbar';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navTheme, setNavTheme] = useState('purple'); // 'purple' matching reference, 'emerald' matching NoiseWatch

  return (
    <>
      {/* ── Top Header Bar ── */}
      <nav className="sticky top-0 z-40 bg-[#f8fafc]/95 border-b border-[#e2e8f0] shadow-xs backdrop-blur-none">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 text-[#0f172a] no-underline group shrink-0">
              <span className="text-xl font-bold tracking-tight">
                Noise<span style={{ color: navTheme === 'purple' ? '#7c3aed' : '#059669' }}>Watch</span>
              </span>
              <span className="hidden lg:inline-block text-[11px] font-mono text-[#475569] border-l border-[#cbd5e1] pl-2 uppercase tracking-wider font-semibold">
                Acoustic Compliance
              </span>
            </Link>

            {/* ── Center: Animated Curved Scoop Bubble Navbar ── */}
            {isAuthenticated && (
              <div className="hidden md:flex items-center justify-center flex-1 max-w-lg mx-4 pt-3">
                <CurvedNavbar themeColor={navTheme} />
              </div>
            )}

            {/* Right Section: Theme Toggle, User Profile, Auth */}
            <div className="flex items-center gap-3 shrink-0">
              
              {/* Theme color pill switcher */}
              <button
                onClick={() => setNavTheme(navTheme === 'purple' ? 'emerald' : 'purple')}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border border-[#cbd5e1] bg-white text-[#475569] hover:bg-[#f1f5f9] transition-all"
                title="Toggle between Reference Purple and Botanical Emerald"
              >
                <span 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ backgroundColor: navTheme === 'purple' ? '#7c3aed' : '#059669' }} 
                />
                <span className="capitalize">{navTheme} Mode</span>
              </button>

              {/* Demo Badge */}
              <span className="demo-badge hidden xl:inline-flex">
                Demo Mode
              </span>

              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  {/* User Profile Info */}
                  <div className="hidden lg:flex flex-col text-right">
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
                    className="btn btn-secondary btn-sm text-xs py-1.5 px-3.5 font-semibold rounded-full"
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
          <div className="pointer-events-auto w-full max-w-sm">
            <CurvedNavbar themeColor={navTheme} />
          </div>
        </div>
      )}
    </>
  );
}
