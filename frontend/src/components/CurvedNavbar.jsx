/**
 * Curved Animated Scoop Navbar Component
 * 
 * Professional UI/UX Implementation:
 * - Single seamless SVG contour with mathematically calculated Bézier curve cutout
 * - Floating circular bubble with spring transition
 * - Zero background color mismatch or seam artifacts
 * - Beautiful drop-shadow and ambient elevation
 * - Vibrant color scheme matching reference image (#7c3aed Purple / #059669 Emerald)
 */

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

// Clean, balanced SVG icons matching reference image
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
    <path d="M3 10.5L12 3l9 7.5V20a1.5 1.5 0 01-1.5 1.5h-5a1 1 0 01-1-1v-5h-5v5a1 1 0 01-1 1h-5A1.5 1.5 0 013 20V10.5z" />
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

const HistoryChartIcon = ({ className = "w-5 h-5", active }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="currentColor"
  >
    <rect x="4" y="11" width="3.5" height="10" rx="1.5" opacity={active ? "1" : "0.7"} />
    <rect x="10.25" y="4" width="3.5" height="17" rx="1.5" />
    <rect x="16.5" y="13" width="3.5" height="8" rx="1.5" opacity={active ? "1" : "0.55"} />
  </svg>
);

const ReportsIcon = ({ className = "w-5 h-5", active }) => (
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
  </svg>
);

export const NAV_ITEMS = [
  { path: '/dashboard', label: 'Home', icon: HomeIcon },
  { path: '/map', label: 'Map', icon: MapIcon },
  { path: '/analytics', label: 'History', icon: HistoryChartIcon },
  { path: '/reports', label: 'Reports', icon: ReportsIcon },
];

export function CurvedNavbar({ isFloating = false }) {
  const location = useLocation();
  const currentPath = location.pathname;

  // Active tab index
  const activeIdx = Math.max(
    0,
    NAV_ITEMS.findIndex(item => item.path === currentPath || (item.path !== '/' && currentPath.startsWith(item.path)))
  );

  // Width & height dimensions of the navbar
  const totalWidth = 440;
  const height = 66;
  const itemWidth = totalWidth / NAV_ITEMS.length; // 110px per item
  
  // Calculate center X of the active tab
  const activeX = (activeIdx + 0.5) * itemWidth;

  // Smooth state transition for scoop center
  const [currentX, setCurrentX] = useState(activeX);

  useEffect(() => {
    setCurrentX(activeX);
  }, [activeX]);

  // Generate SVG path contour with smooth scooped Bézier dip at X
  const R = 22; // corner radius
  const scoopWidth = 44; // half-width of scoop (88px total width)
  const scoopDepth = 28; // depth of the scooped dip
  
  const pathD = `
    M ${R},0
    L ${Math.max(R, currentX - scoopWidth)},0
    C ${currentX - 22},0 ${currentX - 22},${scoopDepth} ${currentX},${scoopDepth}
    C ${currentX + 22},${scoopDepth} ${currentX + 22},0 ${Math.min(totalWidth - R, currentX + scoopWidth)},0
    L ${totalWidth - R},0
    A ${R},${R} 0 0 1 ${totalWidth},${R}
    L ${totalWidth},${height - R}
    A ${R},${R} 0 0 1 ${totalWidth - R},${height}
    L ${R},${height}
    A ${R},${R} 0 0 1 0,${height - R}
    L 0,${R}
    A ${R},${R} 0 0 1 ${R},0
    Z
  `;

  const ActiveIcon = NAV_ITEMS[activeIdx]?.icon || HomeIcon;

  return (
    <div className="relative select-none" style={{ width: `${totalWidth}px`, height: `${height + 24}px` }}>
      
      {/* ── Background SVG Contour with Drop Shadow ── */}
      <svg 
        width={totalWidth} 
        height={height} 
        viewBox={`0 0 ${totalWidth} ${height}`} 
        className="absolute top-6 left-0 transition-all duration-350 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
        style={{
          filter: 'drop-shadow(0 14px 28px rgba(15, 23, 42, 0.09)) drop-shadow(0 4px 10px rgba(15, 23, 42, 0.04))',
        }}
      >
        <path 
          d={pathD} 
          fill="#ffffff" 
          stroke="#e2e8f0" 
          strokeWidth="1"
          className="transition-all duration-350 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
        />
      </svg>

      {/* ── Elevated Floating Circular Bubble ── */}
      <div 
        className="absolute top-0 flex flex-col items-center pointer-events-none transition-all duration-350 ease-[cubic-bezier(0.34,1.56,0.64,1)] z-20"
        style={{
          left: `${currentX - 27}px`,
          width: '54px',
        }}
      >
        <div 
          className="w-[54px] h-[54px] rounded-full bg-white shadow-xl flex items-center justify-center border-4 border-[#f8fafc] text-[#7c3aed] transition-transform duration-300 transform hover:scale-105"
          style={{
            boxShadow: '0 10px 24px -2px rgba(124, 58, 237, 0.38), 0 4px 8px -2px rgba(124, 58, 237, 0.2)',
          }}
        >
          <ActiveIcon className="w-5 h-5 text-[#7c3aed]" active={true} />
        </div>
      </div>

      {/* ── Interactive Links Grid ── */}
      <div className="absolute top-6 left-0 w-full h-[66px] flex items-center z-10">
        {NAV_ITEMS.map((item, idx) => {
          const isActive = idx === activeIdx;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex-1 flex flex-col items-center justify-center h-full no-underline transition-all group"
              style={{ width: `${itemWidth}px` }}
            >
              {/* Inactive Icon (drops inside bar, fades out when active) */}
              <div 
                className={`transition-all duration-300 flex items-center justify-center ${
                  isActive ? 'opacity-0 -translate-y-3 pointer-events-none' : 'opacity-65 group-hover:opacity-100 translate-y-[-2px] text-[#64748b]'
                }`}
              >
                <Icon className="w-5 h-5" active={false} />
              </div>

              {/* Text Label Below */}
              <span 
                className={`text-[11px] font-bold tracking-tight transition-all duration-300 ${
                  isActive 
                    ? 'text-[#7c3aed] translate-y-2 font-extrabold scale-105' 
                    : 'text-[#64748b] group-hover:text-[#0f172a] translate-y-0'
                }`}
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
