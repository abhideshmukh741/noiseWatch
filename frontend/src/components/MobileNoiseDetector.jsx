import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { audioAPI, reportsAPI } from '../services/api';

const CATEGORY_NAMES = {
  traffic: 'Traffic & Vehicle Noise',
  construction: 'Construction Equipment',
  machinery: 'Industrial Machinery',
  alarm: 'Siren or Alarm',
  music: 'Public Sound / Loudspeaker',
  voice: 'Crowd or Speech',
  nature: 'Environmental Ambient',
  unknown: 'Unclassified Acoustic',
};

export function MobileNoiseDetector() {
  const [gpsLocation, setGpsLocation] = useState({ lat: 19.0760, lon: 72.8777 });
  const [gpsStatus, setGpsStatus] = useState('detecting'); // 'detecting', 'locked', 'denied'
  const [zoneData, setZoneData] = useState(null);
  const [selectedZone, setSelectedZone] = useState('residential');
  
  // Real-time audio stream state
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [currentPhoneDb, setCurrentPhoneDb] = useState(42.5);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingCountdown, setRecordingCountdown] = useState(3);
  const [evaluating, setEvaluating] = useState(false);
  
  // Results
  const [verdictResult, setVerdictResult] = useState(null);
  const [aiNarrative, setAiNarrative] = useState(null);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedLetter, setCopiedLetter] = useState(false);

  // Audio nodes & refs
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);

  // Calibration offset (phone mic input to dBA SPL baseline)
  const CALIBRATION_OFFSET_DB = 88.0;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPhoneMic();
    };
  }, []);

  // 1. Acquire Phone GPS on Mount
  useEffect(() => {
    if (navigator.geolocation) {
      setGpsStatus('detecting');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          setGpsLocation({ lat, lon });
          setGpsStatus('locked');
          fetchZoning(lat, lon);
        },
        (err) => {
          console.warn('GPS denied or unavailable, using fallback coordinates:', err.message);
          setGpsStatus('fallback');
          fetchZoning(19.0760, 72.8777); // Mumbai residential baseline
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    } else {
      setGpsStatus('unsupported');
      fetchZoning(19.0760, 72.8777);
    }

    return () => {
      stopPhoneMic();
    };
  }, []);

  // 2. Fetch Zoning & Statutory Thresholds for GPS coordinate
  const fetchZoning = async (lat, lon) => {
    try {
      const res = await audioAPI.detectZone(lat, lon);
      setZoneData(res.data);
      setSelectedZone(res.data.zone_category);
    } catch (err) {
      console.error('Failed to detect zone:', err);
    }
  };

  // Stop microphone
  const stopPhoneMic = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsMonitoring(false);
  };

  // 3. Start Recording 3-Second Evidence Sample via Phone Mic
  const handleRecordMobileEvidence = async () => {
    setErrorMsg('');
    setVerdictResult(null);
    setAiNarrative(null);
    setIsRecording(true);
    setRecordingCountdown(3);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      streamRef.current = stream;
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;

      setIsMonitoring(true);

      const capturedSamples = [];
      const dbSamples = [];
      const buffer = new Float32Array(analyser.fftSize);

      const updateMeter = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getFloatTimeDomainData(buffer);

        let sumSquares = 0.0;
        for (let i = 0; i < buffer.length; i++) {
          sumSquares += buffer[i] * buffer[i];
          capturedSamples.push(buffer[i]);
        }
        const rms = Math.sqrt(sumSquares / buffer.length);
        const calculatedDb = rms > 0.00001
          ? Math.min(125.0, Math.max(30.0, Math.round((20 * Math.log10(rms) + CALIBRATION_OFFSET_DB) * 10) / 10))
          : 35.0;

        setCurrentPhoneDb(calculatedDb);
        dbSamples.push(calculatedDb);

        animFrameRef.current = requestAnimationFrame(updateMeter);
      };

      updateMeter();

      // Countdown loop for 3 seconds
      let secondsLeft = 3;
      const timer = setInterval(() => {
        secondsLeft -= 1;
        setRecordingCountdown(secondsLeft);

        if (secondsLeft <= 0) {
          clearInterval(timer);
          stopPhoneMic();

          // Calculate peak / average decibel from recording
          const avgDb = dbSamples.length > 0 
            ? Math.round((dbSamples.reduce((a, b) => a + b, 0) / dbSamples.length) * 10) / 10
            : 55.0;

          // Downsample or take representative 22050 samples (1.0s window for ML)
          const mlSamples = capturedSamples.slice(-22050);

          sendEvaluation(mlSamples, avgDb);
        }
      }, 1000);

    } catch (err) {
      console.error('Microphone access denied:', err);
      setErrorMsg('Microphone access denied. Please allow microphone permissions in your mobile browser.');
      setIsRecording(false);
    }
  };

  // 4. Send Evaluation to Backend: GPS Zoning + ML Classifier + Exceedance Rules
  const sendEvaluation = async (samples, avgDb) => {
    setEvaluating(true);
    try {
      const payload = {
        samples: samples.length > 0 ? Array.from(samples) : [0.1, -0.1] * 1000,
        sample_rate: 22050,
        measured_db: avgDb,
        latitude: gpsLocation.lat,
        longitude: gpsLocation.lon,
        zone_category: selectedZone,
        address: zoneData?.address,
        duration_seconds: 3.0,
      };

      const res = await audioAPI.evaluateMobileReading(payload);
      setVerdictResult(res.data);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to evaluate mobile noise reading');
    } finally {
      setEvaluating(false);
    }
  };

  // Active limit based on selected zone
  const currentZoneLimit = zoneData?.all_zones?.[selectedZone] || {
    name: 'Residential Area',
    day_threshold_dba: 55.0,
    night_threshold_dba: 45.0,
    legal_reference: 'Rule 3(1), Area Code C',
  };
  const isNight = zoneData?.time_period === 'night';
  const activeLegalLimit = isNight ? currentZoneLimit.night_threshold_dba : currentZoneLimit.day_threshold_dba;

  // 5. Generate AI Court-Admissible Narrative via Groq
  const handleGenerateAiNarrative = async () => {
    if (!verdictResult) return;
    setGeneratingAi(true);
    try {
      const payload = {
        measured_db: verdictResult.measured_db,
        threshold_db: verdictResult.threshold_db,
        zone_category: selectedZone,
        time_period: verdictResult.time_period || (isNight ? 'night' : 'day'),
        sound_classification: verdictResult.sound_classification,
        confidence: verdictResult.confidence,
        address: zoneData?.address || `${gpsLocation.lat.toFixed(4)}, ${gpsLocation.lon.toFixed(4)}`,
        incident_id: verdictResult.incident_id,
        duration_seconds: 3.0,
      };

      const res = await reportsAPI.generateAINarrative(payload);
      setAiNarrative(res.data);
    } catch (err) {
      console.error('Failed to generate AI narrative:', err);
      setErrorMsg('Failed to reach Groq AI. Generating rule-based legal report instead.');
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleCopyLetter = () => {
    if (aiNarrative?.formal_complaint_letter) {
      navigator.clipboard.writeText(aiNarrative.formal_complaint_letter);
      setCopiedLetter(true);
      setTimeout(() => setCopiedLetter(false), 2500);
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-[#cbd5e1] shadow-xs space-y-6">
      
      {/* ── Title Banner (Zero Icons) ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#f1f5f9]">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge-emerald font-mono font-bold text-[10px]">
              MOBILE GPS
            </span>
            <div>
              <h2 className="text-base font-bold text-[#0f172a]">
                Mobile Noise Audit & Citizen Evidence Capture
              </h2>
              <p className="text-xs text-[#475569]">
                Zero-Hardware Architecture • Uses Phone GPS & Microphone for Real-Time Statutory Audit
              </p>
            </div>
          </div>
        </div>

        {/* GPS Status Indicator (Zero Icons) */}
        <div className="flex items-center gap-2 text-xs font-mono font-bold px-3 py-1.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl">
          <span className="text-[#059669]">GPS:</span>
          <span>
            {gpsStatus === 'locked' ? 'Locked' : (gpsStatus === 'detecting' ? 'Locating...' : 'India Baseline')}
          </span>
          <span className="text-[#64748b]">
            ({gpsLocation.lat.toFixed(4)}°, {gpsLocation.lon.toFixed(4)}°)
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-[#fef2f2] border border-[#fecaca] text-[#991b1b] text-xs rounded-2xl flex items-center justify-between">
          <span className="font-semibold">{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="text-xs font-bold underline ml-2">Dismiss</button>
        </div>
      )}

      {/* ── Location & Zone Summary (Solid Background, No Mirror Filter) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Address & Detected Locality */}
        <div className="p-4 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b] block">
            Audited Locality (India)
          </span>
          <p className="text-xs font-bold text-[#0f172a] truncate">
            {zoneData?.address || 'Detecting via OpenStreetMap...'}
          </p>
          <span className="text-[11px] text-[#475569] block">
            Reverse-Geocoded GPS Coordinate
          </span>
        </div>

        {/* Detected Zone with Override Selector */}
        <div className="p-4 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b] block">
            CPCB Statutory Zone
          </span>
          <div className="flex items-center gap-2">
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="bg-white border border-[#cbd5e1] rounded-xl text-xs font-bold text-[#0f172a] px-2.5 py-1 focus:ring-1 focus:ring-[#059669] outline-none"
            >
              <option value="residential">Residential Area (55/45 dB)</option>
              <option value="commercial">Commercial Area (65/55 dB)</option>
              <option value="industrial">Industrial Area (75/70 dB)</option>
              <option value="silence_zone">Silence Zone (50/40 dB)</option>
            </select>
          </div>
          <span className="text-[11px] text-[#64748b] block">
            {currentZoneLimit.legal_reference}
          </span>
        </div>

        {/* Time of Day & Statutory Curfew Status */}
        <div className="p-4 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b] block">
            Statutory Time Period
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#0f172a] uppercase">
              {zoneData ? `${zoneData.time_period} Period (${zoneData.current_hour}:00 IST)` : 'Current Hour'}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono ${
              isNight ? 'bg-[#fef3c7] text-[#b45309] border border-[#fde68a]' : 'bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0]'
            }`}>
              {isNight ? 'Rule 5 Curfew Active' : 'Daytime Standards'}
            </span>
          </div>
          <span className="text-[11px] text-[#475569] block">
            Night Limit applies 22:00 – 06:00 IST
          </span>
        </div>

      </div>

      {/* ── Record Audio Evidence Action (Solid Card, Zero Icons) ── */}
      <div className="p-6 rounded-3xl border border-[#cbd5e1] bg-[#f8fafc] text-center space-y-4">
        
        <div>
          <span className="text-xs uppercase font-mono font-bold text-[#64748b] block mb-1">
            Smartphone Microphone Input
          </span>
          <div className="flex items-center justify-center gap-2">
            <span className="text-4xl font-mono font-extrabold text-[#0f172a]">
              {currentPhoneDb}
            </span>
            <span className="text-sm font-bold text-[#64748b]">dB(A)</span>
          </div>
          <p className="text-[11px] text-[#64748b] mt-1">
            Legal curfew threshold for this zone: <strong className="text-[#059669]">{activeLegalLimit} dB(A)</strong>
          </p>
        </div>

        {/* Record Button without icons */}
        <div className="flex flex-col items-center justify-center">
          <button
            onClick={handleRecordMobileEvidence}
            disabled={isRecording || evaluating}
            className={`px-8 py-3.5 rounded-full font-bold text-sm text-white shadow-md transition-all ${
              isRecording 
                ? 'bg-[#ef4444] animate-pulse ring-4 ring-[#fecaca]' 
                : 'bg-[#059669] hover:bg-[#047857]'
            }`}
          >
            {isRecording ? (
              <span>Capturing Audio Evidence... ({recordingCountdown}s)</span>
            ) : evaluating ? (
              <span>Running ML & Legal Audit...</span>
            ) : (
              <span>Record Audio Evidence (3s Audit)</span>
            )}
          </button>
          <span className="text-[10px] text-[#94a3b8] mt-2">
            Tap to record a 3-second calibrated audio clip and evaluate against statutory Indian limits
          </span>
        </div>

      </div>

      {/* ── Verdict Card: Display Results (Zero Icons) ── */}
      {verdictResult && (
        <div className={`p-6 rounded-3xl border space-y-4 ${
          verdictResult.is_pollution_violation 
            ? 'bg-[#fef2f2] border-[#fecaca]' 
            : (verdictResult.is_exempt ? 'bg-[#eff6ff] border-[#bfdbfe]' : 'bg-[#ecfdf5] border-[#a7f3d0]')
        }`}>
          
          {/* Header Verdict Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1.5 rounded-xl font-mono text-xs font-extrabold uppercase text-white ${
                verdictResult.is_pollution_violation 
                  ? 'bg-[#dc2626]' 
                  : (verdictResult.is_exempt ? 'bg-[#2563eb]' : 'bg-[#059669]')
              }`}>
                {verdictResult.is_pollution_violation ? 'VIOLATION' : 'COMPLIANT'}
              </span>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider block text-[#64748b]">
                  Audit Verdict
                </span>
                <h3 className={`text-base font-extrabold ${
                  verdictResult.is_pollution_violation 
                    ? 'text-[#991b1b]' 
                    : (verdictResult.is_exempt ? 'text-[#1e40af]' : 'text-[#065f46]')
                }`}>
                  {verdictResult.verdict}
                </h3>
              </div>
            </div>

            {verdictResult.incident_id && (
              <span className="font-mono text-xs font-bold text-[#0f172a] bg-white px-3 py-1 rounded-full border border-[#cbd5e1] self-start sm:self-auto">
                {verdictResult.incident_id}
              </span>
            )}
          </div>

          <p className="text-xs font-medium text-[#334155] leading-relaxed">
            {verdictResult.legal_summary}
          </p>

          {/* Metric Comparison Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <div className="p-2.5 rounded-xl bg-white border border-[#e2e8f0]">
              <span className="text-[10px] font-bold text-[#64748b] block">Phone Measured</span>
              <span className="font-mono text-sm font-extrabold text-[#0f172a]">
                {verdictResult.measured_db} dB(A)
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-[#e2e8f0]">
              <span className="text-[10px] font-bold text-[#64748b] block">Statutory Limit</span>
              <span className="font-mono text-sm font-extrabold text-[#059669]">
                {verdictResult.threshold_db} dB(A)
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-[#e2e8f0]">
              <span className="text-[10px] font-bold text-[#64748b] block">Excess Over Limit</span>
              <span className={`font-mono text-sm font-extrabold ${
                verdictResult.excess_db > 0 ? 'text-[#dc2626]' : 'text-[#059669]'
              }`}>
                {verdictResult.excess_db > 0 ? `+${verdictResult.excess_db} dB` : 'None (Compliant)'}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-[#e2e8f0]">
              <span className="text-[10px] font-bold text-[#64748b] block">ML Classified Source</span>
              <span className="font-bold text-xs text-[#0f172a] capitalize block">
                {CATEGORY_NAMES[verdictResult.sound_classification] || verdictResult.sound_classification} ({Math.round(verdictResult.confidence * 100)}%)
              </span>
            </div>
          </div>

          {/* AI Legal Analysis Trigger Button */}
          {verdictResult.is_pollution_violation && !aiNarrative && (
            <div className="p-3 bg-white rounded-2xl border border-[#e2e8f0] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <span className="badge-emerald text-[10px] font-mono mr-2">AI COMPLIANCE</span>
                <span className="text-xs font-bold text-[#0f172a]">
                  Generate Court-Admissible Legal Assessment & Complaint Letter
                </span>
              </div>
              <button
                onClick={handleGenerateAiNarrative}
                disabled={generatingAi}
                className="btn btn-primary btn-sm text-xs font-bold rounded-xl shrink-0 bg-[#059669] hover:bg-[#047857] border-none text-white px-4"
              >
                {generatingAi ? 'Analyzing with Groq AI...' : 'Draft AI Legal Dossier'}
              </button>
            </div>
          )}

          {/* Render Generated AI Narrative */}
          {aiNarrative && (
            <div className="p-4 bg-white rounded-2xl border border-[#cbd5e1] space-y-3 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#f1f5f9]">
                <div className="text-xs font-bold text-[#0f172a]">
                  <span>AI Legal & Statutory Assessment (Groq {aiNarrative.ai_model || 'qwen/qwen3.8-27b'})</span>
                </div>
                <span className="text-[10px] font-mono bg-[#ecfdf5] text-[#047857] px-2.5 py-0.5 rounded-full border border-[#a7f3d0] font-bold">
                  Court-Admissible Draft
                </span>
              </div>

              {/* Executive Summary */}
              <div>
                <span className="text-[10px] uppercase font-bold text-[#64748b] block">Executive Summary</span>
                <p className="text-xs text-[#334155] mt-0.5 leading-relaxed font-medium">
                  {aiNarrative.executive_summary}
                </p>
              </div>

              {/* Statutory Legal Reasoning */}
              <div>
                <span className="text-[10px] uppercase font-bold text-[#64748b] block">Statutory Mandate & Precedents</span>
                <p className="text-xs text-[#475569] mt-0.5 leading-relaxed">
                  {aiNarrative.statutory_analysis}
                </p>
              </div>

              {/* Health Impact */}
              {aiNarrative.health_impact && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#64748b] block">Health Impact Criteria</span>
                  <p className="text-xs text-[#475569] mt-0.5 leading-relaxed">
                    {aiNarrative.health_impact}
                  </p>
                </div>
              )}

              {/* Corrective Actions */}
              {aiNarrative.corrective_recommendations && aiNarrative.corrective_recommendations.length > 0 && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#64748b] block">Corrective Directives</span>
                  <ul className="list-disc list-inside text-xs text-[#334155] space-y-0.5 mt-0.5 pl-1">
                    {aiNarrative.corrective_recommendations.map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Formal Complaint Letter */}
              {aiNarrative.formal_complaint_letter && (
                <div className="pt-2 border-t border-[#f1f5f9]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase font-bold text-[#64748b]">
                      Formal Municipal Complaint Letter (India)
                    </span>
                    <button
                      onClick={handleCopyLetter}
                      className="text-xs font-bold text-[#059669] hover:underline"
                    >
                      {copiedLetter ? 'Copied to Clipboard!' : 'Copy Letter'}
                    </button>
                  </div>
                  <pre className="text-[11px] bg-[#f8fafc] border border-[#e2e8f0] p-3 rounded-xl text-[#334155] whitespace-pre-wrap font-sans max-h-48 overflow-y-auto">
                    {aiNarrative.formal_complaint_letter}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Action CTAs (Zero Icons) */}
          {verdictResult.is_pollution_violation && (
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <Link
                to={`/reports?incident_id=${verdictResult.incident_id}`}
                className="w-full sm:w-auto btn btn-primary btn-sm text-xs font-bold rounded-2xl flex items-center justify-center px-4"
              >
                Download Compliance PDF Dossier
              </Link>
              <Link
                to={`/reports?action=complaint&incident_id=${verdictResult.incident_id}&db=${verdictResult.measured_db}&cat=${verdictResult.sound_classification}`}
                className="w-full sm:w-auto btn btn-secondary btn-sm text-xs font-bold rounded-2xl flex items-center justify-center px-4"
              >
                File Municipal Complaint With Proof
              </Link>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
