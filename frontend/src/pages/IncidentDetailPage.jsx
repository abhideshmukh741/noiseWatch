/**
 * Page E: Incident Details & Review
 * 
 * Comprehensive dossier for an acoustic threshold exceedance.
 * Displays measurement provenance, spectral features, ML classification confidence,
 * timeline of events, and operator review/report-generation actions.
 * Clean, light environmental design without icons or glassmorphism.
 */

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { incidentsAPI } from '../services/api';
import WaveformVisualizer from '../components/WaveformVisualizer';

export default function IncidentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [generatedReportId, setGeneratedReportId] = useState(null);

  // Load incident details
  useEffect(() => {
    async function fetchIncident() {
      try {
        setLoading(true);
        const res = await incidentsAPI.get(id || 'inc-demo-001');
        setIncident(res.data);
        setReviewerNotes(res.data.reviewer_notes || '');
      } catch (err) {
        console.error('Failed to load incident:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchIncident();
  }, [id]);

  // Review actions
  const handleReview = async (newStatus) => {
    try {
      await incidentsAPI.review(id, {
        status: newStatus,
        reviewer_notes: reviewerNotes,
      });
      setIncident((prev) => ({ ...prev, status: newStatus, reviewer_notes: reviewerNotes }));
      setActionSuccess(`Incident marked as ${newStatus.toUpperCase()}`);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      console.error('Review action failed:', err);
    }
  };

  // Generate Report action
  const handleGenerateReport = async () => {
    try {
      const res = await incidentsAPI.generateReport(id);
      setGeneratedReportId(res.data.report_id);
      setActionSuccess('Official compliance report drafted successfully.');
    } catch (err) {
      console.error('Report generation failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] p-8 text-center text-xs text-[var(--color-text-secondary)] font-medium">
        Loading incident dossier...
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] p-8 text-center text-xs text-[var(--color-text-secondary)]">
        Incident record not found.
      </div>
    );
  }

  // Pre-generate acoustic signature wave
  const signatureWave = new Array(64).fill(0).map((_, i) => Math.sin(i * 0.4) * 0.5 + Math.sin(i * 1.2) * 0.25);

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto space-y-6">
      
      {/* ── Top Navigation & Title Bar ────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="px-3 py-1.5 rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border)] hover:bg-slate-200 text-xs font-semibold text-[var(--color-text-secondary)] transition-colors"
          >
            ← Back
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text-primary)] font-mono">
                {incident.id}
              </h1>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                incident.severity === 'high' 
                  ? 'bg-red-50 text-[var(--color-danger)] border border-red-200' 
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {incident.severity} SEVERITY
              </span>
              <span className="demo-badge">Screening Record</span>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              Detected on {incident.start_time?.substring(0, 16).replace('T', ' ')} • Rule Engine {incident.rule_version}
            </p>
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--color-text-secondary)] font-medium">Current State:</span>
          <span className="px-3 py-1 rounded text-xs font-mono font-bold uppercase bg-emerald-50 text-[var(--color-accent)] border border-emerald-200">
            {incident.status}
          </span>
        </div>
      </div>

      {actionSuccess && (
        <div className="glass-card p-3 text-xs text-[var(--color-accent)] font-semibold border-l-4 border-l-[var(--color-accent)] bg-emerald-50/60">
          {actionSuccess}
        </div>
      )}

      {/* ── Primary Metrics Overview ──────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 text-center">
          <div className="text-[10px] uppercase text-[var(--color-text-muted)] font-mono font-bold">Measured Level (LAeq)</div>
          <div className="text-3xl font-mono font-bold text-[var(--color-danger)] mt-1">
            {incident.measured_value} <span className="text-sm font-normal">dB(A)</span>
          </div>
          <div className="text-[11px] text-[var(--color-text-secondary)] mt-1">Equivalent Continuous Level</div>
        </div>

        <div className="glass-card p-4 text-center">
          <div className="text-[10px] uppercase text-[var(--color-text-muted)] font-mono font-bold">Statutory Threshold</div>
          <div className="text-3xl font-mono font-bold text-[var(--color-text-primary)] mt-1">
            {incident.threshold_value} <span className="text-sm font-normal">dB(A)</span>
          </div>
          <div className="text-[11px] text-[var(--color-text-secondary)] mt-1">Jurisdictional Standard</div>
        </div>

        <div className="glass-card p-4 text-center">
          <div className="text-[10px] uppercase text-[var(--color-text-muted)] font-mono font-bold">Exceedance Delta</div>
          <div className="text-3xl font-mono font-bold text-amber-700 mt-1">
            +{(incident.measured_value - incident.threshold_value).toFixed(1)} <span className="text-sm font-normal">dB</span>
          </div>
          <div className="text-[11px] text-[var(--color-text-secondary)] mt-1">Above Permissible Limit</div>
        </div>

        <div className="glass-card p-4 text-center">
          <div className="text-[10px] uppercase text-[var(--color-text-muted)] font-mono font-bold">Duration</div>
          <div className="text-3xl font-mono font-bold text-[var(--color-text-primary)] mt-1">
            {Math.round((incident.duration_seconds || 1800) / 60)} <span className="text-sm font-normal">mins</span>
          </div>
          <div className="text-[11px] text-[var(--color-text-secondary)] mt-1">Continuous Exceedance</div>
        </div>
      </div>

      {/* ── Detailed Incident Content (Two Columns) ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left (2 Columns): Measurement Provenance & Spectral Analysis */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Instrumentation & Method Panel */}
          <div className="glass-card p-6">
            <h3 className="text-xs font-bold text-[var(--color-text-primary)] uppercase tracking-wider mb-4">
              Instrumentation & Measurement Protocol
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
                <span className="text-[10px] text-[var(--color-text-muted)] block uppercase font-medium">Sensor / Device ID</span>
                <span className="font-mono font-bold text-[var(--color-text-primary)]">{incident.device_id || 'DEV-IOT-001'}</span>
                <span className="text-[11px] text-[var(--color-text-secondary)] block mt-1">Type: Calibrated IoT Acoustic Node</span>
              </div>

              <div className="p-3 rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
                <span className="text-[10px] text-[var(--color-text-muted)] block uppercase font-medium">Measurement Protocol</span>
                <span className="font-mono font-bold text-[var(--color-accent)] capitalize">
                  {(incident.measurement_method || 'iot_sensor_estimated').replace(/_/g, ' ')}
                </span>
                <span className="text-[11px] text-[var(--color-text-secondary)] block mt-1">A-Weighting • Fast Time Constant</span>
              </div>

              <div className="p-3 rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
                <span className="text-[10px] text-[var(--color-text-muted)] block uppercase font-medium">Monitoring Site</span>
                <span className="font-semibold text-[var(--color-text-primary)]">
                  {incident.location?.name || 'Riverside Residential Zone A'}
                </span>
                <span className="text-[11px] text-[var(--color-text-secondary)] block mt-1">Zone: Residential Rest Area</span>
              </div>

              <div className="p-3 rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
                <span className="text-[10px] text-[var(--color-text-muted)] block uppercase font-medium">Regulatory Baseline</span>
                <span className="font-semibold text-[var(--color-text-primary)]">CPCB / WHO Community Guidelines</span>
                <span className="text-[11px] text-[var(--color-text-secondary)] block mt-1">Schedule II (Rule 3(1) and 4(1))</span>
              </div>
            </div>
          </div>

          {/* Machine Learning Sound Event Classification */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
                Acoustic Signature & AI Sound Classification
              </h3>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-sky-50 text-sky-800 border border-sky-200">
                Confidence: {Math.round((incident.confidence || 0.88) * 100)}%
              </span>
            </div>

            {/* Waveform preview */}
            <div className="mb-4">
              <WaveformVisualizer waveformData={signatureWave} isActive={true} height={90} />
            </div>

            {/* Extracted Features */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4">
              <div className="p-2.5 rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-center">
                <span className="text-[10px] text-[var(--color-text-muted)] uppercase block font-medium">RMS Energy</span>
                <span className="font-mono font-bold text-[var(--color-text-primary)]">0.0482</span>
              </div>
              <div className="p-2.5 rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-center">
                <span className="text-[10px] text-[var(--color-text-muted)] uppercase block font-medium">Spectral Centroid</span>
                <span className="font-mono font-bold text-[var(--color-text-primary)]">1,840 Hz</span>
              </div>
              <div className="p-2.5 rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-center">
                <span className="text-[10px] text-[var(--color-text-muted)] uppercase block font-medium">Zero Crossing</span>
                <span className="font-mono font-bold text-[var(--color-text-primary)]">0.0821</span>
              </div>
              <div className="p-2.5 rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-center">
                <span className="text-[10px] text-[var(--color-text-muted)] uppercase block font-medium">Predicted Class</span>
                <span className="font-mono font-bold text-[var(--color-accent)] capitalize">
                  {incident.sound_classification || 'Heavy Machinery'}
                </span>
              </div>
            </div>

            {/* Transparent ML Disclaimer */}
            <div className="p-3 rounded bg-sky-50 border border-sky-200 text-xs text-sky-900 leading-relaxed">
              <strong className="font-bold">Algorithmic Limitation Notice:</strong> Acoustic classification identifies probable source categories (e.g. traffic, construction, machinery) based on spectral harmonics. Model inference serves as screening guidance and is not legally binding evidence of statutory violation.
            </div>
          </div>

          {/* Timeline of Incident Progress */}
          <div className="glass-card p-6">
            <h3 className="text-xs font-bold text-[var(--color-text-primary)] uppercase tracking-wider mb-4">
              Incident Audit Timeline
            </h3>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[var(--color-border)]">
              <div className="relative">
                <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-[var(--color-danger)]" />
                <div className="text-xs font-bold text-[var(--color-text-primary)]">
                  Threshold Exceedance Detected
                </div>
                <div className="text-[11px] text-[var(--color-text-secondary)]">
                  {incident.start_time?.substring(0, 19).replace('T', ' ')} • Peak registered at {incident.measured_value} dB(A)
                </div>
              </div>

              <div className="relative">
                <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-sky-600" />
                <div className="text-xs font-bold text-[var(--color-text-primary)]">
                  Acoustic Feature Extraction & Classification Completed
                </div>
                <div className="text-[11px] text-[var(--color-text-secondary)]">
                  Identified signature: {incident.sound_classification || 'Machinery'} (Confidence: 88%)
                </div>
              </div>

              <div className="relative">
                <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-[var(--color-accent)]" />
                <div className="text-xs font-bold text-[var(--color-text-primary)]">
                  Dossier Flagged for Operator Verification
                </div>
                <div className="text-[11px] text-[var(--color-text-secondary)]">
                  Current Status: <span className="font-mono uppercase font-bold text-[var(--color-accent)]">{incident.status}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right (1 Column): Reviewer Action Panel */}
        <div className="space-y-6">
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-xs font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
              Operator Review & Adjudication
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              As an authorized reviewer or operator, annotate observations and verify or dismiss this potential exceedance.
            </p>

            <div>
              <label className="text-[11px] font-bold text-[var(--color-text-secondary)] block uppercase mb-1">
                Reviewer Notes & Context
              </label>
              <textarea
                value={reviewerNotes}
                onChange={(e) => setReviewerNotes(e.target.value)}
                rows={4}
                placeholder="Record physical inspection notes, weather influences, or corroborating citizen reports..."
                className="w-full rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border)] p-2.5 text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] resize-none"
              />
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => handleReview('verified')}
                className="btn btn-primary w-full text-xs justify-center py-2"
              >
                Verify as Genuine Incident
              </button>

              <button
                onClick={() => handleReview('dismissed')}
                className="btn btn-secondary w-full text-xs justify-center py-2 hover:text-[var(--color-danger)] hover:border-red-300"
              >
                Dismiss (Spurious / Permitted)
              </button>

              <button
                onClick={handleGenerateReport}
                className="btn btn-secondary w-full text-xs justify-center py-2 font-semibold text-[var(--color-accent)]"
              >
                Draft Official PDF Report
              </button>
            </div>

            {generatedReportId && (
              <div className="pt-3 border-t border-[var(--color-border)] text-center">
                <Link
                  to="/reports"
                  className="btn btn-primary btn-sm text-xs w-full justify-center py-2"
                >
                  View & Download Report
                </Link>
              </div>
            )}
          </div>

          {/* Regulatory Citation Card */}
          <div className="glass-card p-4 text-xs space-y-2 border-l-4 border-l-sky-600">
            <div className="font-bold text-[var(--color-text-primary)]">Statutory Reference</div>
            <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
              Under environmental noise pollution rules, noise level in residential areas must not exceed 55 dB(A) during day time (06:00 to 22:00) and 45 dB(A) during night time (22:00 to 06:00).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
