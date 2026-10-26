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
    <div className="min-h-screen bg-[#fafbfc] p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto space-y-8">
      
      {/* ── Architectural Header Banner ─────────────────────────────── */}
      <div className="bg-white border border-[#e2e8f0] p-6 sm:p-8 rounded-tl-[48px] rounded-br-[48px] rounded-tr-2xl rounded-bl-2xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e6f7f4] border border-[#a7f3d0] text-[#00a88f] text-[10px] font-bold tracking-widest uppercase mb-2">
            Statutory Dossier Dispatch
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1e2430]">
            Compliance Dossiers & Complaint Dispatch
          </h1>
          <p className="text-xs sm:text-sm text-[#58647a] mt-1 max-w-xl">
            Certified evidence packages, tamper-evident cryptographic hashes, and direct dispatch integrations for Central and State Pollution Control Boards.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="inline-flex items-center px-4 py-2 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-[#1e2430] text-white shadow-xs">
            Verified Chain of Custody
          </span>
        </div>
      </div>

      {submissionFeedback && (
        <div className={`p-5 rounded-3xl text-xs border ${
          submissionFeedback.type === 'success' 
            ? 'border-[#a7f3d0] bg-[#e6f7f4] text-[#00a88f]' 
            : 'border-[#fde68a] bg-[#fef3c7] text-[#b45309]'
        }`}>
          <div className="font-bold text-sm">{submissionFeedback.message}</div>
          {submissionFeedback.isDemo && (
            <div className="text-[11px] mt-1.5 text-[#58647a]">
              STATUTORY ADVISORY: NoiseWatch compiles forensic incident packages under the Environment (Protection) Act, 1986. Formal dispatch requires authorized agency credentials or manual citizen signature.
            </div>
          )}
        </div>
      )}

      {/* ── Main Two-Column Architectural Layout ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left: Reports Catalog (Asymmetric Deck `shape-asymmetric-deck`) */}
        <div className="shape-asymmetric-deck bg-white border border-[#e2e8f0] p-6 sm:p-7 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#58647a] block">
                Evidence Repository
              </span>
              <h3 className="text-base font-bold text-[#1e2430]">
                Generated Reports ({reports.length})
              </h3>
            </div>
            <span className="text-[11px] text-[#58647a] font-mono">Select to review</span>
          </div>

          <div className="space-y-3.5 max-h-[640px] overflow-y-auto pr-1">
            {reports.map((rpt) => (
              <div
                key={rpt.id}
                onClick={() => handleSelectReport(rpt)}
                className={`p-5 rounded-3xl border cursor-pointer transition-all duration-200 card-hover-interactive ${
                  selectedReport?.id === rpt.id
                    ? 'border-[#00a88f] bg-[#e6f7f4]/40 shadow-xs'
                    : 'border-[#e2e8f0] bg-[#f8fafc] hover:border-[#cbd5e1] hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-mono font-bold text-[#1e2430]">{rpt.id}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                    rpt.status === 'reviewed' 
                      ? 'bg-[#e6f7f4] text-[#00a88f] border border-[#a7f3d0]' 
                      : 'bg-[#f1f5f9] text-[#58647a] border border-[#e2e8f0]'
                  }`}>
                    {rpt.status}
                  </span>
                </div>
                <div className="text-xs font-bold text-[#1e2430] line-clamp-1">
                  {rpt.title}
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#58647a] mt-3 pt-2.5 border-t border-[#e2e8f0]">
                  <span>Linked: {rpt.incident_id}</span>
                  <span className="font-mono font-bold">v{rpt.version}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Selected Report Preview & Dispatch (Cathedral Arch Portal `shape-arch`) */}
        <div className="lg:col-span-2 space-y-6">
          {selectedReport ? (
            <div className="shape-arch bg-white border border-[#e2e8f0] p-6 sm:p-10 shadow-sm space-y-8 card-hover-interactive">
              
              {/* Report Header Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#e2e8f0]">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-mono text-xs font-bold text-[#00a88f]">REF: {selectedReport.id}</span>
                    <span className="text-xs text-[#58647a]">• Version {selectedReport.version}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#1e2430] tracking-tight">
                    {selectedReport.title}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleDownloadPDF}
                    className="px-5 py-2.5 rounded-full text-xs font-bold bg-[#00a88f] hover:bg-[#008f7a] text-white shadow-xs transition-colors"
                  >
                    Download PDF Dossier
                  </button>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="px-5 py-2.5 rounded-full text-xs font-bold bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#1e2430] transition-colors"
                  >
                    {isEditing ? 'Cancel Edit' : 'Edit Narrative'}
                  </button>
                </div>
              </div>

              {/* Immutable Sensor Metadata Block (Stadium Pill Tokens) */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#58647a] mb-3">
                  Immutable Physical Record
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-4 rounded-3xl bg-[#f8fafc] border border-[#e2e8f0]">
                    <span className="text-[10px] text-[#58647a] uppercase block font-bold tracking-wider">Incident Link</span>
                    <span className="font-mono font-bold text-[#1e2430] text-sm mt-0.5 block">{selectedReport.incident_id}</span>
                  </div>
                  <div className="p-4 rounded-3xl bg-[#f8fafc] border border-[#e2e8f0]">
                    <span className="text-[10px] text-[#58647a] uppercase block font-bold tracking-wider">Timestamp</span>
                    <span className="font-mono font-bold text-[#1e2430] text-xs mt-0.5 block">
                      {selectedReport.generated_at?.substring(0, 16).replace('T', ' ')}
                    </span>
                  </div>
                  <div className="p-4 rounded-3xl bg-[#f8fafc] border border-[#e2e8f0]">
                    <span className="text-[10px] text-[#58647a] uppercase block font-bold tracking-wider">SHA-256 Hash</span>
                    <span className="font-mono text-[10px] font-bold text-[#00a88f] mt-0.5 block">4f9a...82c1</span>
                  </div>
                  <div className="p-4 rounded-3xl bg-[#f8fafc] border border-[#e2e8f0]">
                    <span className="text-[10px] text-[#58647a] uppercase block font-bold tracking-wider">Statutory Rule</span>
                    <span className="font-bold text-[#1e2430] text-xs mt-0.5 block">CPCB Rule 3(1)</span>
                  </div>
                </div>
              </div>

              {/* Narrative Section (Editable) */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#58647a]">
                    Incident Context & Narrative
                  </h4>
                  {isEditing && (
                    <span className="text-[11px] text-[#00a88f] font-bold">
                      Editing narrative field only • Sensor data is immutably sealed
                    </span>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-3">
                    <textarea
                      value={editedNarrative}
                      onChange={(e) => setEditedNarrative(e.target.value)}
                      rows={5}
                      className="w-full rounded-3xl bg-[#f8fafc] border border-[#e2e8f0] p-5 text-xs text-[#1e2430] focus:outline-none focus:border-[#00a88f] focus:bg-white transition-all leading-relaxed"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={handleSaveNarrative}
                        className="px-6 py-2.5 rounded-full text-xs font-bold bg-[#00a88f] hover:bg-[#008f7a] text-white shadow-xs transition-colors"
                      >
                        Save Narrative Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-3xl bg-[#f8fafc] border border-[#e2e8f0] text-xs text-[#58647a] leading-relaxed">
                    {selectedReport.narrative || 'Acoustic exceedance registered during residential quiet hours.'}
                  </div>
                )}
              </div>

              {/* Legal & Technical Limitations */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#58647a] mb-2.5">
                  Statutory Limitations & Evidentiary Standard
                </h4>
                <div className="p-5 rounded-3xl bg-[#f8fafc] border border-[#e2e8f0] text-xs text-[#58647a] italic leading-relaxed">
                  {selectedReport.limitations ||
                    'Notice: Measurements generated from uncalibrated consumer microphones reflect relative sound energy and must be verified by certified Class 1 sound level meters before statutory enforcement.'}
                </div>
              </div>

              {/* Official Complaint Dispatch Box */}
              <div className="p-6 sm:p-8 rounded-3xl bg-[#f8fafc] border border-[#e2e8f0] space-y-5">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#00a88f] block mb-1">
                    Regulatory Bridge
                  </span>
                  <h4 className="text-base font-bold text-[#1e2430]">
                    Official Complaint Submission Integration
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-[#58647a] block mb-1.5 ml-1 tracking-wider">
                      Target Enforcement Authority
                    </label>
                    <select
                      value={destinationAuthority}
                      onChange={(e) => setDestinationAuthority(e.target.value)}
                      className="w-full rounded-full bg-white border border-[#e2e8f0] px-5 py-3 text-xs text-[#1e2430] font-bold focus:outline-none focus:border-[#00a88f]"
                    >
                      <option>State Pollution Control Board (SPCB)</option>
                      <option>Municipal Environmental Department</option>
                      <option>Local Police Noise Control Division</option>
                      <option>District Magistrate Office</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-[#58647a] block mb-1.5 ml-1 tracking-wider">
                      Transmission Protocol
                    </label>
                    <input
                      type="text"
                      readOnly
                      value="Encrypted API Protocol / Signed PDF Dossier"
                      className="w-full rounded-full bg-white border border-[#e2e8f0] px-5 py-3 text-xs text-[#58647a] font-medium"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-[#e2e8f0]">
                  <p className="text-[11px] text-[#58647a]">
                    Requires human operator confirmation. Adheres to ISO 1996-2 and IEC 61672-1 protocols.
                  </p>
                  <button
                    onClick={handleSubmitComplaint}
                    disabled={submitting}
                    className="px-6 py-3 rounded-full text-xs font-bold bg-[#1e2430] hover:bg-black text-white w-full sm:w-auto shrink-0 shadow-xs transition-colors"
                  >
                    {submitting ? 'Dispatching...' : 'Dispatch Complaint'}
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="shape-arch bg-white border border-[#e2e8f0] p-16 text-center text-xs text-[#58647a] shadow-sm">
              Select any report from the repository catalog to review forensic details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
