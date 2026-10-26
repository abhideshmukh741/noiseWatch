/**
 * Page D: Analytics Page
 * 
 * In-depth acoustic analytics, hourly/daily/monthly trend charts,
 * exceedance duration counters, multi-location comparison bar charts,
 * CSV export, and explicit data provenance indicators.
 * Clean, light environmental design without icons or glassmorphism.
 */

import { useState } from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend, ReferenceLine 
} from 'recharts';
import StatCard from '../components/StatCard';

// Synthetic multi-location comparison data
const locationComparisonData = [
  { name: 'Riverside Res. A', avg: 51.4, peak: 74.2, limit: 55, exceedanceMins: 42 },
  { name: 'Central Comm. Sq.', avg: 62.8, peak: 82.5, limit: 65, exceedanceMins: 95 },
  { name: 'Green Valley Res.', avg: 44.1, peak: 56.8, limit: 55, exceedanceMins: 10 },
  { name: 'Industrial Hub 4', avg: 69.5, peak: 91.2, limit: 75, exceedanceMins: 120 },
  { name: 'Hospital Silent Z.', avg: 41.2, peak: 58.4, limit: 50, exceedanceMins: 25 },
];

// 24-hour diurnal curve (night dip, rush-hour peaks)
const hourlyTrendData = [
  { hour: '00:00', residential: 42, commercial: 48, threshold: 45 },
  { hour: '02:00', residential: 39, commercial: 45, threshold: 45 },
  { hour: '04:00', residential: 41, commercial: 46, threshold: 45 },
  { hour: '06:00', residential: 49, commercial: 54, threshold: 55 },
  { hour: '08:00', residential: 58, commercial: 66, threshold: 55 },
  { hour: '10:00', residential: 54, commercial: 64, threshold: 55 },
  { hour: '12:00', residential: 53, commercial: 65, threshold: 55 },
  { hour: '14:00', residential: 55, commercial: 63, threshold: 55 },
  { hour: '16:00', residential: 57, commercial: 67, threshold: 55 },
  { hour: '18:00', residential: 62, commercial: 71, threshold: 55 },
  { hour: '20:00', residential: 56, commercial: 64, threshold: 55 },
  { hour: '22:00', residential: 48, commercial: 55, threshold: 45 },
];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('24h');

  // Export CSV summary function
  const handleExportCSV = () => {
    const headers = 'Site Name,Average LAeq (dBA),Peak Level (dBA),Statutory Limit (dBA),Exceedance Duration (Mins),Data Quality\n';
    const rows = locationComparisonData
      .map((d) => `"${d.name}",${d.avg},${d.peak},${d.limit},${d.exceedanceMins},"Verified/Simulated"`)
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `NoiseWatch_Analytics_${timeRange}_Export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto space-y-8">
      
      {/* ── Architectural Header & Time Capsule ─────────────────────── */}
      <div className="bg-white border border-[#e2e8f0] p-6 sm:p-8 rounded-tl-[48px] rounded-br-[48px] rounded-tr-2xl rounded-bl-2xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e6f7f4] border border-[#a7f3d0] text-[#00a88f] text-[10px] font-bold tracking-widest uppercase mb-2">
            Acoustic Telemetry Intelligence
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1e2430]">
            Acoustic Analytics & Trend Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-[#58647a] mt-1 max-w-xl">
            Diurnal sound pressure profiles, cumulative exceedance durations, and statutory municipal compliance benchmarks under CPCB Schedule III.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Stadium Time Range Capsule */}
          <div className="flex rounded-full bg-[#f1f5f9] border border-[#e2e8f0] p-1.5 text-xs">
            {['24h', '7d', '30d'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-1.5 rounded-full font-bold transition-all duration-200 ${
                  timeRange === range
                    ? 'bg-[#1e2430] text-white shadow-xs'
                    : 'text-[#58647a] hover:text-[#1e2430]'
                }`}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Export CSV Stadium Button */}
          <button
            onClick={handleExportCSV}
            className="px-5 py-2.5 rounded-full text-xs font-bold bg-[#00a88f] hover:bg-[#008f7a] text-white shadow-xs transition-colors"
          >
            Export CSV Dataset
          </button>
        </div>
      </div>

      {/* ── Provenance Banner (Stadium Pill) ────────────────────────── */}
      <div className="bg-white border border-[#e2e8f0] px-6 py-3.5 rounded-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs">
        <div className="text-[#58647a] flex flex-wrap items-center gap-2">
          <strong className="text-[#1e2430] font-bold">Data Provenance:</strong>
          <span>84% Continuous IoT Grid</span>
          <span>•</span>
          <span>12% Sound Level Meter Calibrations</span>
          <span>•</span>
          <span>4% Citizen Node Screenings</span>
        </div>
        <span className="inline-flex items-center px-3.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#e6f7f4] text-[#00a88f] border border-[#a7f3d0]">
          Completeness: 99.4%
        </span>
      </div>

      {/* ── High-Level Summary Stats with .stat-card-delight ──────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Network Peak Exceedance"
          value="91.2"
          unit="dB(A)"
          trend={+4.2}
          trendLabel="Industrial Zone 4"
          badge="Critical"
        />
        <StatCard
          title="Cumulative Exceedance Time"
          value="292"
          unit="Minutes"
          trend={-12.0}
          trendLabel="vs previous cycle"
        />
        <StatCard
          title="Statutory Compliance Index"
          value="88.6%"
          unit="Within Limits"
          trend={+1.5}
          trendLabel="Network-wide"
          accent={true}
        />
        <StatCard
          title="Active Monitoring Coverage"
          value="5 / 5"
          unit="Sites Active"
          trend={0}
          trendLabel="Zero sensor dropouts"
        />
      </div>

      {/* ── Hourly Diurnal Trend Line Chart (Cathedral Arch Portal) ─── */}
      <div className="shape-arch bg-white border border-[#e2e8f0] p-6 sm:p-10 shadow-sm card-hover-interactive">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#f1f5f9] text-[#1e2430] border border-[#e2e8f0] mb-2">
              Diurnal Trajectory
            </span>
            <h3 className="text-xl font-bold text-[#1e2430] tracking-tight">
              Sound Pressure Curves (24-Hour Day vs Night Profile)
            </h3>
            <p className="text-xs text-[#58647a] mt-1">
              Equivalent continuous acoustic pressure compared against CPCB statutory limits (06:00 to 22:00 vs 22:00 to 06:00).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono font-medium bg-[#f8fafc] px-4 py-2.5 rounded-full border border-[#e2e8f0]">
            <span className="flex items-center gap-1.5 text-[#00a88f]">
              <span className="w-3 h-1 bg-[#00a88f] inline-block rounded-full" />
              Residential Zone
            </span>
            <span className="flex items-center gap-1.5 text-[#1e2430]">
              <span className="w-3 h-1 bg-[#1e2430] inline-block rounded-full" />
              Commercial Zone
            </span>
            <span className="flex items-center gap-1.5 text-[#ff5757]">
              <span className="w-3 h-0.5 bg-[#ff5757] inline-block border-t border-dashed" />
              Statutory Limit (55 dB)
            </span>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={hourlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="hour" stroke="#58647a" tick={{ fontSize: 11 }} />
              <YAxis domain={[30, 80]} unit=" dB" stroke="#58647a" tick={{ fontSize: 11 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  borderColor: '#e2e8f0',
                  borderRadius: '16px',
                  boxShadow: '0 8px 24px -4px rgba(30, 36, 48, 0.12)',
                  fontSize: '12px',
                  fontFamily: 'inherit'
                }} 
              />
              <ReferenceLine y={55} stroke="#ff5757" strokeDasharray="3 3" label={{ value: 'Day Limit 55dB', fill: '#ff5757', fontSize: 10, position: 'right' }} />
              <Line type="monotone" dataKey="residential" stroke="#00a88f" strokeWidth={3} dot={{ r: 3, fill: '#00a88f' }} />
              <Line type="monotone" dataKey="commercial" stroke="#1e2430" strokeWidth={3} dot={{ r: 3, fill: '#1e2430' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Multi-Location Benchmark & Exceedance Grid (Non-Cube) ───── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* Average vs Peak Chart: Asymmetric Organic Pebble (`shape-pebble-1`) */}
        <div className="shape-pebble-1 bg-white border border-[#e2e8f0] p-6 sm:p-8 shadow-sm card-hover-interactive">
          <div className="mb-6">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#f1f5f9] text-[#1e2430] border border-[#e2e8f0] mb-2">
              Cross-Site Comparison
            </span>
            <h3 className="text-xl font-bold text-[#1e2430] tracking-tight">
              Average LAeq vs Peak Lmax Sound Levels
            </h3>
            <p className="text-xs text-[#58647a] mt-1">
              Comparing equivalent energy (LAeq) against maximum instantaneous peaks registered across stations.
            </p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={locationComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#58647a" />
                <YAxis domain={[30, 100]} unit=" dB" stroke="#58647a" tick={{ fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    borderColor: '#e2e8f0',
                    borderRadius: '16px',
                    boxShadow: '0 8px 24px -4px rgba(30, 36, 48, 0.12)',
                    fontSize: '12px'
                  }} 
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="avg" name="Avg LAeq" fill="#00a88f" radius={[8, 8, 0, 0]} />
                <Bar dataKey="peak" name="Peak Lmax" fill="#ff5757" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Exceedance Duration Analysis: Inverted Arch Portal (`shape-arch-inverted`) */}
        <div className="shape-arch-inverted bg-white border border-[#e2e8f0] p-6 sm:p-8 shadow-sm card-hover-interactive flex flex-col justify-between space-y-6">
          <div>
            <div className="mb-6">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#e6f7f4] text-[#00a88f] border border-[#a7f3d0] mb-2">
                CPCB Rule 4(1) Analysis
              </span>
              <h3 className="text-xl font-bold text-[#1e2430] tracking-tight">
                Exceedance Duration Breakdown
              </h3>
              <p className="text-xs text-[#58647a] mt-1">
                Cumulative minutes recorded beyond the configured regulatory baseline.
              </p>
            </div>

            <div className="space-y-4">
              {locationComparisonData.map((loc) => (
                <div key={loc.name} className="p-4 sm:p-5 rounded-3xl bg-[#f8fafc] border border-[#e2e8f0] text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#1e2430]">{loc.name}</span>
                    <span className={`font-mono font-bold text-xs px-3 py-1 rounded-full border ${
                      loc.exceedanceMins > 60 
                        ? 'bg-[#ffebee] text-[#ff5757] border-[#ffcdd2]' 
                        : 'bg-[#e6f7f4] text-[#00a88f] border-[#a7f3d0]'
                    }`}>
                      {loc.exceedanceMins} mins
                    </span>
                  </div>
                  
                  {/* Stadium Progress meter */}
                  <div className="w-full bg-[#e2e8f0] h-3 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        loc.exceedanceMins > 60 ? 'bg-[#ff5757]' : 'bg-[#00a88f]'
                      }`}
                      style={{ width: `${Math.min((loc.exceedanceMins / 150) * 100, 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#58647a] pt-1">
                    <span>Threshold: {loc.limit} dB(A)</span>
                    <span className="font-mono font-bold text-[#1e2430]">Peak: {loc.peak} dB(A)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-[#e2e8f0] text-[11px] text-[#58647a] italic">
            Continuous duration exceeding 30 minutes triggers automated review alerts and compliance dossier compilation.
          </div>
        </div>
      </div>
    </div>
  );
}
