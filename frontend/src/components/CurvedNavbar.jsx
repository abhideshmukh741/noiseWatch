/**
 * Curved Animated Scoop Navbar Component
 * 
 * Implements the curved cutout bubble navigation bar inspired by modern mobile UI:
 * - Fluid scooped curve cutout on the active tab
 * - Floating circular bubble that pops up with spring physics
 * - Smooth SVG Bézier transition on route change
 * - Dual color mode: Vibrant Purple (#7c3aed) matching reference design + Botanical Emerald (#059669)
 */

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

// Clean inline SVGs matching the reference image icons
const HomeIcon = ({ className = "w-5 h-5", active }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill={active ? "currentColor" : "none"} 
    stroke="currentColor" 
    strokeWidth={active ? "2" : "2"}
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1V9.5z" />
  </svg>
);

const ChartIcon = ({ className = "w-5 h-5", active }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="currentColor"
  >
    <rect x="4" y="10" width="3.5" height="11" rx="1.5" opacity={active ? "1" : "0.75"} />
    <rect x="10.25" y="4" width="3.5" height="17" rx="1.5" />
    <rect x="16.5" y="13" width="3.5" height="8" rx="1.5" opacity={active ? "1" : "0.6"} />
  </svg>
);

const MapIcon = ({ className = "w-5 h-5", active }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill={active ? "currentColor" : "none"} 
    stroke="currentColor" 
    strokeWidth="2"
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
    <line x1="8" y1="2" x2="8" y2="18" />
    <line x1="16" y1="6" x2="16" y2="22" />
  </svg>
);

const DocumentIcon = ({ className = "w-5 h-5", active }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill={active ? "currentColor" : "none"} 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const UserIcon = ({ className = "w-5 h-5", active }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill={active ? "currentColor" : "none"} 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export const NAV_ITEMS = [
  { path: '/dashboard', label: 'Home', icon: HomeIcon },
  { path: '/map', label: 'Map', icon: MapIcon },
  { path: '/analytics', label: 'History', icon: ChartIcon },
  { path: '/reports', label: 'Reports', icon: DocumentIcon },
];

export function CurvedNavbar({ themeColor = 'purple' }) {
  const location = useLocation();
  const currentPath = location.pathname;

  // Find active index based on route
  const activeIdx = Math.max(
    0,
    NAV_ITEMS.findIndex(item => item.path === currentPath || (item.path !== '/' && currentPath.startsWith(item.path)))
  );

  const activeItem = NAV_ITEMS[activeIdx] || NAV_ITEMS[0];
  const ActiveIcon = activeItem.icon;

  // Theme styling (purple matches reference image; emerald matches NoiseWatch)
  const isPurple = themeColor === 'purple';
  const accentColor = isPurple ? '#7c3aed' : '#059669';
  const accentLight = isPurple ? '#f5f3ff' : '#ecfdf5';

  return (
    <div className="relative w-full max-w-xl mx-auto py-3 px-4">
      
      {/* ── Main Curved Navigation Card ── */}
      <div className="relative bg-white rounded-[2.5rem] shadow-xl border border-[#e2e8f0]/80 h-[72px] flex items-center justify-around px-2">
        
        {/* ── Floating Scoop & Bubble (Spring Animated) ── */}
        <div 
          className="absolute -top-6 flex flex-col items-center pointer-events-none transition-all duration-350 ease-[cubic-bezier(0.34,1.56,0.64,1)] z-20"
          style={{
            left: `calc(${(activeIdx * 100) / NAV_ITEMS.length}% + ${50 / NAV_ITEMS.length}% - 44px)`,
            width: '88px',
          }}
        >
          {/* SVG Scoop Cutout that perfectly matches background */}
          <div className="absolute top-[26px] w-[88px] h-[32px] overflow-hidden">
            <svg 
              width="88" 
              height="32" 
              viewBox="0 0 88 32" 
              fill="none" 
              className="w-full h-full"
            >
              <path
                d="M 0 0 C 18 0 24 30 44 30 C 64 30 70 0 88 0 L 88 32 L 0 32 Z"
                fill="#f8fafc"
              />
            </svg>
          </div>

          {/* Elevated Circular Bubble with Active Icon */}
          <div 
            className="w-14 h-14 rounded-full bg-white shadow-xl flex items-center justify-center border-4 border-[#f8fafc] z-30 transition-transform duration-300 transform scale-100 hover:scale-105"
            style={{
              boxShadow: isPurple 
                ? '0 10px 25px -4px rgba(124, 58, 237, 0.35), 0 4px 10px -2px rgba(124, 58, 237, 0.2)'
                : '0 10px 25px -4px rgba(5, 150, 105, 0.35), 0 4px 10px -2px rgba(5, 150, 105, 0.2)',
            }}
          >
            <ActiveIcon 
              className="w-6 h-6 transition-colors duration-200" 
              style={{ color: accentColor }}
              active={true}
            />
          </div>
        </div>

        {/* ── Navigation Items ── */}
        {NAV_ITEMS.map((item, idx) => {
          const isActive = idx === activeIdx;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative flex-1 flex flex-col items-center justify-center h-full no-underline transition-all group z-10"
            >
              {/* Inactive Icon (drops down into bar when not active, fades out when active) */}
              <div 
                className={`transition-all duration-300 flex items-center justify-center ${
                  isActive ? 'opacity-0 -translate-y-4 pointer-events-none' : 'opacity-70 group-hover:opacity-100 translate-y-0 text-[#64748b]'
                }`}
              >
                <Icon className="w-5 h-5" active={false} />
              </div>

              {/* Text Label Below */}
              <span 
                className={`text-xs font-bold transition-all duration-300 mt-1 ${
                  isActive 
                    ? 'translate-y-2.5 font-extrabold' 
                    : 'text-[#64748b] group-hover:text-[#0f172a]'
                }`}
                style={{
                  color: isActive ? accentColor : undefined,
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}

      </div>
    </div>
  );
}

export default CurvedNavbar;
