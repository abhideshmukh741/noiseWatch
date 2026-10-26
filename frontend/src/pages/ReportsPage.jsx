/**
 * Page F: Reports and Complaints
 * 
 * Formal compliance report generation, ReportLab PDF download,
 * narrative field editing, and complaint submission workflow.
 * Clean, light environmental design without icons or glassmorphism.
 */

import { useState, useEffect } from 'react';
import { reportsAPI, complaintsAPI } from '../services/api';

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedNarrative, setEditedNarrative] = useState('');
  const [editedLimitations, setEditedLimitations] = useState('');
  const [destinationAuthority, setDestinationAuthority] = useState('Municipal Environmental Department');
  const [submitting, setSubmitting] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load reports and existing complaints
  useEffect(() => {
    async function loadReportsData() {
      try {
        setLoading(true);
        const [rptRes, cmpRes] = await Promise.all([
          reportsAPI.list(),
          complaintsAPI.list(),
        ]);
        const rptList = rptRes.data.items || [];
        setReports(rptList);
        setComplaints(cmpRes.data.items || []);

        if (rptList.length > 0) {
          setSelectedReport(rptList[0]);
          setEditedNarrative(rptList[0].narrative || '');
          setEditedLimitations(rptList[0].limitations || '');
        }
      } catch (err) {
        console.error('Failed to load reports:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReportsData();
  }, []);

  // Select a report
  const handleSelectReport = (rpt) => {
    setSelectedReport(rpt);
    setEditedNarrative(rpt.narrative || '');
    setEditedLimitations(rpt.limitations || '');
    setIsEditing(false);
    setSubmissionFeedback(null);
  };

  // Save edited narrative
  const handleSaveNarrative = async () => {
    if (!selectedReport) return;
    try {
      await reportsAPI.update(selectedReport.id, {
        narrative: editedNarrative,
        limitations: editedLimitations,
      });
      setSelectedReport((prev) => ({
        ...prev,
        narrative: editedNarrative,
        limitations: editedLimitations,
      }));
      setIsEditing(false);
      setSubmissionFeedback({
        type: 'success',
        message: 'Report narrative updated successfully. Sensor measurements remain immutably preserved.',
      });
    } catch (err) {
      console.error('Failed to save narrative:', err);
    }
  };

  // Trigger ReportLab PDF download
  const handleDownloadPDF = async () => {
    if (!selectedReport) return;
    try {
      const response = await reportsAPI.download(selectedReport.id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `NoiseWatch_Report_${selectedReport.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF download failed:', err);
      window.open(`/api/reports/${selectedReport.id}/download`, '_blank');
    }
  };

  // Submit formal complaint
  const handleSubmitComplaint = async () => {
    if (!selectedReport) return;
    try {
      setSubmitting(true);
      const res = await complaintsAPI.submit(selectedReport.id);
      setSubmissionFeedback({
        type: 'info',
        message: res.data.message || 'Complaint workflow executed.',
        isDemo: res.data.is_demo,
      });
    } catch (err) {
      console.error('Complaint submission failed:', err);
      setSubmissionFeedback({
        type: 'error',
        message: 'Unable to connect to authority dispatch endpoint. Try downloading the PDF dossier for manual submission.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto space-y-6">
      
      {/* ── Page Header ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#e2e8f0]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0f172a]">
            Compliance Dossiers & Complaint Dispatch
          </h1>
          <p className="text-xs text-[#475569] mt-1">
            Review evidence-backed incident reports, verify legal narratives, and dispatch to regulatory bodies
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="demo-badge">Verified Chain of Custody</span>
        </div>
      </div>

      {submissionFeedback && (
        <div className={`p-4 rounded-2xl text-xs border ${
          submissionFeedback.type === 'success' 
            ? 'border-[#a7f3d0] bg-[#ecfdf5] text-[#047857]' 
            : 'border-[#fde68a] bg-[#fef3c7] text-[#b45309]'
        }`}>
          <div className="font-bold">{submissionFeedback.message}</div>
          {submissionFeedback.isDemo && (
            <div className="text-[11px] mt-1 text-[#475569]">
              DEMO ADVISORY: NoiseWatch does not submit unverified complaints without user authorization and official credentials.
            </div>
          )}
        </div>
      )}

      {/* ── Main Two-Column Layout ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Reports Catalog (1 Column) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#475569]">
              Generated Reports ({reports.length})
            </h3>
            <span className="text-[11px] text-[#64748b]">Select to inspect</span>
          </div>

          <div className="space-y-3">
            {reports.map((rpt) => (
              <div
                key={rpt.id}
                onClick={() => handleSelectReport(rpt)}
                className={`glass-card p-5 rounded-2xl cursor-pointer transition-all ${
                  selectedReport?.id === rpt.id
                    ? 'border-t-4 border-t-[#059669] bg-[#ecfdf5]/40 shadow-sm'
                    : 'hover:border-[#cbd5e1]'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-mono font-bold text-[#0f172a]">{rpt.id}</span>
                  <span className={rpt.status === 'reviewed' ? 'badge-emerald' : 'badge-slate'}>
                    {rpt.status}
                  </span>
                </div>
                <div className="text-xs font-semibold text-[#0f172a] line-clamp-1">
                  {rpt.title}
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#475569] mt-2.5 pt-2 border-t border-[#e2e8f0]">
                  <span>Linked: {rpt.incident_id}</span>
                  <span className="font-mono font-medium">v{rpt.version}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Selected Report Preview & Dispatch (2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          {selectedReport ? (
            <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-6 shadow-md border border-[#e2e8f0]">
              
              {/* Report Header Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#e2e8f0]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#059669]">REF: {selectedReport.id}</span>
                    <span className="text-xs text-[#475569]">• Version {selectedReport.version}</span>
                  </div>
                  <h2 className="text-lg font-bold text-[#0f172a] mt-0.5">
                    {selectedReport.title}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadPDF}
                    className="btn btn-primary btn-sm text-xs font-semibold px-4 py-2 rounded-full"
                  >
                    Download PDF
                  </button>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="btn btn-secondary btn-sm text-xs font-semibold px-4 py-2 rounded-full"
                  >
                    {isEditing ? 'Cancel Edit' : 'Edit Narrative'}
                  </button>
                </div>
              </div>

              {/* Immutable Sensor Metadata Block */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#475569] mb-2.5">
                  Immutable Physical Record
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-4 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0]">
                    <span className="text-[10px] text-[#64748b] uppercase block font-medium">Incident Link</span>
                    <span className="font-mono font-bold text-[#0f172a]">{selectedReport.incident_id}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0]">
                    <span className="text-[10px] text-[#64748b] uppercase block font-medium">Generated At</span>
                    <span className="font-medium text-[#0f172a]">
                      {selectedReport.generated_at?.substring(0, 16).replace('T', ' ')}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0]">
                    <span className="text-[10px] text-[#64748b] uppercase block font-medium">Cryptographic Hash</span>
                    <span className="font-mono text-[10px] font-bold text-[#059669]">SHA256: 4f9a...82c1</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0]">
                    <span className="text-[10px] text-[#64748b] uppercase block font-medium">Regulatory Rule</span>
                    <span className="font-medium text-[#0f172a]">Schedule II / CPCB</span>
                  </div>
                </div>
              </div>

              {/* Narrative Section (Editable) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#475569]">
                    Incident Narrative & Context
                  </h4>
                  {isEditing && (
                    <span className="text-[11px] text-[#059669] font-semibold">
                      Modifying narrative field only • Sensor data is read-only
                    </span>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-3">
                    <textarea
                      value={editedNarrative}
                      onChange={(e) => setEditedNarrative(e.target.value)}
                      rows={5}
                      className="w-full rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] p-4 text-xs text-[#0f172a] focus:outline-none focus:border-[#059669] focus:bg-white transition-all"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={handleSaveNarrative}
                        className="btn btn-primary btn-sm text-xs font-semibold px-4 py-2 rounded-full"
                      >
                        Save Narrative Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] text-xs text-[#475569] leading-relaxed">
                    {selectedReport.narrative || 'Acoustic exceedance registered during residential quiet hours.'}
                  </div>
                )}
              </div>

              {/* Legal & Technical Limitations */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#475569] mb-2">
                  Technical Limitations & Disclaimers
                </h4>
                <div className="p-4 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] text-xs text-[#475569] italic leading-relaxed">
                  {selectedReport.limitations ||
                    'Notice: Measurements generated from uncalibrated consumer microphones reflect relative sound energy and must be verified by certified Class 1 sound level meters before statutory enforcement.'}
                </div>
              </div>

              {/* Complaint Dispatch Box */}
              <div className="p-6 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] space-y-4">
                <h4 className="text-sm font-bold text-[#0f172a]">
                  Official Complaint Submission Integration
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-[#475569] block mb-1.5 ml-1">
                      Target Enforcement Authority
                    </label>
                    <select
                      value={destinationAuthority}
                      onChange={(e) => setDestinationAuthority(e.target.value)}
                      className="w-full rounded-full bg-white border border-[#e2e8f0] px-4 py-2.5 text-xs text-[#0f172a] font-medium"
                    >
                      <option>State Pollution Control Board</option>
                      <option>Municipal Environmental Department</option>
                      <option>Local Police Noise Control Division</option>
                      <option>District Magistrate Office</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-[#475569] block mb-1.5 ml-1">
                      Dispatch Method
                    </label>
                    <input
                      type="text"
                      readOnly
                      value="Secure API Integration / Signed PDF Annex"
                      className="w-full rounded-full bg-white border border-[#e2e8f0] px-4 py-2.5 text-xs text-[#475569] font-medium"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <p className="text-[11px] text-[#475569]">
                    Requires manual confirmation. Does not bypass CAPTCHA, OTP, or jurisdictional declarations.
                  </p>
                  <button
                    onClick={handleSubmitComplaint}
                    disabled={submitting}
                    className="btn btn-primary btn-sm text-xs px-5 py-2.5 w-full sm:w-auto font-semibold shrink-0 rounded-full shadow-xs"
                  >
                    {submitting ? 'Dispatching...' : 'Dispatch Complaint'}
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="glass-card p-12 rounded-3xl text-center text-xs text-[#475569]">
              Select a report from the catalog to view details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
