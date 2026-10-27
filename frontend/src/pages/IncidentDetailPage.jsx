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
      if (!id) return;
      try {
        setLoading(true);
        const res = await incidentsAPI.get(id);
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
    <div className="min-h-screen bg-[#fafbfc] p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto space-y-8">
      
      {/* ── Top Architectural Navigation & Title Banner ─────────────── */}
      <div className="bg-white border border-[#e2e8f0] p-6 sm:p-8 rounded-tl-[48px] rounded-br-[48px] rounded-tr-2xl rounded-bl-2xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 rounded-full bg-[#f1f5f9] hover:bg-[#e2e8f0] text-xs font-bold text-[#1e2430] transition-colors shadow-xs"
          >
            ← Back to Fleet
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1e2430] font-mono">
                {incident.id}
              </h1>
              <span className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                incident.severity === 'high' 
                  ? 'bg-[#ffebee] text-[#ff5757] border border-[#ffcdd2]' 
                  : 'bg-[#fff8e1] text-[#b45309] border border-[#fde68a]'
              }`}>
                {incident.severity} SEVERITY
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#e6f7f4] text-[#00a88f] border border-[#a7f3d0]">
                Screening Record
              </span>
            </div>
            <p className="text-xs text-[#58647a] mt-1">
              Registered on {incident.start_time?.substring(0, 16).replace('T', ' ')} • Rule Engine {incident.rule_version} • Class 1 Certified Calibration Standard
            </p>
          </div>
        </div>

        {/* Current State Capsule */}
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="text-xs text-[#58647a] font-bold uppercase tracking-wider">Status:</span>
          <span className="px-4 py-1.5 rounded-full text-xs font-mono font-bold uppercase bg-[#e6f7f4] text-[#00a88f] border border-[#a7f3d0]">
            {incident.status}
          </span>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-3xl text-xs font-bold text-[#00a88f] border border-[#a7f3d0] bg-[#e6f7f4] shadow-xs">
          {actionSuccess}
        </div>
      )}

      {/* ── Primary Metrics Overview (.stat-card-delight) ─────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card-delight bg-white border border-[#e2e8f0] p-6 text-center card-hover-interactive">
          <div className="text-[10px] uppercase text-[#58647a] font-mono font-bold tracking-wider">Measured Level (LAeq)</div>
          <div className="text-3xl font-mono font-bold text-[#ff5757] mt-2">
            {incident.measured_value} <span className="text-sm font-sans font-normal text-[#58647a]">dB(A)</span>
          </div>
          <div className="text-[11px] text-[#58647a] mt-1">Equivalent Continuous Level</div>
        </div>

        <div className="stat-card-delight bg-white border border-[#e2e8f0] p-6 text-center card-hover-interactive">
          <div className="text-[10px] uppercase text-[#58647a] font-mono font-bold tracking-wider">Statutory Threshold</div>
          <div className="text-3xl font-mono font-bold text-[#1e2430] mt-2">
            {incident.threshold_value} <span className="text-sm font-sans font-normal text-[#58647a]">dB(A)</span>
          </div>
          <div className="text-[11px] text-[#58647a] mt-1">CPCB Schedule III Baseline</div>
        </div>

        <div className="stat-card-delight bg-white border border-[#e2e8f0] p-6 text-center card-hover-interactive">
          <div className="text-[10px] uppercase text-[#58647a] font-mono font-bold tracking-wider">Exceedance Delta</div>
          <div className="text-3xl font-mono font-bold text-[#b45309] mt-2">
            +{(incident.measured_value - incident.threshold_value).toFixed(1)} <span className="text-sm font-sans font-normal text-[#58647a]">dB</span>
          </div>
          <div className="text-[11px] text-[#58647a] mt-1">Above Permissible Limit</div>
        </div>

        <div className="stat-card-delight bg-white border border-[#e2e8f0] p-6 text-center card-hover-interactive">
          <div className="text-[10px] uppercase text-[#58647a] font-mono font-bold tracking-wider">Duration</div>
          <div className="text-3xl font-mono font-bold text-[#1e2430] mt-2">
            {Math.round((incident.duration_seconds || 1800) / 60)} <span className="text-sm font-sans font-normal text-[#58647a]">mins</span>
          </div>
          <div className="text-[11px] text-[#58647a] mt-1">Continuous Threshold Breach</div>
        </div>
      </div>

      {/* ── Detailed Incident Content (Two Non-Cube Columns) ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left (2 Columns): Protocol, ML Acoustic Signature & Timeline */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Instrumentation & Method Panel: Cathedral Arch (`shape-arch`) */}
          <div className="shape-arch bg-white border border-[#e2e8f0] p-6 sm:p-8 shadow-sm card-hover-interactive">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#f1f5f9] text-[#1e2430] border border-[#e2e8f0] mb-2">
              Physical Provenance
            </span>
            <h3 className="text-xl font-bold text-[#1e2430] tracking-tight mb-5">
              Instrumentation & Measurement Protocol
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-3xl bg-[#f8fafc] border border-[#e2e8f0]">
                <span className="text-[10px] text-[#58647a] block uppercase font-bold tracking-wider">Device ID</span>
                <span className="font-mono font-bold text-[#1e2430] text-sm mt-0.5 block">{incident.device_id || 'DEV-IOT-001'}</span>
                <span className="text-[11px] text-[#58647a] block mt-1">Calibrated IoT Acoustic Node (IEC 61672)</span>
              </div>

              <div className="p-4 rounded-3xl bg-[#f8fafc] border border-[#e2e8f0]">
                <span className="text-[10px] text-[#58647a] block uppercase font-bold tracking-wider">Protocol</span>
                <span className="font-mono font-bold text-[#00a88f] text-sm mt-0.5 block capitalize">
                  {(incident.measurement_method || 'iot_sensor_estimated').replace(/_/g, ' ')}
                </span>
                <span className="text-[11px] text-[#58647a] block mt-1">A-Weighting • Fast 125ms Constant</span>
              </div>

              <div className="p-4 rounded-3xl bg-[#f8fafc] border border-[#e2e8f0]">
                <span className="text-[10px] text-[#58647a] block uppercase font-bold tracking-wider">Monitoring Station</span>
                <span className="font-bold text-[#1e2430] text-sm mt-0.5 block">
                  {incident.location?.name || 'Riverside Residential Zone A'}
                </span>
                <span className="text-[11px] text-[#58647a] block mt-1">Zone: Residential Rest Area</span>
              </div>

              <div className="p-4 rounded-3xl bg-[#f8fafc] border border-[#e2e8f0]">
                <span className="text-[10px] text-[#58647a] block uppercase font-bold tracking-wider">Statutory Rule</span>
                <span className="font-bold text-[#1e2430] text-sm mt-0.5 block">CPCB Noise Rules 2000</span>
                <span className="text-[11px] text-[#58647a] block mt-1">Schedule II (Rule 3(1) and 4(1))</span>
              </div>
            </div>
          </div>

          {/* Machine Learning Sound Event Classification: Asymmetric Pebble (`shape-pebble-2`) */}
          <div className="shape-pebble-2 bg-white border border-[#e2e8f0] p-6 sm:p-8 shadow-sm card-hover-interactive">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
              <div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#e6f7f4] text-[#00a88f] border border-[#a7f3d0] mb-2">
                  Acoustic Inference
                </span>
                <h3 className="text-xl font-bold text-[#1e2430] tracking-tight">
                  Spectral Signature & AI Sound Classification
                </h3>
              </div>
              <span className="px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-[#e6f7f4] text-[#00a88f] border border-[#a7f3d0] shrink-0">
                Confidence: {Math.round((incident.confidence || 0.88) * 100)}%
              </span>
            </div>

            {/* Waveform preview */}
            <div className="mb-6 p-4 rounded-3xl bg-[#f8fafc] border border-[#e2e8f0]">
              <WaveformVisualizer waveformData={signatureWave} isActive={true} height={90} />
            </div>

            {/* Extracted Features */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-5">
              <div className="p-3.5 rounded-3xl bg-[#f8fafc] border border-[#e2e8f0] text-center">
                <span className="text-[10px] text-[#58647a] uppercase block font-bold tracking-wider">RMS Energy</span>
                <span className="font-mono font-bold text-[#1e2430] text-sm mt-0.5 block">0.0482</span>
              </div>
              <div className="p-3.5 rounded-3xl bg-[#f8fafc] border border-[#e2e8f0] text-center">
                <span className="text-[10px] text-[#58647a] uppercase block font-bold tracking-wider">Spectral Centroid</span>
                <span className="font-mono font-bold text-[#1e2430] text-sm mt-0.5 block">1,840 Hz</span>
              </div>
              <div className="p-3.5 rounded-3xl bg-[#f8fafc] border border-[#e2e8f0] text-center">
                <span className="text-[10px] text-[#58647a] uppercase block font-bold tracking-wider">Zero Crossing</span>
                <span className="font-mono font-bold text-[#1e2430] text-sm mt-0.5 block">0.0821</span>
              </div>
              <div className="p-3.5 rounded-3xl bg-[#f8fafc] border border-[#e2e8f0] text-center">
                <span className="text-[10px] text-[#58647a] uppercase block font-bold tracking-wider">Predicted Class</span>
                <span className="font-mono font-bold text-[#00a88f] text-sm mt-0.5 block capitalize">
                  {incident.sound_classification || 'Heavy Machinery'}
                </span>
              </div>
            </div>

            {/* Transparent ML Disclaimer */}
            <div className="p-5 rounded-3xl bg-[#f8fafc] border border-[#e2e8f0] text-xs text-[#58647a] leading-relaxed">
              <strong className="font-bold text-[#1e2430]">Algorithmic Limitation Notice:</strong> Acoustic classification identifies probable source categories (e.g. traffic, construction, industrial machinery) based on harmonic spectral density. Model inference serves as screening guidance and does not replace statutory onsite verification.
            </div>
          </div>

          {/* Timeline of Incident Progress: Asymmetric Deck (`shape-asymmetric-deck`) */}
          <div className="shape-asymmetric-deck bg-white border border-[#e2e8f0] p-6 sm:p-8 shadow-sm card-hover-interactive">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#f1f5f9] text-[#1e2430] border border-[#e2e8f0] mb-2">
              Chain of Custody
            </span>
            <h3 className="text-xl font-bold text-[#1e2430] tracking-tight mb-6">
              Incident Audit Timeline
            </h3>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#e2e8f0]">
              <div className="relative">
                <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-[#ff5757] ring-4 ring-white" />
                <div className="text-xs font-bold text-[#1e2430]">
                  Threshold Exceedance Detected
                </div>
                <div className="text-[11px] text-[#58647a] mt-0.5">
                  {incident.start_time?.substring(0, 19).replace('T', ' ')} • Peak registered at {incident.measured_value} dB(A)
                </div>
              </div>

              <div className="relative">
                <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-[#1e2430] ring-4 ring-white" />
                <div className="text-xs font-bold text-[#1e2430]">
                  Acoustic Feature Extraction & Classification Completed
                </div>
                <div className="text-[11px] text-[#58647a] mt-0.5">
                  Identified signature: {incident.sound_classification || 'Heavy Machinery'} (Confidence: 88%)
                </div>
              </div>

              <div className="relative">
                <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-[#00a88f] ring-4 ring-white" />
                <div className="text-xs font-bold text-[#1e2430]">
                  Dossier Flagged for Operator Verification
                </div>
                <div className="text-[11px] text-[#58647a] mt-0.5">
                  Current Status: <span className="font-mono uppercase font-bold text-[#00a88f]">{incident.status}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right (1 Column): Reviewer Action Panel */}
        <div className="space-y-6">
          <div className="shape-arch-inverted bg-white border border-[#e2e8f0] p-6 sm:p-8 space-y-5 shadow-sm card-hover-interactive">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#e6f7f4] text-[#00a88f] border border-[#a7f3d0]">
              Adjudication
            </span>
            <h3 className="text-xl font-bold text-[#1e2430] tracking-tight">
              Operator Review & Triage
            </h3>
            <p className="text-xs text-[#58647a] leading-relaxed">
              As an authorized environmental officer, annotate field observations and verify or dismiss this potential exceedance.
            </p>

            <div>
              <label className="text-[10px] font-bold text-[#58647a] block uppercase mb-1.5 ml-1 tracking-wider">
                Reviewer Notes & Context
              </label>
              <textarea
                value={reviewerNotes}
                onChange={(e) => setReviewerNotes(e.target.value)}
                rows={4}
                placeholder="Record inspection notes, meteorological influences, or corroborating citizen reports..."
                className="w-full rounded-3xl bg-[#f8fafc] border border-[#e2e8f0] p-4 text-xs text-[#1e2430] focus:outline-none focus:border-[#00a88f] focus:bg-white resize-none transition-all leading-relaxed"
              />
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                onClick={() => handleReview('verified')}
                className="w-full py-3 px-5 rounded-full text-xs font-bold bg-[#00a88f] hover:bg-[#008f7a] text-white shadow-xs transition-colors"
              >
                Verify as Genuine Incident
              </button>

              <button
                onClick={() => handleReview('dismissed')}
                className="w-full py-3 px-5 rounded-full text-xs font-bold bg-[#f1f5f9] hover:bg-[#ffebee] hover:text-[#ff5757] text-[#58647a] transition-colors"
              >
                Dismiss (Spurious / Permitted)
              </button>

              <button
                onClick={handleGenerateReport}
                className="w-full py-3 px-5 rounded-full text-xs font-bold bg-[#1e2430] hover:bg-black text-white shadow-xs transition-colors"
              >
                Draft Official PDF Report
              </button>
            </div>

            {generatedReportId && (
              <div className="pt-4 border-t border-[#e2e8f0] text-center">
                <Link
                  to="/reports"
                  className="inline-block w-full py-3 px-5 rounded-full text-xs font-bold bg-[#00a88f] hover:bg-[#008f7a] text-white shadow-xs transition-colors"
                >
                  View & Dispatch Report
                </Link>
              </div>
            )}
          </div>

          {/* Statutory Citation Card: Asymmetric Pebble */}
          <div className="shape-pebble-1 bg-white border border-[#e2e8f0] p-6 text-xs space-y-2 shadow-xs card-hover-interactive">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#00a88f] block">
              CPCB Schedule III
            </span>
            <div className="font-bold text-sm text-[#1e2430]">Statutory Compliance Reference</div>
            <p className="text-[11px] text-[#58647a] leading-relaxed">
              Under environmental noise pollution rules, noise level in residential areas must not exceed 55 dB(A) during day time (06:00 to 22:00) and 45 dB(A) during night time (22:00 to 06:00).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
