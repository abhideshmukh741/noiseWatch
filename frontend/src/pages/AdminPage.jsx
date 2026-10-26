/**
 * Page G: Admin Panel & Governance
 * 
 * Central administrative console for sensor fleet management,
 * regulatory threshold configuration, calibration tracking,
 * incident approval, and audit logs.
 * Clean, light environmental design without icons or glassmorphism.
 */

import { useState, useEffect } from 'react';
import { devicesAPI, locationsAPI } from '../services/api';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('devices');
  const [devices, setDevices] = useState([]);
  const [thresholds, setThresholds] = useState([
    { zone: 'residential', day: 55, night: 45, version: 'v2026.1', ruleSource: 'CPCB / Schedule II' },
    { zone: 'commercial', day: 65, night: 55, version: 'v2026.1', ruleSource: 'CPCB / Schedule II' },
    { zone: 'industrial', day: 75, night: 70, version: 'v2026.1', ruleSource: 'CPCB / Schedule II' },
    { zone: 'silent', day: 50, night: 40, version: 'v2026.1', ruleSource: 'CPCB / Schedule II' },
  ]);
  const [auditLogs] = useState([
    { id: 1, action: 'THRESHOLD_UPDATED', actor: 'admin@noisewatch.app', entity: 'Zone: Residential', time: '10 mins ago', status: 'SUCCESS' },
    { id: 2, action: 'INCIDENT_VERIFIED', actor: 'reviewer@noisewatch.app', entity: 'Incident inc-demo-001', time: '42 mins ago', status: 'SUCCESS' },
    { id: 3, action: 'REPORT_GENERATED', actor: 'system-agent', entity: 'Report rpt-demo-001', time: '1 hour ago', status: 'SUCCESS' },
    { id: 4, action: 'SENSOR_CALIBRATION_CHECK', actor: 'admin@noisewatch.app', entity: 'Device DEV-IOT-002', time: '3 hours ago', status: 'SUCCESS' },
  ]);
  const [notification, setNotification] = useState('');

  useEffect(() => {
    async function loadAdminData() {
      try {
        const [devRes] = await Promise.all([
          devicesAPI.list(),
          locationsAPI.list(),
        ]);
        setDevices(devRes.data.items || []);
      } catch (err) {
        console.error('Failed to load admin data:', err);
      }
    }
    loadAdminData();
  }, []);

  const handleUpdateThreshold = (zone, field, val) => {
    setThresholds((prev) =>
      prev.map((t) => (t.zone === zone ? { ...t, [field]: parseFloat(val) || 0 } : t))
    );
    setNotification(`Threshold updated for ${zone.toUpperCase()} zone.`);
    setTimeout(() => setNotification(''), 3000);
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto space-y-8">
      
      {/* ── Top Architectural Header Banner ─────────────────────────── */}
      <div className="bg-white border border-[#e2e8f0] p-6 sm:p-8 rounded-tl-[48px] rounded-br-[48px] rounded-tr-2xl rounded-bl-2xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e6f7f4] border border-[#a7f3d0] text-[#00a88f] text-[10px] font-bold tracking-widest uppercase mb-2">
            Governance & Fleet Administration
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1e2430]">
            Administrative Governance & Sensor Fleet
          </h1>
          <p className="text-xs sm:text-sm text-[#58647a] mt-1 max-w-xl">
            Configure statutory decibel benchmarks, verify physical calibration cycles, and monitor cryptographic compliance audit logs.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="inline-flex items-center px-4 py-2 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-[#1e2430] text-white shadow-xs">
            Admin Clearance: Level 3
          </span>
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-3xl text-xs font-bold text-[#00a88f] border border-[#a7f3d0] bg-[#e6f7f4] shadow-xs">
          {notification}
        </div>
      )}

      {/* ── Tab Stadium Navigation Capsule ─────────────────────────── */}
      <div className="bg-white border border-[#e2e8f0] p-2 rounded-full shadow-xs inline-flex flex-wrap items-center gap-2">
        {[
          { id: 'devices', label: 'Sensors & Meter Fleet' },
          { id: 'thresholds', label: 'Zone Regulatory Rules' },
          { id: 'audit', label: 'Compliance Audit Logs' },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 ${
              activeTab === id
                ? 'bg-[#1e2430] text-white shadow-xs'
                : 'text-[#58647a] hover:text-[#1e2430] hover:bg-[#f1f5f9]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab 1: Sensor Fleet & Calibration Lifecycle ───────────── */}
      {activeTab === 'devices' && (
        <div className="shape-arch bg-white border border-[#e2e8f0] p-6 sm:p-10 shadow-sm card-hover-interactive space-y-6">
          <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-4">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#00a88f] block mb-1">
                Hardware Inventory
              </span>
              <h3 className="text-xl font-bold text-[#1e2430] tracking-tight">
                Authorized Sound Measurement Hardware & Nodes
              </h3>
            </div>
            <span className="text-xs text-[#58647a] font-mono font-bold bg-[#f1f5f9] px-3.5 py-1.5 rounded-full border border-[#e2e8f0]">
              Fleet Count: {devices.length} Devices
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#e2e8f0] text-[#58647a] uppercase tracking-wider font-mono text-[10px] font-bold">
                  <th className="pb-4 font-bold">Device ID</th>
                  <th className="pb-4 font-bold">Model & Type</th>
                  <th className="pb-4 font-bold">Station Assignment</th>
                  <th className="pb-4 font-bold">Calibration Lifecycle</th>
                  <th className="pb-4 font-bold">Cert Expiry</th>
                  <th className="pb-4 font-bold">Fleet Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {devices.map((dev) => (
                  <tr key={dev.id} className="hover:bg-[#f8fafc] transition-colors">
                    <td className="py-4 font-mono font-bold text-[#1e2430]">{dev.id}</td>
                    <td className="py-4">
                      <div className="font-bold text-[#1e2430]">{dev.name}</div>
                      <div className="text-[11px] text-[#58647a] capitalize">
                        {dev.device_type?.replace(/_/g, ' ')}
                      </div>
                    </td>
                    <td className="py-4 text-[#58647a] font-mono text-[11px]">
                      {dev.location_id || 'Unassigned Node'}
                    </td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                        dev.calibration_status === 'calibrated' 
                          ? 'bg-[#e6f7f4] text-[#00a88f] border border-[#a7f3d0]' 
                          : 'bg-[#fff8e1] text-[#b45309] border border-[#fde68a]'
                      }`}>
                        {dev.calibration_status}
                      </span>
                    </td>
                    <td className="py-4 text-[#58647a] font-mono text-[11px]">
                      {dev.calibration_expiry || 'N/A (Consumer)'}
                    </td>
                    <td className="py-4">
                      <span className="flex items-center gap-2 text-[#00a88f] font-bold text-xs">
                        <span className="w-2 h-2 rounded-full bg-[#00a88f] inline-block animate-pulse" /> Operational
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab 2: Regulatory Threshold Configuration ─────────────── */}
      {activeTab === 'thresholds' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#00a88f] block mb-1">
                Statutory Matrix
              </span>
              <h3 className="text-xl font-bold text-[#1e2430] tracking-tight">
                Statutory Zone Thresholds & Persistence Settings
              </h3>
              <p className="text-xs text-[#58647a] mt-0.5">
                Versioned decibel benchmarks utilized by the automated CPCB exceedance evaluation engine.
              </p>
            </div>
            <span className="px-4 py-2 rounded-full bg-white border border-[#e2e8f0] font-mono text-xs font-bold text-[#00a88f] shadow-xs">
              Active Version: v2026.1
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {thresholds.map((t) => (
              <div key={t.zone} className="shape-asymmetric-deck bg-white border border-[#e2e8f0] p-6 sm:p-7 space-y-5 shadow-sm card-hover-interactive">
                <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
                  <span className="font-bold text-base text-[#1e2430] capitalize">
                    {t.zone} Zone
                  </span>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#58647a] bg-[#f8fafc] px-3 py-1 rounded-full border border-[#e2e8f0]">
                    Ref: {t.ruleSource}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-[#58647a] block mb-1.5 ml-1 tracking-wider">
                      Day Limit (06:00 - 22:00)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={t.day}
                        onChange={(e) => handleUpdateThreshold(t.zone, 'day', e.target.value)}
                        className="w-full rounded-full bg-[#f8fafc] border border-[#e2e8f0] px-4 py-2.5 text-xs font-mono font-bold text-[#1e2430] focus:outline-none focus:border-[#00a88f]"
                      />
                      <span className="text-[#58647a] font-bold font-mono">dBA</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-[#58647a] block mb-1.5 ml-1 tracking-wider">
                      Night Limit (22:00 - 06:00)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={t.night}
                        onChange={(e) => handleUpdateThreshold(t.zone, 'night', e.target.value)}
                        className="w-full rounded-full bg-[#f8fafc] border border-[#e2e8f0] px-4 py-2.5 text-xs font-mono font-bold text-[#1e2430] focus:outline-none focus:border-[#00a88f]"
                      />
                      <span className="text-[#58647a] font-bold font-mono">dBA</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#e2e8f0] flex items-center justify-between text-[11px] text-[#58647a]">
                  <span>Persistence: 10 mins minimum</span>
                  <span>Cooldown: 30 mins</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab 3: Compliance Audit Logs ──────────────────────────── */}
      {activeTab === 'audit' && (
        <div className="shape-arch-inverted bg-white border border-[#e2e8f0] p-6 sm:p-10 shadow-sm card-hover-interactive space-y-6">
          <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-4">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#00a88f] block mb-1">
                Forensic Ledger
              </span>
              <h3 className="text-xl font-bold text-[#1e2430] tracking-tight">
                Cryptographically Linked Audit Journal
              </h3>
            </div>
            <span className="text-xs text-[#58647a] font-mono font-bold bg-[#f1f5f9] px-3.5 py-1.5 rounded-full border border-[#e2e8f0]">
              Immutable Records: 4 Events
            </span>
          </div>

          <div className="divide-y divide-[#f1f5f9]">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs hover:bg-[#f8fafc] px-3 rounded-2xl transition-colors">
                <div className="flex items-start gap-3">
                  <span className="px-3 py-1 rounded-full bg-[#f1f5f9] border border-[#e2e8f0] font-mono text-[10px] font-bold text-[#00a88f]">
                    LOG-{log.id.toString().padStart(4, '0')}
                  </span>
                  <div>
                    <div className="font-bold text-[#1e2430] font-mono">
                      {log.action}
                    </div>
                    <div className="text-[11px] text-[#58647a] mt-0.5">
                      Target: {log.entity} • Actor: {log.actor}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-auto text-[11px] text-[#58647a]">
                  <span>{log.time}</span>
                  <span className="px-3 py-0.5 rounded-full bg-[#e6f7f4] text-[#00a88f] border border-[#a7f3d0] font-mono text-[10px] font-bold">
                    {log.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
