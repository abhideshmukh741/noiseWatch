/**
 * NoiseWatch Navbar
 * Designed with Qwilr minimalist typography & color system:
 * - Brand logo: Geometric delta mark + bold NoiseWatch title
 * - Clean unified navigation: HOME, DASHBOARD, MAP, HISTORY, REPORTS
 * - Active tab indicators with Teal (#00a88f) accent
 * - Outlined 'LOGIN' button & high-contrast solid teal 'TRY IT FREE →' CTA
 * - Clean user profile & logout without redundant duplicate bars or buttons
 */

import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  // Auto-hide navbar when scrolling down; smoothly reveal when scrolling up or at top
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY || document.documentElement.scrollTop;

      // Always show when near the top
      if (currentScrollY <= 20) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY.current && currentScrollY > 60) {
        // Scrolling DOWN -> vanish navbar out of sight
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY.current) {
        // Scrolling UP -> smoothly slide back into view
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Ensure navbar is visible and mobile menu closed on page change
  useEffect(() => {
    setIsVisible(true);
    setMobileOpen(false);
  }, [location.pathname]);

  const NAV_LINKS = [
    { label: 'HOME', path: '/' },
    { label: 'DASHBOARD', path: '/dashboard' },
    { label: 'MAP', path: '/map' },
    { label: 'HISTORY', path: '/analytics' },
    { label: 'REPORTS', path: '/reports' },
  ];

  return (
    <nav 
      className={`sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#e5e9f2] transition-transform duration-300 ease-in-out ${
        isVisible || mobileOpen ? 'translate-y-0' : '-translate-y-full pointer-events-none'
      }`}
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex items-center justify-between h-[76px]">

          {/* Brand Logo - Pure Typography (Icon-Free) */}
          <Link to="/" className="flex items-center no-underline group shrink-0">
            <span className="text-2xl font-black tracking-tight text-[#1e2430]">
              Noise<span className="text-[#00a88f]">Watch</span>
            </span>
          </Link>

          {/* Center: Desktop Navigation Links (Smooth Animated Indicator, Zero Shift) */}
          <div className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="relative py-2.5 px-0.5 text-xs font-bold tracking-widest uppercase transition-colors duration-200 no-underline group"
                >
                  <span className={`transition-colors duration-200 ${
                    isActive ? 'text-[#00a88f]' : 'text-[#58647a] group-hover:text-[#1e2430]'
                  }`}>
                    {item.label}
                  </span>
                  
                  {/* Smooth Animated Active Underline Bar */}
                  <span
                    className={`absolute bottom-0 left-0 w-full h-[2.5px] rounded-full transition-all duration-300 ease-out pointer-events-none ${
                      isActive
                        ? 'bg-[#00a88f] opacity-100 scale-x-100'
                        : 'bg-[#00a88f] opacity-0 scale-x-0 group-hover:opacity-40 group-hover:scale-x-75'
                    }`}
                  />
                </Link>
              );
            })}
          </div>

          {/* Right Action Buttons - Fixed Constant Width (Zero Layout Shift) */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                {/* User Profile Pill */}
                <div className="flex items-center gap-2 bg-[#f8fafc] border border-[#e5e9f2] px-3.5 py-1.5 rounded-sm">
                  <span className="w-2 h-2 rounded-full bg-[#00a88f] animate-pulse" />
                  <span className="text-xs font-bold text-[#1e2430]">
                    {user?.display_name || 'Demo User'}
                  </span>
                  <span className="text-[10px] uppercase font-mono font-bold text-[#8c97a8] border-l border-[#cbd5e1] pl-2">
                    {user?.role || 'Citizen'}
                  </span>
                </div>

                {/* Logout Button */}
                <button 
                  onClick={logout} 
                  className="btn-qwilr-outline text-[11px] py-1.5 px-3 text-[#58647a] hover:text-[#ff5757] hover:border-[#ff5757] hover:bg-[#fff0f0] transition-colors"
                  aria-label="Logout"
                >
                  LOGOUT
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="btn-qwilr-outline">
                  LOGIN
                </Link>
                <Link to="/dashboard" className="btn-qwilr-teal">
                  TRY IT FREE &rarr;
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 text-[#58647a] hover:text-[#1e2430] cursor-pointer"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle mobile menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

        </div>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div className="lg:hidden py-4 border-t border-[#e5e9f2] space-y-2 bg-white">
            {NAV_LINKS.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link 
                  key={item.path}
                  to={item.path} 
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2 text-xs font-bold uppercase transition-colors ${
                    isActive 
                      ? 'text-[#00a88f] bg-[#f0fdfa] rounded-sm' 
                      : 'text-[#58647a] hover:text-[#00a88f]'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}

      </div>
    </nav>
  );
}
