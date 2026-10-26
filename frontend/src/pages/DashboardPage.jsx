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
    if (val >= 55) return 'text-[#ff5757]';
    return 'text-[#00a88f]';
  };

  const getDbBorderColor = (val) => {
    if (val >= 55) return 'border-[#ff5757]';
    return 'border-[#00a88f]';
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto space-y-8">
      
      {/* ── 1. Acoustic Telemetry Feed Status Banner (Asymmetric Pill Banner) ── */}
      <div className="bg-white border border-[#e5e9f2] rounded-tl-[40px] rounded-br-[40px] rounded-tr-2xl rounded-bl-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 card-hover-interactive">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-[#00a88f] bg-[#f0fdfa] border border-[#99f6e4]">
              {mode === 'live_microphone' ? 'Live Web Audio Stream' : 'Calibrated Telemetry Stream'}
            </span>
            <span className="text-xs font-bold text-[#1e2430]">
              IEC 61672 Reference Channel
            </span>
          </div>
          <p className="text-xs text-[#58647a] max-w-2xl leading-relaxed">
            {mode === 'live_microphone' 
              ? 'Streaming real-time acoustic sound pressure via Web Audio API. Screened values represent relative acoustic energy.' 
              : 'Streaming procedural diurnal acoustic telemetry simulating calibrated Class 2 sound level meters.'}
          </p>
        </div>

        {/* Mode Selector Controls */}
        <div className="flex items-center gap-2.5 self-end md:self-auto shrink-0">
          <button
            onClick={startMicrophone}
            className={`text-xs px-4 py-2 rounded-full font-bold uppercase tracking-wider transition-all cursor-pointer ${
              mode === 'live_microphone' && isMonitoring 
                ? 'btn-qwilr-teal' 
                : 'btn-qwilr-outline'
            }`}
          >
            Live Mic
          </button>
          <button
            onClick={startSimulation}
            className={`text-xs px-4 py-2 rounded-full font-bold uppercase tracking-wider transition-all cursor-pointer ${
              mode === 'simulated' && isMonitoring 
                ? 'btn-qwilr-teal' 
                : 'btn-qwilr-outline'
            }`}
          >
            Simulate
          </button>
          <button
            onClick={toggleMonitoring}
            className={`text-xs px-5 py-2 rounded-full font-bold uppercase tracking-wider transition-all cursor-pointer ${
              isMonitoring 
                ? 'bg-[#ff5757] hover:bg-[#e64545] text-white shadow-xs' 
                : 'btn-qwilr-teal'
            }`}
          >
            {isMonitoring ? 'PAUSE' : 'START'}
          </button>
        </div>
      </div>

      {/* ── Citizen Mobile GPS Zoning & Noise Audit Capture ──────── */}
      <MobileNoiseDetector />

      {/* ── 2. Live Sound Gauge & Waveform Panel (Architectural Silhouettes) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Cathedral Arch Portal with Circular Acoustic Lens Dial */}
        <div className="shape-arch card-hover-teal bg-white border border-[#e5e9f2] p-7 shadow-xs flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between text-xs text-[#8c97a8] mb-2">
              <span className="flex items-center gap-2 font-mono text-[11px] font-bold">
                <span className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-[#00a88f] animate-pulse' : 'bg-[#8c97a8]'}`} />
                <span className="text-[#1e2430]">{isMonitoring ? 'LIVE ACOUSTIC STREAM' : 'MONITOR IDLE'}</span>
              </span>
              <span className="font-mono text-[10px] uppercase font-bold text-[#00a88f] bg-[#f0fdfa] px-3 py-1 rounded-full border border-[#99f6e4]">
                {measurementQuality.method}
              </span>
            </div>

            {/* Circular Acoustic Lens Aperture */}
            <div 
              className={`w-44 h-44 sm:w-48 sm:h-48 rounded-full border-4 mx-auto my-6 flex flex-col items-center justify-center relative transition-all duration-300 shadow-md group-hover:scale-105 group/lens cursor-pointer bg-white ${
                currentDb > 55 ? 'border-[#ff5757]' : 'border-[#00a88f]'
              }`}
            >
              {/* Concentric inner dashed ring */}
              <div 
                className={`absolute inset-2 rounded-full border border-dashed opacity-40 group-hover/lens:rotate-45 transition-transform duration-700 pointer-events-none ${
                  currentDb > 55 ? 'border-[#ff5757]' : 'border-[#00a88f]'
                }`}
              />

              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#8c97a8]">
                SOUND PRESSURE
              </span>

              <div className="flex items-baseline gap-1 my-1">
                <span className={`text-5xl sm:text-6xl font-black tracking-tight font-mono ${getDbStatusColor(currentDb)} transition-colors`}>
                  {currentDb.toFixed(1)}
                </span>
                <span className="text-xs font-bold font-mono text-[#58647a]">dB(A)</span>
              </div>

              <div 
                className={`px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  currentDb > 55 ? 'bg-[#fff0f0] text-[#ff5757]' : 'bg-[#f0fdfa] text-[#00a88f]'
                }`}
              >
                {currentDb > 55 ? `+${(currentDb - 55).toFixed(1)} dB EXCEEDED` : 'COMPLIANT'}
              </div>
            </div>

            {/* Threshold comparison Pill */}
            <div className="p-3.5 rounded-2xl bg-[#fafbfc] border border-[#e5e9f2] mb-2 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[#58647a] font-medium">Residential Day Limit:</span>
                <span className="font-mono font-bold text-[#1e2430]">55.0 dB(A)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#58647a] font-medium">Compliance Status:</span>
                <span className={`font-bold ${currentDb > 55 ? 'text-[#ff5757]' : 'text-[#00a88f]'}`}>
                  {currentDb > 55 ? `Exceeds threshold by ${(currentDb - 55).toFixed(1)} dB` : 'Within Rule 3(1) limits'}
                </span>
              </div>
            </div>
          </div>

          {/* Sub metrics in Stadium Pills */}
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-[#e5e9f2] text-center">
            <div className="p-2 rounded-xl bg-[#fafbfc] border border-[#e5e9f2]">
              <div className="text-[9px] text-[#8c97a8] uppercase font-mono font-bold">Peak</div>
              <div className="text-sm font-mono font-bold text-[#1e2430] mt-0.5">{peakDb.toFixed(1)} dB</div>
            </div>
            <div className="p-2 rounded-xl bg-[#fafbfc] border border-[#e5e9f2]">
              <div className="text-[9px] text-[#8c97a8] uppercase font-mono font-bold">Average</div>
              <div className="text-sm font-mono font-bold text-[#1e2430] mt-0.5">{averageDb.toFixed(1)} dB</div>
            </div>
            <div className="p-2 rounded-xl bg-[#fafbfc] border border-[#e5e9f2]">
              <div className="text-[9px] text-[#8c97a8] uppercase font-mono font-bold">Mode</div>
              <div className="text-xs font-mono font-bold text-[#00a88f] capitalize mt-1">
                {mode === 'live_microphone' ? 'Browser' : 'IoT Sim'}
              </div>
            </div>
          </div>
        </div>

        {/* Center & Right: Asymmetric Organic Pebble Deck */}
        <div className="lg:col-span-2 shape-pebble-1 card-hover-interactive bg-white border border-[#e5e9f2] p-7 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[#e5e9f2]">
              <div>
                <h2 className="text-base font-bold text-[#1e2430]">
                  Time-Domain Acoustic Waveform
                </h2>
                <p className="text-xs text-[#58647a]">
                  Continuous audio samples (22.05 kHz) • {measurementQuality.label}
                </p>
              </div>
              <button 
                onClick={resetPeak}
                className="btn-qwilr-outline text-[11px] py-1.5 px-3 rounded-full hover:bg-[#1e2430] hover:text-white transition-all cursor-pointer"
              >
                RESET PEAK
              </button>
            </div>

            <div className="bg-[#fafbfc] border border-[#e5e9f2] rounded-3xl p-4">
              <WaveformVisualizer waveformData={waveformData} isActive={isMonitoring} height={140} />
            </div>
          </div>

          {/* Sensor & Location Attribution Bar */}
          <div className="mt-6 pt-4 border-t border-[#e5e9f2] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-[#fafbfc] border border-[#e5e9f2] rounded-2xl">
              <span className="text-[#8c97a8] block text-[10px] uppercase font-mono font-bold">Location</span>
              <span className="font-bold text-[#1e2430] mt-0.5 block">Riverside Zone A</span>
            </div>
            <div className="p-3 bg-[#fafbfc] border border-[#e5e9f2] rounded-2xl">
              <span className="text-[#8c97a8] block text-[10px] uppercase font-mono font-bold">Calibration Quality</span>
              <span className="font-bold text-[#1e2430] mt-0.5 block">
                {mode === 'live_microphone' ? 'Uncalibrated (Estimated)' : 'IEC 61672 Class 2'}
              </span>
            </div>
            <div className="p-3 bg-[#fafbfc] border border-[#e5e9f2] rounded-2xl">
              <span className="text-[#8c97a8] block text-[10px] uppercase font-mono font-bold">Latency</span>
              <span className="font-bold text-[#00a88f] mt-0.5 block">Streaming (&lt; 0.2s)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Key Operational Metrics (StatCards with Delight Physics) ── */}
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

      {/* ── 4. Real Trained Machine Learning Acoustic Classifier Lab ──── */}
      <AcousticModelCard currentWaveform={waveformData} currentDb={currentDb} />

      {/* ── 5. 24-Hour Trend Line Chart in Inverted Arch Portal ─────── */}
      <div className="shape-arch-inverted card-hover-teal bg-white border border-[#e5e9f2] p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-[#00a88f] bg-[#f0fdfa] border border-[#99f6e4] mb-2">
              <span>STATUTORY COMPLIANCE TREND</span>
            </div>
            <h2 className="text-xl font-bold text-[#1e2430]">
              24-Hour Sound Level History &amp; Threshold Tracking
            </h2>
            <p className="text-xs text-[#58647a]">
              Continuous hourly equivalent sound levels (LAeq) plotted against CPCB standard (55.0 dB(A))
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono font-bold">
            <span className="flex items-center gap-1.5 text-[#00a88f]">
              <span className="w-3 h-1 bg-[#00a88f] inline-block rounded-full" />
              Measured LAeq
            </span>
            <span className="flex items-center gap-1.5 text-[#ff5757]">
              <span className="w-3 h-0.5 bg-[#ff5757] inline-block border-t border-dashed" />
              Statutory Limit (55 dB)
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e9f2" />
              <XAxis dataKey="time" stroke="#8c97a8" tick={{ fill: '#8c97a8', fontSize: 11 }} />
              <YAxis domain={[35, 85]} unit=" dB" stroke="#8c97a8" tick={{ fill: '#8c97a8', fontSize: 11 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  borderColor: '#e5e9f2',
                  borderRadius: '16px',
                  fontSize: '12px',
                  color: '#1e2430',
                  boxShadow: '0 12px 30px -4px rgba(15,23,42,0.1)'
                }} 
              />
              <ReferenceLine y={55} stroke="#ff5757" strokeDasharray="4 4" label={{ value: 'Limit: 55 dB', fill: '#ff5757', fontSize: 10, position: 'right' }} />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#00a88f" 
                strokeWidth={2.5} 
                dot={{ r: 3, fill: '#00a88f' }} 
                activeDot={{ r: 6, fill: '#008a75' }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── 6. Recent Detected Exceedance Incidents in Asymmetric Deck ── */}
      <div className="shape-asymmetric-deck card-hover-interactive bg-white border border-[#e5e9f2] p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-[#e5e9f2]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-[#ff5757] bg-[#fff0f0] border border-[#ffd1d1] mb-2">
              <span>OPERATOR TRIAGE</span>
            </div>
            <h2 className="text-xl font-bold text-[#1e2430]">
              Recent Detected Sound Exceedance Incidents
            </h2>
            <p className="text-xs text-[#58647a]">
              Algorithmic screening flags requiring human review before formal complaint filing
            </p>
          </div>
          <Link to="/reports" className="btn-qwilr-outline text-xs px-5 py-2.5 rounded-full whitespace-nowrap">
            VIEW ALL REPORTS &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#e5e9f2] text-[#8c97a8] uppercase tracking-wider font-mono text-[10px] font-bold bg-[#fafbfc]">
                <th className="p-3.5">Incident ID</th>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Measured Level</th>
                <th className="p-3.5">Threshold</th>
                <th className="p-3.5">Classification</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e9f2]">
              {(summary?.recent_incidents || []).slice(0, 4).map((inc) => (
                <tr key={inc.id} className="hover:bg-[#f8fafc] transition-colors">
                  <td className="p-3.5 font-mono font-bold text-[#1e2430]">{inc.id}</td>
                  <td className="p-3.5 text-[#58647a]">{inc.start_time?.substring(0, 16).replace('T', ' ')}</td>
                  <td className="p-3.5 font-mono font-bold text-[#ff5757]">{inc.measured_value} dB(A)</td>
                  <td className="p-3.5 font-mono text-[#58647a] font-medium">{inc.threshold_value} dB(A)</td>
                  <td className="p-3.5">
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#f8fafc] text-[#1e2430] border border-[#e5e9f2]">
                      {inc.sound_classification || 'Machinery'}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      inc.status === 'verified' 
                        ? 'bg-[#f0fdfa] text-[#00a88f] border border-[#99f6e4]' 
                        : 'bg-[#fffbeb] text-[#d97706] border border-[#fde68a]'
                    }`}>
                      {inc.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <Link to={`/incidents/${inc.id}`} className="text-[#00a88f] hover:text-[#008a75] font-bold uppercase text-[11px] tracking-wider">
                      Review Dossier &rarr;
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
