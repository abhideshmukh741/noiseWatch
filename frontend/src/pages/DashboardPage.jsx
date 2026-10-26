/**
 * Page B: Monitoring Dashboard
 * Strict 3-Color Design System: Slate (#0f172a), Emerald (#059669), Amber (#d97706)
 * Real-time audio waveform visualizer, responsive decibel gauge,
 * 24-hour compliance trend chart, and incident review triage.
 */

import { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { Link } from 'react-router-dom';
import StatCard from '../components/StatCard';
import WaveformVisualizer from '../components/WaveformVisualizer';
import { AcousticModelCard } from '../components/AcousticModelCard';
import { MobileNoiseDetector } from '../components/MobileNoiseDetector';
import { useAudioMonitor } from '../hooks/useAudioMonitor';
import { dashboardAPI, readingsAPI } from '../services/api';

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [selectedLocation] = useState('loc-demo-001');

  const {
    isMonitoring,
    currentDb,
    peakDb,
    averageDb,
    mode,
    waveformData,
    measurementQuality,
    startMicrophone,
    startSimulation,
    toggleMonitoring,
    resetPeak,
  } = useAudioMonitor();

  useEffect(() => {
    async function loadData() {
      try {
        const [sumRes, readRes] = await Promise.all([
          dashboardAPI.getSummary(),
          readingsAPI.list({ location_id: selectedLocation, hours: 24 }),
        ]);

        setSummary(sumRes.data);

        const formatted = (readRes.data.items || []).map((item) => ({
          time: item.timestamp ? item.timestamp.substring(11, 16) : '00:00',
          value: item.value,
          threshold: item.threshold_value || 55.0,
          quality: item.quality_status,
          method: item.measurement_method,
        })).slice(-24);

        setChartData(formatted);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      }
    }
    loadData();
  }, [selectedLocation]);

  const getDbStatusColor = (val) => {
    if (val >= 55) return 'text-[#d97706]';
    return 'text-[#059669]';
  };

  const getDbBorderColor = (val) => {
    if (val >= 55) return 'border-t-4 border-t-[#d97706]';
    return 'border-t-4 border-t-[#059669]';
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto space-y-6">
      
      {/* ── Demo Notice Banner ── */}
      <div className="glass-card p-5 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-[#fde68a] bg-[#fffbeb] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="demo-badge">
              Demo Mode Active
            </span>
            <span className="text-xs font-bold text-[#b45309]">
              Synthetic Telemetry Feed
            </span>
          </div>
          <p className="text-xs text-[#92400e] mt-1 font-medium">
            Current live display utilizes {mode === 'live_microphone' ? 'uncalibrated browser microphone input' : 'synthetic procedural simulation'}.
            Readings must not be construed as legally certified environmental measurements.
          </p>
        </div>

        {/* Mode Selector Controls */}
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          <button
            onClick={startMicrophone}
            className={`btn btn-sm ${mode === 'live_microphone' && isMonitoring ? 'btn-primary' : 'btn-secondary'} text-xs font-semibold rounded-full`}
          >
            Use Live Mic
          </button>
          <button
            onClick={startSimulation}
            className={`btn btn-sm ${mode === 'simulated' && isMonitoring ? 'btn-primary' : 'btn-secondary'} text-xs font-semibold rounded-full`}
          >
            Simulate Stream
          </button>
          <button
            onClick={toggleMonitoring}
            className={`btn btn-sm ${isMonitoring ? 'btn-alert' : 'btn-primary'} text-xs font-bold rounded-full`}
          >
            {isMonitoring ? 'Pause Monitor' : 'Start Monitor'}
          </button>
        </div>
      </div>

      {/* ── Citizen Mobile GPS Zoning & Noise Audit Capture ──────── */}
      <MobileNoiseDetector />

      {/* ── Live Sound Gauge & Waveform Panel ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Gauge & Realtime Indicator */}
        <div className={`glass-card p-6 rounded-3xl flex flex-col justify-between ${getDbBorderColor(currentDb)}`}>
          <div>
            <div className="flex items-center justify-between text-xs text-[#475569] mb-4">
              <span className="flex items-center gap-2 font-mono text-[11px] font-bold">
                <span className={`status-dot ${isMonitoring ? 'status-dot--active' : 'status-dot--warning'}`} />
                {isMonitoring ? 'ACTIVE ACOUSTIC STREAM' : 'MONITOR IDLE'}
              </span>
              <span className="font-mono text-[10px] uppercase font-bold text-[#475569] bg-[#f1f5f9] px-3 py-1 rounded-full border border-[#e2e8f0]">
                {measurementQuality.method}
              </span>
            </div>

            {/* Main Decibel Display */}
            <div className="text-center my-6">
              <div className="flex items-center justify-center gap-2 mb-1">
                {isMonitoring && (
                  <div className="eq-container h-3.5">
                    <span className="eq-bar" />
                    <span className="eq-bar" />
                    <span className="eq-bar" />
                  </div>
                )}
                <span className="text-xs uppercase tracking-wider text-[#475569] font-bold">
                  Sound Pressure Level (LAeq)
                </span>
              </div>
              <div className={`text-6xl sm:text-7xl font-bold font-mono tracking-tighter ${getDbStatusColor(currentDb)} transition-colors`}>
                {currentDb.toFixed(1)}
              </div>
              <div className="text-xs font-bold text-[#475569] mt-1 uppercase font-mono tracking-wider">
                {measurementQuality.isCalibrated ? 'dB(A) verified' : 'dB(A) estimated'}
              </div>
            </div>

            {/* Threshold comparison */}
            <div className="p-4 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] mb-2 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[#475569] font-medium">Residential Day Limit:</span>
                <span className="font-mono font-bold text-[#0f172a]">55.0 dB(A)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#475569] font-medium">Compliance Status:</span>
                <span className={`font-bold ${currentDb > 55 ? 'text-[#d97706]' : 'text-[#059669]'}`}>
                  {currentDb > 55 ? `Exceeding limit by ${(currentDb - 55).toFixed(1)} dB` : 'Within safe guidelines'}
                </span>
              </div>
            </div>
          </div>

          {/* Sub metrics */}
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-[#e2e8f0] text-center">
            <div>
              <div className="text-[10px] text-[#475569] uppercase font-mono font-bold">Peak</div>
              <div className="text-base font-mono font-bold text-[#0f172a]">{peakDb.toFixed(1)} dB</div>
            </div>
            <div>
              <div className="text-[10px] text-[#475569] uppercase font-mono font-bold">Average</div>
              <div className="text-base font-mono font-bold text-[#0f172a]">{averageDb.toFixed(1)} dB</div>
            </div>
            <div>
              <div className="text-[10px] text-[#475569] uppercase font-mono font-bold">Mode</div>
              <div className="text-xs font-mono font-bold text-[#059669] capitalize mt-0.5">
                {mode === 'live_microphone' ? 'Browser Mic' : 'Synthetic'}
              </div>
            </div>
          </div>
        </div>

        {/* Center & Right: Live Waveform & Sensor Metadata */}
        <div className="lg:col-span-2 glass-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-bold text-[#0f172a]">
                  Live Acoustic Signal & Waveform
                </h2>
                <p className="text-xs text-[#475569]">
                  Continuous time-domain audio samples • {measurementQuality.label}
                </p>
              </div>
              <button 
                onClick={resetPeak}
                className="btn btn-secondary btn-sm text-[11px] py-1 px-2.5 font-semibold"
              >
                Reset Peak
              </button>
            </div>

            <WaveformVisualizer waveformData={waveformData} isActive={isMonitoring} height={130} />
          </div>

          {/* Sensor & Location Attribution Bar */}
          <div className="mt-6 pt-4 border-t border-[#e2e8f0] grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-[#475569] block text-[10px] uppercase font-mono font-bold">Location</span>
              <span className="font-bold text-[#0f172a]">Riverside Residential Zone A</span>
            </div>
            <div>
              <span className="text-[#475569] block text-[10px] uppercase font-mono font-bold">Calibration Status</span>
              <span className="font-bold text-[#0f172a]">
                {mode === 'live_microphone' ? 'Uncalibrated Mic (Relative)' : 'Simulated IoT Class 2'}
              </span>
            </div>
            <div>
              <span className="text-[#475569] block text-[10px] uppercase font-mono font-bold">Data Freshness</span>
              <span className="font-bold text-[#059669]">Streaming (0.2s latency)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Key Operational Metrics ──────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Monitoring Sites"
          value={summary?.active_locations || 5}
          unit="Locations"
          trend={0}
          trendLabel="All systems online"
          accent={true}
        />
        <StatCard
          title="24h Average Noise"
          value={summary?.avg_noise_level_24h || 51.2}
          unit="dB(A)"
          trend={-2.4}
          trendLabel="vs yesterday"
        />
        <StatCard
          title="Potential Incidents"
          value={summary?.potential_incidents_count || 4}
          unit="Awaiting Review"
          trend={+1}
          trendLabel="1 high severity"
          badge="Review Required"
        />
        <StatCard
          title="Pending Complaints"
          value={summary?.pending_complaints_count || 2}
          unit="In Workflow"
          trend={0}
          trendLabel="Ready for dispatch"
        />
      </div>

      {/* ── Real Trained Machine Learning Acoustic Classifier Lab ──── */}
      <AcousticModelCard currentWaveform={waveformData} currentDb={currentDb} />

      {/* ── 24-Hour Trend Line Chart ─────────────────────────────── */}
      <div className="glass-card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base font-bold text-[#0f172a]">
              24-Hour Sound Level History & Threshold Compliance
            </h2>
            <p className="text-xs text-[#475569]">
              Continuous hourly equivalent sound levels (LAeq) plotted against jurisdictional threshold (55 dB(A))
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono font-bold">
            <span className="flex items-center gap-1.5 text-[#059669]">
              <span className="w-3 h-1 bg-[#059669] inline-block rounded-full" />
              Measured LAeq
            </span>
            <span className="flex items-center gap-1.5 text-[#d97706]">
              <span className="w-3 h-0.5 bg-[#d97706] inline-block border-t border-dashed" />
              Threshold Limit (55 dBA)
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="time" stroke="#475569" tick={{ fill: '#475569', fontSize: 11 }} />
              <YAxis domain={[35, 85]} unit=" dB" stroke="#475569" tick={{ fill: '#475569', fontSize: 11 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  borderColor: '#cbd5e1',
                  borderRadius: '16px',
                  fontSize: '12px',
                  color: '#0f172a',
                  boxShadow: '0 8px 20px -4px rgba(15,23,42,0.1)'
                }} 
              />
              <ReferenceLine y={55} stroke="#d97706" strokeDasharray="4 4" label={{ value: 'Limit: 55 dB', fill: '#d97706', fontSize: 10, position: 'right' }} />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#059669" 
                strokeWidth={2.5} 
                dot={{ r: 3, fill: '#059669' }} 
                activeDot={{ r: 6, fill: '#047857' }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Recent Incidents Quick Table ─────────────────────────── */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-[#0f172a]">
              Recent Detected Sound Exceedance Incidents
            </h2>
            <p className="text-xs text-[#475569]">
              Algorithmic screening flags requiring operator review before complaint filing
            </p>
          </div>
          <Link to="/reports" className="btn btn-secondary btn-sm text-xs font-semibold">
            View All Reports
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#e2e8f0] text-[#475569] uppercase tracking-wider font-mono text-[10px] font-bold bg-[#f8fafc]">
                <th className="p-3">Incident ID</th>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Measured Level</th>
                <th className="p-3">Threshold</th>
                <th className="p-3">Classification</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {(summary?.recent_incidents || []).slice(0, 4).map((inc) => (
                <tr key={inc.id} className="hover:bg-[#f8fafc] transition-colors">
                  <td className="p-3 font-mono font-bold text-[#0f172a]">{inc.id}</td>
                  <td className="p-3 text-[#475569]">{inc.start_time?.substring(0, 16).replace('T', ' ')}</td>
                  <td className="p-3 font-mono font-bold text-[#d97706]">{inc.measured_value} dB(A)</td>
                  <td className="p-3 font-mono text-[#475569] font-medium">{inc.threshold_value} dB(A)</td>
                  <td className="p-3">
                    <span className="badge-slate capitalize">
                      {inc.sound_classification || 'Machinery'}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={inc.status === 'verified' ? 'badge-emerald' : 'badge-amber'}>
                      {inc.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <Link to={`/incidents/${inc.id}`} className="text-[#059669] hover:underline font-bold">
                      Review Dossier
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
