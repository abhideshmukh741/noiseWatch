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
    <div className="min-h-screen bg-[#f8fafc] p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto space-y-6">
      
      {/* ── Page Header ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#e2e8f0]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0f172a]">
            Acoustic Analytics & Trend Intelligence
          </h1>
          <p className="text-xs text-[#475569] mt-1">
            Historical distribution, statutory exceedance durations, and comparative site benchmarks
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Curvy Time range switcher */}
          <div className="flex rounded-full bg-[#f1f5f9] border border-[#e2e8f0] p-1 text-xs">
            {['24h', '7d', '30d'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-1 rounded-full font-medium transition-all ${
                  timeRange === range
                    ? 'bg-[#059669] text-white font-semibold shadow-xs'
                    : 'text-[#475569] hover:text-[#0f172a]'
                }`}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Export CSV button */}
          <button
            onClick={handleExportCSV}
            className="btn btn-secondary btn-sm text-xs font-semibold px-4 py-1.5 rounded-full"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* ── Provenance Notice ─────────────────────────────────────── */}
      <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs border border-[#e2e8f0]">
        <div className="text-[#475569]">
          <strong className="text-[#0f172a]">Data Provenance:</strong> 84% IoT Sensor Network • 12% Calibrated Samples • 4% Browser Screening
        </div>
        <span className="badge-emerald text-[11px]">
          Completeness: 99.4%
        </span>
      </div>

      {/* ── High-Level Summary Stats ──────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* ── Hourly Diurnal Trend Line Chart ──────────────────────── */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-[#0f172a]">
              Diurnal Sound Pressure Curves (Day vs Night Profile)
            </h3>
            <p className="text-xs text-[#475569] mt-0.5">
              Comparing average residential and commercial acoustic trajectories over 24 hours
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono font-medium">
            <span className="flex items-center gap-1.5 text-[#059669]">
              <span className="w-3 h-1 bg-[#059669] inline-block rounded-full" />
              Residential Zone
            </span>
            <span className="flex items-center gap-1.5 text-[#334155]">
              <span className="w-3 h-1 bg-[#334155] inline-block rounded-full" />
              Commercial Zone
            </span>
            <span className="flex items-center gap-1.5 text-[#d97706]">
              <span className="w-3 h-0.5 bg-[#d97706] inline-block border-t border-dashed" />
              Statutory Limit (55 dB)
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={hourlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis domain={[30, 80]} unit=" dB" stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  borderColor: '#cbd5e1',
                  borderRadius: '16px',
                  boxShadow: '0 8px 20px -4px rgba(15, 23, 42, 0.1)',
                  fontSize: '12px'
                }} 
              />
              <ReferenceLine y={55} stroke="#d97706" strokeDasharray="3 3" label={{ value: 'Day Limit 55dB', fill: '#d97706', fontSize: 10, position: 'right' }} />
              <Line type="monotone" dataKey="residential" stroke="#059669" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="commercial" stroke="#334155" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Multi-Location Benchmark Bar Chart ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Average vs Peak Chart */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl">
          <div className="mb-6">
            <h3 className="text-base font-bold text-[#0f172a]">
              Site Benchmark: Average vs Peak Sound Levels
            </h3>
            <p className="text-xs text-[#475569] mt-0.5">
              Comparing equivalent energy (LAeq) against max instantaneous levels (Lmax)
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={locationComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#64748b" />
                <YAxis domain={[30, 100]} unit=" dB" stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    borderColor: '#cbd5e1',
                    borderRadius: '16px',
                    boxShadow: '0 8px 20px -4px rgba(15, 23, 42, 0.1)',
                    fontSize: '12px'
                  }} 
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="avg" name="Avg LAeq" fill="#059669" radius={[8, 8, 0, 0]} />
                <Bar dataKey="peak" name="Peak Lmax" fill="#d97706" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Exceedance Duration Table & Analysis */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl flex flex-col justify-between">
          <div>
            <div className="mb-4">
              <h3 className="text-base font-bold text-[#0f172a]">
                Exceedance Duration Analysis
              </h3>
              <p className="text-xs text-[#475569] mt-0.5">
                Total minutes recorded above the configured regulatory threshold
              </p>
            </div>

            <div className="space-y-3">
              {locationComparisonData.map((loc) => (
                <div key={loc.name} className="p-4 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] text-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-[#0f172a]">{loc.name}</span>
                    <span className="font-mono font-bold text-[#b45309] bg-[#fef3c7] px-2.5 py-0.5 rounded-full border border-[#fde68a]">{loc.exceedanceMins} mins</span>
                  </div>
                  {/* Progress bar with smooth curves */}
                  <div className="w-full bg-[#e2e8f0] h-2.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${loc.exceedanceMins > 60 ? 'bg-[#d97706]' : 'bg-[#059669]'}`}
                      style={{ width: `${Math.min((loc.exceedanceMins / 150) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-[11px] text-[#475569]">
                    <span>Threshold: {loc.limit} dB(A)</span>
                    <span className="font-medium text-[#0f172a]">Peak: {loc.peak} dB(A)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-[#e2e8f0] text-[11px] text-[#475569] italic">
            Continuous duration exceeding 30 minutes triggers automated review alerts.
          </div>
        </div>
      </div>
    </div>
  );
}
