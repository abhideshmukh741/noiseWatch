import React, { useState, useEffect, useRef } from 'react';
import { 
  Navigation, 
  Mic, 
  MicOff, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  FileText, 
  Send, 
  MapPin, 
  Clock, 
  Volume2, 
  Info,
  Car,
  Hammer,
  Cog,
  Bell,
  Music,
  Trees,
  HelpCircle,
  ChevronDown,
  Sparkles,
  Copy,
  Check
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { audioAPI, reportsAPI } from '../services/api';

const CATEGORY_ICONS = {
  traffic: Car,
  construction: Hammer,
  machinery: Cog,
  alarm: Bell,
  music: Music,
  voice: Mic,
  nature: Trees,
  unknown: HelpCircle,
};

export function MobileNoiseDetector() {
  const [gpsLocation, setGpsLocation] = useState({ lat: 19.0760, lon: 72.8777 });
  const [gpsStatus, setGpsStatus] = useState('detecting'); // 'detecting', 'locked', 'denied'
  const [zoneData, setZoneData] = useState(null);
  const [selectedZone, setSelectedZone] = useState('residential');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingCountdown, setRecordingCountdown] = useState(0);
  const [currentPhoneDb, setCurrentPhoneDb] = useState(48.5);
  const [evaluating, setEvaluating] = useState(false);
  const [verdictResult, setVerdictResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [aiNarrative, setAiNarrative] = useState(null);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [copiedLetter, setCopiedLetter] = useState(false);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const audioBufferRef = useRef([]);
  const animFrameRef = useRef(null);

  const handleGenerateAiNarrative = async () => {
    if (!verdictResult) return;
    setGeneratingAi(true);
    try {
      const res = await reportsAPI.generateAINarrative({
        measured_db: verdictResult.measured_db,
        threshold_db: verdictResult.threshold_db,
        zone_category: verdictResult.zone_category,
        time_period: verdictResult.time_period,
        sound_classification: verdictResult.sound_classification,
        confidence: verdictResult.confidence,
        address: verdictResult.address,
        incident_id: verdictResult.incident_id,
        duration_seconds: 3.0,
      });
      setAiNarrative(res.data);
    } catch (err) {
      console.error('Failed to generate AI narrative:', err);
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleCopyLetter = () => {
    if (!aiNarrative?.formal_complaint_letter) return;
    navigator.clipboard.writeText(aiNarrative.formal_complaint_letter);
    setCopiedLetter(true);
    setTimeout(() => setCopiedLetter(false), 3000);
  };

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
    setIsRecording(false);
  };

  // 3. Start Recording & Audio Analysis via Web Audio API
  const handleRecordMobileEvidence = async () => {
    setErrorMsg(null);
    setVerdictResult(null);
    audioBufferRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } 
      });
      streamRef.current = stream;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx({ sampleRate: 22050 });
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      analyserRef.current = analyser;

      setIsRecording(true);
      setRecordingCountdown(3);

      const capturedSamples = [];
      const dbSamples = [];

      const processFrame = () => {
        if (!analyserRef.current) return;
        const buffer = new Float32Array(analyserRef.current.fftSize);
        analyserRef.current.getFloatTimeDomainData(buffer);

        // Calculate RMS & Decibels
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
          sum += buffer[i] * buffer[i];
          capturedSamples.push(buffer[i]);
        }
        const rms = Math.sqrt(sum / buffer.length);
        const estDb = rms > 0.00001 ? Math.min(Math.max(20 * Math.log10(rms) + 94.0, 32.0), 115.0) : 32.0;
        const roundedDb = Math.round(estDb * 10) / 10;
        setCurrentPhoneDb(roundedDb);
        dbSamples.push(roundedDb);

        animFrameRef.current = requestAnimationFrame(processFrame);
      };

      processFrame();

      // Countdown loop for 3 seconds recording
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

  const VerdictCategoryIcon = verdictResult ? (CATEGORY_ICONS[verdictResult.sound_classification] || Volume2) : Volume2;

  return (
    <div className="glass-card p-6 rounded-3xl border border-[#cbd5e1] bg-white shadow-xs space-y-6">
      
      {/* ── Title Banner ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#f1f5f9]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-[#ecfdf5] text-[#059669] rounded-xl">
              <Navigation className="w-5 h-5" />
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

        {/* GPS Status Indicator */}
        <div className="flex items-center gap-2 text-xs font-mono font-bold px-3 py-1.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl">
          <MapPin className="w-3.5 h-3.5 text-[#059669]" />
          <span>
            {gpsStatus === 'locked' ? 'GPS Locked' : (gpsStatus === 'detecting' ? 'Locating...' : 'Mumbai Baseline')}
          </span>
          <span className="text-[#64748b]">
            ({gpsLocation.lat.toFixed(4)}°, {gpsLocation.lon.toFixed(4)}°)
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-[#fef2f2] border border-[#fecaca] text-[#991b1b] text-xs rounded-2xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── Zoning & Statutory Limit Selector ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Detected Address & Landuse */}
        <div className="p-4 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] md:col-span-2 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-[#64748b] font-bold">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#059669]" />
              Physical Geolocation (Reverse-Geocoded)
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0]">
              OpenStreetMap GIS
            </span>
          </div>
          <p className="text-xs font-semibold text-[#0f172a] line-clamp-2">
            {zoneData?.address || 'Greenfield Colony, Sector 12, Mumbai Metropolitan Region'}
          </p>
          <div className="flex items-center gap-2 pt-1 text-[11px] text-[#475569]">
            <Clock className="w-3.5 h-3.5 text-[#64748b]" />
            <span>Time of Audit: <strong className="text-[#0f172a] capitalize">{zoneData?.time_period || 'Day'} Hours</strong> ({isNight ? '22:00 – 06:00' : '06:00 – 22:00'})</span>
          </div>
        </div>

        {/* Zone Category Selector */}
        <div className="p-4 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider block mb-1">
              Statutory Zone Category
            </span>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="w-full text-xs font-bold text-[#0f172a] bg-white border border-[#cbd5e1] rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-[#059669]"
            >
              <option value="residential">Residential Area (55 / 45 dB)</option>
              <option value="silence_zone">Silence Zone (50 / 40 dB)</option>
              <option value="commercial">Commercial Area (65 / 55 dB)</option>
              <option value="industrial">Industrial Area (75 / 70 dB)</option>
            </select>
          </div>

          <div className="mt-2 pt-2 border-t border-[#e2e8f0] flex items-center justify-between text-xs">
            <span className="text-[#64748b] font-medium">Statutory Limit:</span>
            <span className="font-mono font-bold text-[#059669]">
              {activeLegalLimit} dB(A)
            </span>
          </div>
        </div>

      </div>

      {/* ── Record Audio Evidence Action ── */}
      <div className="p-6 rounded-3xl border border-[#cbd5e1] bg-gradient-to-b from-[#f8fafc] to-[#ffffff] text-center space-y-4">
        
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

        {/* Big Record Button */}
        <div className="flex flex-col items-center justify-center">
          <button
            onClick={handleRecordMobileEvidence}
            disabled={isRecording || evaluating}
            className={`px-6 py-3.5 rounded-full font-bold text-sm text-white shadow-md transition-all flex items-center gap-2.5 ${
              isRecording 
                ? 'bg-[#ef4444] animate-pulse ring-4 ring-[#fecaca]' 
                : 'bg-[#059669] hover:bg-[#047857]'
            }`}
          >
            {isRecording ? (
              <>
                <Mic className="w-5 h-5 animate-bounce" />
                <span>Capturing Evidence... ({recordingCountdown}s)</span>
              </>
            ) : evaluating ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Running ML & Legal Audit...</span>
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" />
                <span>Record Audio Evidence (3s Audit)</span>
              </>
            )}
          </button>
          <span className="text-[10px] text-[#94a3b8] mt-2">
            Tap to record a 3-second calibrated audio clip and evaluate against statutory limits
          </span>
        </div>

      </div>

      {/* ── Verdict Card: Display Results ── */}
      {verdictResult && (
        <div className={`p-6 rounded-3xl border space-y-4 ${
          verdictResult.is_pollution_violation 
            ? 'bg-[#fef2f2] border-[#fecaca]' 
            : (verdictResult.is_exempt ? 'bg-[#eff6ff] border-[#bfdbfe]' : 'bg-[#ecfdf5] border-[#a7f3d0]')
        }`}>
          
          {/* Header Verdict Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl text-white ${
                verdictResult.is_pollution_violation 
                  ? 'bg-[#dc2626]' 
                  : (verdictResult.is_exempt ? 'bg-[#2563eb]' : 'bg-[#059669]')
              }`}>
                {verdictResult.is_pollution_violation ? (
                  <ShieldAlert className="w-6 h-6" />
                ) : (
                  <CheckCircle2 className="w-6 h-6" />
                )}
              </div>
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
              <span className="font-bold text-xs text-[#0f172a] capitalize flex items-center gap-1">
                <VerdictCategoryIcon className="w-3.5 h-3.5 text-[#059669]" />
                {verdictResult.sound_classification} ({Math.round(verdictResult.confidence * 100)}%)
              </span>
            </div>
          </div>

          {/* AI Legal Analysis Trigger Button */}
          {verdictResult.is_pollution_violation && !aiNarrative && (
            <div className="p-3 bg-white rounded-2xl border border-[#e2e8f0] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#8b5cf6]" />
                <span className="text-xs font-bold text-[#0f172a]">
                  Generate AI Court-Admissible Legal Assessment & Complaint Letter
                </span>
              </div>
              <button
                onClick={handleGenerateAiNarrative}
                disabled={generatingAi}
                className="btn btn-primary btn-sm text-xs font-bold rounded-xl flex items-center gap-2 shrink-0 bg-[#8b5cf6] hover:bg-[#7c3aed] border-none text-white"
              >
                {generatingAi ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing with Groq AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Draft AI Legal Dossier</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Render Generated AI Narrative */}
          {aiNarrative && (
            <div className="p-4 bg-white rounded-2xl border border-[#cbd5e1] space-y-3 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#f1f5f9]">
                <div className="flex items-center gap-2 text-xs font-bold text-[#0f172a]">
                  <Sparkles className="w-4 h-4 text-[#8b5cf6]" />
                  <span>AI Legal & Statutory Assessment (Groq {aiNarrative.ai_model || 'gpt-oss-120b'})</span>
                </div>
                <span className="text-[10px] font-mono bg-[#f5f3ff] text-[#7c3aed] px-2 py-0.5 rounded-full border border-[#ddd6fe]">
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
                  <span className="text-[10px] uppercase font-bold text-[#64748b] block">WHO Health Impact Criteria</span>
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
                      Formal Municipal Complaint Letter
                    </span>
                    <button
                      onClick={handleCopyLetter}
                      className="text-xs font-bold text-[#059669] hover:underline flex items-center gap-1"
                    >
                      {copiedLetter ? <Check className="w-3.5 h-3.5 text-[#059669]" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLetter ? 'Copied to Clipboard!' : 'Copy Letter'}</span>
                    </button>
                  </div>
                  <pre className="text-[11px] bg-[#f8fafc] border border-[#e2e8f0] p-3 rounded-xl text-[#334155] whitespace-pre-wrap font-sans max-h-48 overflow-y-auto">
                    {aiNarrative.formal_complaint_letter}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Action CTAs */}
          {verdictResult.is_pollution_violation && (
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <Link
                to={`/reports?incident_id=${verdictResult.incident_id}`}
                className="w-full sm:w-auto btn btn-primary btn-sm text-xs font-bold rounded-2xl flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                <span>Download Compliance PDF Dossier</span>
              </Link>
              <Link
                to={`/reports?action=complaint&incident_id=${verdictResult.incident_id}&db=${verdictResult.measured_db}&cat=${verdictResult.sound_classification}`}
                className="w-full sm:w-auto btn btn-secondary btn-sm text-xs font-bold rounded-2xl flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>File Municipal Complaint With Proof</span>
              </Link>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
