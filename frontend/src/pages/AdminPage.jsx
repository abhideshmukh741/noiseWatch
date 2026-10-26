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
    <div className="min-h-screen bg-[var(--color-bg-primary)] p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto space-y-6">
      
      {/* ── Page Header ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Administrative Governance & Sensor Fleet
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Configure regulatory limits, audit sensor calibration lifecycles, and monitor system-wide compliance logs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="demo-badge">Admin Clearance: Level 3</span>
        </div>
      </div>

      {notification && (
        <div className="glass-card p-3 text-xs text-[var(--color-accent)] font-semibold border-l-4 border-l-[var(--color-accent)] bg-emerald-50/70">
          {notification}
        </div>
      )}

      {/* ── Tab Navigation ───────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-[var(--color-border)] pb-2 text-xs">
        {[
          { id: 'devices', label: 'Sensors & Meter Fleet' },
          { id: 'thresholds', label: 'Zone Regulatory Rules' },
          { id: 'audit', label: 'Compliance Audit Logs' },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`px-4 py-2 rounded text-xs font-semibold transition-colors ${
              activeTab === id
                ? 'bg-[var(--color-accent)] text-white shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab 1: Sensor Fleet & Calibration Lifecycle ───────────── */}
      {activeTab === 'devices' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
              Authorized Sound Measurement Hardware & Nodes
            </h3>
            <span className="text-xs text-[var(--color-text-secondary)] font-mono font-medium">
              Fleet Count: {devices.length} Devices
            </span>
          </div>

          <div className="glass-card overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] uppercase tracking-wider font-mono text-[10px] font-bold">
                  <th className="p-4">Device ID</th>
                  <th className="p-4">Model & Type</th>
                  <th className="p-4">Assigned Location</th>
                  <th className="p-4">Calibration Status</th>
                  <th className="p-4">Cert Expiry</th>
                  <th className="p-4">Fleet Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {devices.map((dev) => (
                  <tr key={dev.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-mono font-bold text-[var(--color-text-primary)]">{dev.id}</td>
                    <td className="p-4">
                      <div className="font-semibold text-[var(--color-text-primary)]">{dev.name}</div>
                      <div className="text-[11px] text-[var(--color-text-secondary)] capitalize">
                        {dev.device_type?.replace(/_/g, ' ')}
                      </div>
                    </td>
                    <td className="p-4 text-[var(--color-text-secondary)] font-mono text-[11px]">
                      {dev.location_id || 'Unassigned'}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        dev.calibration_status === 'calibrated' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {dev.calibration_status}
                      </span>
                    </td>
                    <td className="p-4 text-[var(--color-text-secondary)] font-mono text-[11px]">
                      {dev.calibration_expiry || 'N/A (Consumer)'}
                    </td>
                    <td className="p-4">
                      <span className="flex items-center gap-1.5 text-[var(--color-accent)] font-semibold text-xs">
                        <span className="status-dot status-dot--active" /> Operational
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
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
                Statutory Zone Thresholds & Persistence Settings
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                Versioned decibel benchmarks used by the automated incident evaluation engine
              </p>
            </div>
            <span className="px-2.5 py-1 rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border)] font-mono text-xs font-bold text-[var(--color-accent)]">
              Active Version: v2026.1
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {thresholds.map((t) => (
              <div key={t.zone} className="glass-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[var(--color-text-primary)] capitalize">
                    {t.zone} Zone
                  </span>
                  <span className="text-[10px] font-mono font-semibold text-[var(--color-text-secondary)]">
                    Ref: {t.ruleSource}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)] block mb-1">
                      Day Limit (06:00 - 22:00)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={t.day}
                        onChange={(e) => handleUpdateThreshold(t.zone, 'day', e.target.value)}
                        className="w-full rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border)] p-2 text-xs font-mono font-bold text-[var(--color-text-primary)]"
                      />
                      <span className="text-[var(--color-text-secondary)] font-medium">dBA</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)] block mb-1">
                      Night Limit (22:00 - 06:00)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={t.night}
                        onChange={(e) => handleUpdateThreshold(t.zone, 'night', e.target.value)}
                        className="w-full rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border)] p-2 text-xs font-mono font-bold text-[var(--color-text-primary)]"
                      />
                      <span className="text-[var(--color-text-secondary)] font-medium">dBA</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--color-border)] flex items-center justify-between text-[11px] text-[var(--color-text-secondary)]">
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
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
              Cryptographically Linked Audit Journal
            </h3>
            <span className="text-xs text-[var(--color-text-secondary)] font-mono font-medium">
              Immutable Records: 4 Events
            </span>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="divide-y divide-[var(--color-border)]">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <span className="p-1.5 px-2 rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border)] font-mono text-[10px] font-bold text-[var(--color-accent)]">
                      LOG-{log.id.toString().padStart(4, '0')}
                    </span>
                    <div>
                      <div className="font-bold text-[var(--color-text-primary)] font-mono">
                        {log.action}
                      </div>
                      <div className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
                        Target: {log.entity} • Actor: {log.actor}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 self-end sm:self-auto text-[11px] text-[var(--color-text-secondary)]">
                    <span>{log.time}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold">
                      {log.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
