/**
 * NoiseWatch — Creative Acoustic Intelligence Landing Page
 * 
 * Non-Cube Geometric Architectural Design System:
 * - Breaks away from standard rectangular "cube" boxes with varied silhouettes:
 *   - Arched Cathedral Portals (rounded-t-[80px])
 *   - Asymmetric Organic Pebbles (rounded-tl-[64px] rounded-br-[64px])
 *   - Circular Acoustic Lens Apertures & Concentric Dial Rings (rounded-full)
 *   - Stadium / Capsule Containers (rounded-full)
 * - Harmonious Qwilr Color System: Pure White (#ffffff), Warm Coral (#ff5757), Vibrant Teal (#00a88f), Deep Charcoal (#1e2430)
 * - Complete environmental acoustic screening, FFT waveform visualizer, and regulatory standards
 */

import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const SCENARIOS = {
  construction: {
    key: 'construction',
    name: 'Demolition & Drilling',
    shortName: 'Construction',
    db: 84.6,
    classification: 'Heavy Construction',
    confidence: 96.8,
    zone: 'Residential Zone',
    dayLimit: 55,
    nightLimit: 45,
    exceeded: true,
    excess: '+29.6 dB(A)',
    centroid: '2,450 Hz',
    zcr: '0.142',
    rolloff: '4,100 Hz',
    status: 'Exceedance Flagged',
    color: '#ff5757',
    fillColor: 'rgba(255, 87, 87, 0.12)',
    badgeBg: '#fff0f0',
    waveAmplitude: 36,
    waveSpeed: 0.08,
  },
  traffic: {
    key: 'traffic',
    name: 'Arterial Highway',
    shortName: 'Traffic',
    db: 71.2,
    classification: 'Vehicular Traffic',
    confidence: 94.2,
    zone: 'Commercial Zone',
    dayLimit: 65,
    nightLimit: 55,
    exceeded: true,
    excess: '+6.2 dB(A)',
    centroid: '1,120 Hz',
    zcr: '0.088',
    rolloff: '2,800 Hz',
    status: 'Screening Logged',
    color: '#ff8a57',
    fillColor: 'rgba(255, 138, 87, 0.12)',
    badgeBg: '#fff4ee',
    waveAmplitude: 24,
    waveSpeed: 0.05,
  },
  industrial: {
    key: 'industrial',
    name: 'Plant Generator',
    shortName: 'Industrial',
    db: 78.5,
    classification: 'Industrial Machinery',
    confidence: 98.1,
    zone: 'Industrial Zone',
    dayLimit: 75,
    nightLimit: 70,
    exceeded: true,
    excess: '+3.5 dB(A)',
    centroid: '850 Hz',
    zcr: '0.045',
    rolloff: '1,950 Hz',
    status: 'Operator Flagged',
    color: '#d97706',
    fillColor: 'rgba(217, 119, 6, 0.12)',
    badgeBg: '#fffbeb',
    waveAmplitude: 28,
    waveSpeed: 0.06,
  },
  ambient: {
    key: 'ambient',
    name: 'Quiet Park Ambient',
    shortName: 'Safe Ambient',
    db: 44.2,
    classification: 'Normal Ambient',
    confidence: 99.4,
    zone: 'Residential Zone',
    dayLimit: 55,
    nightLimit: 45,
    exceeded: false,
    excess: '-10.8 dB (Safe)',
    centroid: '3,800 Hz',
    zcr: '0.210',
    rolloff: '6,200 Hz',
    status: 'Fully Compliant',
    color: '#00a88f',
    fillColor: 'rgba(0, 168, 143, 0.12)',
    badgeBg: '#f0fdfa',
    waveAmplitude: 10,
    waveSpeed: 0.03,
  },
};

export default function LandingPage() {
  const [selectedScenario, setSelectedScenario] = useState('construction');
  const scenario = SCENARIOS[selectedScenario];

  const [isLiveMic, setIsLiveMic] = useState(false);
  const [liveDb, setLiveDb] = useState(scenario.db);

  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const micStreamRef = useRef(null);
  const micAnalyserRef = useRef(null);

  // Subtle decibel jitter
  useEffect(() => {
    setLiveDb(scenario.db);
    const interval = setInterval(() => {
      if (!isLiveMic) {
        const jitter = (Math.random() - 0.5) * 1.2;
        setLiveDb(Math.round((scenario.db + jitter) * 10) / 10);
      }
    }, 450);
    return () => clearInterval(interval);
  }, [scenario, isLiveMic]);

  // Gentle Canvas Waveform Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let phase = 0;

    const render = () => {
      phase += isLiveMic ? 0.08 : scenario.waveSpeed;
      const width = canvas.width;
      const height = canvas.height;
      const midY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Light horizontal baseline
      ctx.strokeStyle = '#e5e9f2';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(width, midY);
      ctx.stroke();

      const points = [];
      const numPoints = 80;

      if (isLiveMic && micAnalyserRef.current) {
        const timeData = new Uint8Array(micAnalyserRef.current.fftSize);
        micAnalyserRef.current.getByteTimeDomainData(timeData);

        let sumSquares = 0;
        for (let i = 0; i < numPoints; i++) {
          const sampleIndex = Math.floor((i / numPoints) * timeData.length);
          const val = (timeData[sampleIndex] - 128) / 128;
          sumSquares += val * val;
          const y = midY + val * (height * 0.42);
          points.push({ x: (i / (numPoints - 1)) * width, y });
        }

        const rms = Math.sqrt(sumSquares / numPoints);
        const micEstDb = Math.min(Math.max(Math.round((36 + rms * 85) * 10) / 10, 34), 105);
        setLiveDb(micEstDb);
      } else {
        const amp = scenario.waveAmplitude;
        for (let i = 0; i < numPoints; i++) {
          const x = (i / (numPoints - 1)) * width;
          const progress = i / numPoints;
          const envelope = Math.sin(progress * Math.PI);
          const wave1 = Math.sin(phase + i * 0.18) * amp;
          const wave2 = Math.sin(phase * 1.5 + i * 0.35) * (amp * 0.4);
          const noise = (Math.sin(i * 12.5 + phase * 3) * 0.12) * amp;
          const y = midY + (wave1 + wave2 + noise) * envelope;
          points.push({ x, y });
        }
      }

      // Soft Gradient Fill
      ctx.beginPath();
      ctx.moveTo(0, midY);
      for (let i = 0; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.lineTo(width, midY);
      ctx.closePath();

      const fillGrad = ctx.createLinearGradient(0, 0, width, 0);
      fillGrad.addColorStop(0, `${scenario.color}15`);
      fillGrad.addColorStop(1, '#00a88f15');
      ctx.fillStyle = fillGrad;
      ctx.fill();

      // Main Acoustic Line
      ctx.beginPath();
      for (let i = 0; i < points.length; i++) {
        if (i === 0) {
          ctx.moveTo(points[i].x, points[i].y);
        } else {
          const prev = points[i - 1];
          const curr = points[i];
          const cpX = (prev.x + curr.x) / 2;
          ctx.bezierCurveTo(cpX, prev.y, cpX, curr.y, curr.x, curr.y);
        }
      }

      ctx.strokeStyle = scenario.color;
      ctx.lineWidth = 2.2;
      ctx.stroke();

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [scenario, isLiveMic]);

  // Toggle Live Microphone
  const toggleLiveMic = async () => {
    if (isLiveMic) {
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
        micStreamRef.current = null;
      }
      setIsLiveMic(false);
    } else {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioCtx();
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        micStreamRef.current = stream;
        micAnalyserRef.current = analyser;
        setIsLiveMic(true);
      } catch (err) {
        alert('Could not access microphone: ' + err.message);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-white text-[#1e2430] overflow-x-hidden selection:bg-[#00a88f]/20 selection:text-[#00a88f]">

      {/* ── 1. HERO SECTION (Qwilr Aesthetic + Circular Geometries) ── */}
      <section className="pt-12 pb-16 md:pt-20 md:pb-24 px-4 sm:px-6 lg:px-12 max-w-[1440px] mx-auto relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Bold Headline & CTA */}
          <div className="lg:col-span-6 z-10 space-y-7 text-left">
            
            {/* Signature Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-[76px] font-bold text-[#1e2430] tracking-tight leading-[1.05]">
              Acoustic data that gets results.
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-[#58647a] leading-relaxed max-w-xl font-normal">
              NoiseWatch helps teams monitor environmental acoustics: easy, accurate and court-ready.
            </p>

            {/* Action Buttons (Capsule & Outlined) */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Link to="/dashboard" className="btn-qwilr-teal text-sm px-8 py-4 inline-flex items-center justify-center gap-2">
                <span>GET STARTED</span>
                <span className="text-base">&rarr;</span>
              </Link>
              <a 
                href="#screening-aperture" 
                className="btn-qwilr-outline text-sm px-7 py-4 text-center"
              >
                TEST LIVE AUDIO
              </a>
            </div>

            {/* Quick Metrics in Circular Lens Capsules */}
            <div className="pt-8 flex flex-wrap items-center gap-6 border-t border-[#e5e9f2] text-left">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#f0fdfa] border border-[#99f6e4] text-[#00a88f] flex items-center justify-center font-extrabold text-sm">
                  98%
                </div>
                <div>
                  <div className="text-xs font-bold text-[#1e2430]">ML Precision</div>
                  <div className="text-[10px] text-[#8c97a8] uppercase">Random Forest</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#fff0f0] border border-[#ffd1d1] text-[#ff5757] flex items-center justify-center font-extrabold text-xs">
                  ±0.7dB
                </div>
                <div>
                  <div className="text-xs font-bold text-[#1e2430]">IEC 61672</div>
                  <div className="text-[10px] text-[#8c97a8] uppercase">Class 1 Traceable</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#f8fafc] border border-[#e5e9f2] text-[#1e2430] flex items-center justify-center font-extrabold text-[10px] font-mono">
                  SHA-256
                </div>
                <div>
                  <div className="text-xs font-bold text-[#1e2430]">Tamper Evident</div>
                  <div className="text-[10px] text-[#8c97a8] uppercase">Legal Audit Hash</div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Large Coral Circle + Tilted Phone Mockups */}
          <div className="lg:col-span-6 relative flex items-center justify-center min-h-[480px] sm:min-h-[580px] lg:min-h-[640px]">
            
            {/* The Solid Vibrant Coral Circle Backdrop */}
            <div 
              className="w-[340px] h-[340px] sm:w-[460px] sm:h-[460px] lg:w-[540px] lg:h-[540px] rounded-full bg-[#ff5757] absolute right-[-10px] sm:right-[5%] top-1/2 -translate-y-1/2 -z-0 pointer-events-none"
              style={{
                boxShadow: '0 25px 70px -15px rgba(255, 87, 87, 0.45)',
              }}
            />

            {/* Device Mockup Wrapper */}
            <div className="relative flex items-center justify-center w-full z-10 select-none">
              
              {/* ── Phone 1 (Left / Back Phone, Tilted Left) ────────── */}
              <div 
                className="w-[240px] sm:w-[270px] h-[480px] sm:h-[530px] rounded-[38px] border-[8px] sm:border-[10px] border-[#181d28] bg-white phone-mockup-shadow overflow-hidden relative z-10 flex flex-col transform -rotate-[13deg] -translate-x-6 sm:-translate-x-12 translate-y-6 sm:translate-y-8 transition-all duration-500 hover:-translate-y-2 hover:-rotate-[9deg] hover:scale-105 hover:z-30 cursor-pointer"
              >
                {/* Speaker Notch */}
                <div className="w-20 h-3.5 bg-[#181d28] rounded-full mx-auto mt-2 mb-2 shrink-0" />

                {/* Top Image: Lush Green Environment */}
                <div className="relative h-28 sm:h-32 w-full overflow-hidden bg-slate-900 shrink-0">
                  <img 
                    src="/assets/images/acoustic_station.jpg" 
                    alt="NoiseWatch Station" 
                    className="w-full h-full object-cover opacity-90"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3">
                    <span className="text-[10px] font-mono font-bold text-white uppercase tracking-wider bg-[#00a88f] px-2 py-0.5 rounded-xs">
                      Live Telemetry
                    </span>
                  </div>
                </div>

                {/* Inner Content: "Our approach" */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between bg-white text-left">
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold tracking-widest text-[#ff5757] uppercase border-b-2 border-[#ff5757] pb-1 inline-block">
                      Our approach
                    </div>
                    
                    <h3 className="text-sm font-bold text-[#1e2430] leading-snug">
                      A Continuous Environmental Acoustic Policy
                    </h3>
                    
                    <p className="text-[10px] sm:text-[11px] text-[#58647a] leading-relaxed">
                      Continuous monitoring pairs calibrated microphones with real-time zone heuristics for rapid mitigation.
                    </p>
                  </div>

                  {/* Micro Sound Waveform Card */}
                  <div className="p-2.5 rounded bg-[#f8fafc] border border-[#e5e9f2] space-y-1.5 mt-2">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-[#8c97a8] font-bold">AMBIENT Leq</span>
                      <span className="text-[#00a88f] font-extrabold">52.4 dB(A)</span>
                    </div>
                    <div className="flex items-end gap-1 h-6">
                      {[35, 55, 45, 70, 85, 40, 60, 50, 75, 45, 65, 50, 80, 55, 40].map((h, i) => (
                        <div 
                          key={i} 
                          className="flex-1 bg-[#00a88f] rounded-xs"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Phone 2 (Right / Front Phone, Tilted Right) ───────── */}
              <div 
                className="w-[250px] sm:w-[280px] h-[500px] sm:h-[550px] rounded-[38px] border-[8px] sm:border-[10px] border-[#181d28] bg-white phone-mockup-front-shadow overflow-hidden relative z-20 flex flex-col transform rotate-[12deg] translate-x-4 sm:translate-x-8 -translate-y-4 sm:-translate-y-6 transition-all duration-500 hover:-translate-y-10 hover:rotate-[8deg] hover:scale-105 hover:z-30 cursor-pointer"
              >
                {/* Speaker Notch */}
                <div className="w-20 h-3.5 bg-[#181d28] rounded-full mx-auto mt-2 mb-2 shrink-0" />

                {/* Inner Document Content */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between bg-white text-left">
                  
                  {/* Proposal Header */}
                  <div className="space-y-1">
                    <div className="text-[9px] font-bold tracking-widest text-[#ff5757] uppercase">
                      CENTRAL POLLUTION CONTROL BOARD
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-[#1e2430] leading-tight">
                      Statutory Exceedance Dossier • CPCB Zone B
                    </h2>
                    <div className="text-[10px] text-[#8c97a8] font-medium">
                      Rule 3(1) Environment (Protection) Act, 1986
                    </div>
                  </div>

                  {/* Coral Statutory Alert Strip */}
                  <div className="bg-[#ff5757] text-white p-2.5 rounded-sm my-2 text-left">
                    <div className="text-[9px] font-bold uppercase tracking-wider opacity-90">
                      Day Threshold Exceeded
                    </div>
                    <div className="text-xs font-extrabold">
                      78.4 dB(A) • Excess: +23.4 dB
                    </div>
                  </div>

                  {/* The Challenge Graphic Card */}
                  <div className="relative rounded overflow-hidden h-28 sm:h-32 bg-slate-900 border border-[#181d28] p-3 flex flex-col justify-end text-white">
                    <img 
                      src="/assets/images/acoustic_lab.jpg" 
                      alt="The Challenge" 
                      className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-luminosity"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <div className="relative z-10">
                      <div className="text-[11px] font-bold tracking-wider uppercase text-[#ff5757]">
                        Spectral Analysis
                      </div>
                      <div className="text-sm sm:text-base font-extrabold leading-tight">
                        The Challenge
                      </div>
                      <div className="text-[9px] text-slate-300 mt-1 line-clamp-2">
                        Unmitigated mechanical harmonics exceeding Section 3(1) permissible decibel thresholds.
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-2">
                    <div className="w-full bg-[#1e2430] text-white text-[10px] font-bold uppercase tracking-widest py-2 rounded-xs text-center flex items-center justify-center gap-1.5">
                      <span>EXPORT OFFICIAL PDF</span>
                      <span>&rarr;</span>
                    </div>
                  </div>

                </div>
              </div>

            </div>

          </div>

        </div>

        {/* Authoritative Regulatory Framework & Standards Trust Bar */}
        <div className="pt-16 pb-4 text-center border-t border-[#e5e9f2] mt-16">
          <div className="text-[11px] font-bold tracking-widest text-[#8c97a8] uppercase mb-4 flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00a88f]" />
            <span>STATUTORY ENVIRONMENTAL COMPLIANCE &amp; CERTIFICATION FRAMEWORKS</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#00a88f]" />
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 max-w-5xl mx-auto">
            <div className="px-4 py-2 rounded-full bg-[#f8fafc] border border-[#e5e9f2] text-xs font-semibold text-[#1e2430] flex items-center gap-2 shadow-xs hover:border-[#00a88f] hover:bg-white transition-all">
              <span className="w-2 h-2 rounded-full bg-[#00a88f]" />
              <span className="font-bold">CPCB</span>
              <span className="text-[#58647a]">Rule 3(1) &amp; Rule 4(1)</span>
            </div>

            <div className="px-4 py-2 rounded-full bg-[#f8fafc] border border-[#e5e9f2] text-xs font-semibold text-[#1e2430] flex items-center gap-2 shadow-xs hover:border-[#00a88f] hover:bg-white transition-all">
              <span className="w-2 h-2 rounded-full bg-[#00a88f]" />
              <span className="font-bold">MoEFCC</span>
              <span className="text-[#58647a]">Environment (Protection) Act, 1986</span>
            </div>

            <div className="px-4 py-2 rounded-full bg-[#f8fafc] border border-[#e5e9f2] text-xs font-semibold text-[#1e2430] flex items-center gap-2 shadow-xs hover:border-[#00a88f] hover:bg-white transition-all">
              <span className="w-2 h-2 rounded-full bg-[#00a88f]" />
              <span className="font-bold">IEC 61672-1</span>
              <span className="text-[#58647a]">Class 1 / Class 2 Sound Level Meters</span>
            </div>

            <div className="px-4 py-2 rounded-full bg-[#f8fafc] border border-[#e5e9f2] text-xs font-semibold text-[#1e2430] flex items-center gap-2 shadow-xs hover:border-[#00a88f] hover:bg-white transition-all">
              <span className="w-2 h-2 rounded-full bg-[#00a88f]" />
              <span className="font-bold">ISO 1996-2</span>
              <span className="text-[#58647a]">Environmental Noise Assessment</span>
            </div>

            <div className="px-4 py-2 rounded-full bg-[#f8fafc] border border-[#e5e9f2] text-xs font-semibold text-[#1e2430] flex items-center gap-2 shadow-xs hover:border-[#00a88f] hover:bg-white transition-all">
              <span className="w-2 h-2 rounded-full bg-[#00a88f]" />
              <span className="font-bold">SHA-256</span>
              <span className="text-[#58647a]">Cryptographic Evidence Integrity</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. NON-CUBE INTERACTIVE SOUND SCREENING (ARCHITECTURAL APERTURE) ── */}
      <section id="screening-aperture" className="py-20 px-4 sm:px-6 lg:px-12 max-w-[1440px] mx-auto border-t border-[#e5e9f2]">
        
        {/* Header */}
        <div className="max-w-3xl mb-12 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-[#00a88f] bg-[#f0fdfa] border border-[#99f6e4] mb-3">
            <span>● NON-INVASIVE SCREENING APERTURE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1e2430] tracking-tight">
            Classify sound signatures in real-time.
          </h2>
          <p className="text-[#58647a] text-base mt-2 leading-relaxed">
            Observe our 11-dimensional spectral feature extraction engine live. Switch across calibrated acoustic scenarios or stream your microphone.
          </p>
        </div>

        {/* Asymmetric Organic Deck (rounded-tl-[80px] rounded-br-[80px]) */}
        <div className="bg-white border border-[#e5e9f2] rounded-tl-[64px] rounded-br-[64px] rounded-tr-[24px] rounded-bl-[24px] p-6 sm:p-12 shadow-sm text-left relative overflow-hidden">
          
          {/* Scenario Selector: Stadium / Capsule Pill Tokens */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-8 border-b border-[#e5e9f2]">
            
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8c97a8] mr-1">
                Acoustic Profile:
              </span>
              {Object.keys(SCENARIOS).map((key) => {
                const s = SCENARIOS[key];
                const isSelected = selectedScenario === key && !isLiveMic;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      if (isLiveMic) toggleLiveMic();
                      setSelectedScenario(key);
                    }}
                    className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer border ${
                      isSelected
                        ? 'bg-[#1e2430] text-white border-[#1e2430] shadow-sm'
                        : 'bg-[#fafbfc] text-[#58647a] border-[#e5e9f2] hover:bg-[#f1f5f9]'
                    }`}
                  >
                    <span>{s.shortName}</span>
                  </button>
                );
              })}
            </div>

            {/* Stadium Live Mic Toggle */}
            <button
              onClick={toggleLiveMic}
              className={`px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-xs ${
                isLiveMic 
                  ? 'bg-[#ff5757] hover:bg-[#e64545] text-white' 
                  : 'bg-[#00a88f] hover:bg-[#00937d] text-white'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isLiveMic ? 'bg-white animate-ping' : 'bg-white'}`} />
              <span>{isLiveMic ? 'Stop Microphone' : 'Enable Live Mic'}</span>
            </button>

          </div>

          {/* Main Visualizer Body: Circular Decibel Lens + Smooth Waveform */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center pt-8">
            
            {/* Left Column: Big Circular Acoustic Lens Aperture (Perfect Circle) */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center text-center">
              
              <div 
                className="w-52 h-52 sm:w-60 sm:h-60 rounded-full border-4 flex flex-col items-center justify-center bg-white relative transition-all duration-300 shadow-lg lens-hover-pulse cursor-pointer group"
                style={{ borderColor: scenario.color }}
              >
                {/* Concentric inner sound ring with hover rotation */}
                <div 
                  className="absolute inset-2 rounded-full border border-dashed opacity-40 pointer-events-none group-hover:rotate-45 transition-transform duration-700"
                  style={{ borderColor: scenario.color }}
                />

                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#8c97a8]">
                  {isLiveMic ? 'MICROPHONE Leq' : 'SCENARIO Leq'}
                </span>

                <div className="flex items-baseline gap-1 my-1">
                  <span 
                    className="text-5xl sm:text-6xl font-black tracking-tight group-hover:scale-105 transition-transform duration-300"
                    style={{ color: scenario.color }}
                  >
                    {liveDb.toFixed(1)}
                  </span>
                  <span className="text-xs font-bold font-mono text-[#58647a]">dB(A)</span>
                </div>

                <div 
                  className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider mt-1 group-hover:scale-105 transition-transform"
                  style={{ 
                    backgroundColor: scenario.badgeBg,
                    color: scenario.color
                  }}
                >
                  {scenario.excess}
                </div>
              </div>

              {/* Status note */}
              <div className="text-xs text-[#8c97a8] mt-4 font-medium">
                {isLiveMic ? 'Continuous Web Audio Capture' : `${scenario.name} • ${scenario.zone}`}
              </div>

            </div>

            {/* Right Column: Waveform & 11-D Metrics in Asymmetric Capsule Card */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Waveform with smooth rounded stadium container */}
              <div className="bg-[#f8fafc] border border-[#e5e9f2] rounded-3xl p-5 relative overflow-hidden hover:border-[#cbd5e1] hover:shadow-sm transition-all">
                <div className="flex items-center justify-between text-xs font-mono text-[#8c97a8] mb-2">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00a88f] animate-pulse" />
                    <span>TIME-DOMAIN WAVEFORM (22.05 kHz)</span>
                  </span>
                  <span className="text-[#00a88f] font-bold">{scenario.classification}</span>
                </div>

                <canvas
                  ref={canvasRef}
                  width={650}
                  height={110}
                  className="w-full h-28 block rounded-xl"
                />

                <div className="flex justify-between text-[10px] font-mono text-[#8c97a8] mt-2 pt-2 border-t border-[#e5e9f2]">
                  <span>Sampling Window: 1.0s</span>
                  <span>Centroid: {scenario.centroid}</span>
                  <span style={{ color: scenario.color }} className="font-bold">{scenario.status}</span>
                </div>
              </div>

              {/* 4 Elliptical / Stadium Metric Pills with tactile hover */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-[#fafbfc] border border-[#e5e9f2] rounded-2xl hover:bg-white hover:border-[#00a88f] hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer">
                  <div className="text-[10px] font-mono uppercase text-[#8c97a8]">Confidence</div>
                  <div className="text-base font-bold text-[#00a88f] font-mono mt-0.5">{scenario.confidence}%</div>
                </div>

                <div className="p-3 bg-[#fafbfc] border border-[#e5e9f2] rounded-2xl hover:bg-white hover:border-[#1e2430] hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer">
                  <div className="text-[10px] font-mono uppercase text-[#8c97a8]">Centroid</div>
                  <div className="text-base font-bold text-[#1e2430] font-mono mt-0.5">{scenario.centroid}</div>
                </div>

                <div className="p-3 bg-[#fafbfc] border border-[#e5e9f2] rounded-2xl hover:bg-white hover:border-[#1e2430] hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer">
                  <div className="text-[10px] font-mono uppercase text-[#8c97a8]">Zero-Crossing</div>
                  <div className="text-base font-bold text-[#1e2430] font-mono mt-0.5">{scenario.zcr}</div>
                </div>

                <div className="p-3 bg-[#fafbfc] border border-[#e5e9f2] rounded-2xl hover:bg-white hover:border-[#1e2430] hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer">
                  <div className="text-[10px] font-mono uppercase text-[#8c97a8]">Rolloff</div>
                  <div className="text-base font-bold text-[#1e2430] font-mono mt-0.5">{scenario.rolloff}</div>
                </div>
              </div>

            </div>

          </div>

          {/* Action Footer */}
          <div className="mt-8 pt-6 border-t border-[#e5e9f2] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-[#58647a]">
              Acoustic signatures matching threshold exceedance rules trigger operator review dossiers.
            </div>
            <Link to="/dashboard" className="btn-qwilr-teal text-xs px-7 py-3.5 whitespace-nowrap shrink-0 rounded-full">
              OPEN LIVE DASHBOARD &rarr;
            </Link>
          </div>

        </div>

      </section>

      {/* ── 3. FOUR DISTINCT ARCHITECTURAL SHAPES (NOT CUBES) ───────── */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-12 max-w-[1440px] mx-auto border-t border-[#e5e9f2]">
        
        <div className="max-w-3xl mb-14 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-[#00a88f] bg-[#f0fdfa] border border-[#99f6e4] mb-3">
            <span>CORE ARCHITECTURE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1e2430] tracking-tight">
            Engineered silhouettes for acoustic integrity.
          </h2>
          <p className="text-[#58647a] text-base mt-2 leading-relaxed">
            Each subsystem is shaped to reflect its operational role—from continuous capture to legal certification.
          </p>
        </div>

        {/* 4 Distinct Geometric Silhouettes: Arch, Pebble, Reverse Pebble, Inverted Arch */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Silhouette 1: Tall Arched Portal (rounded-t-[80px]) */}
          <div className="shape-arch card-hover-teal bg-white border border-[#e5e9f2] p-8 shadow-xs flex flex-col justify-between text-left group cursor-pointer">
            <div>
              {/* Circular Icon Aperture with Hover Scaling & Rotation */}
              <div className="w-16 h-16 rounded-full bg-[#f0fdfa] border border-[#99f6e4] text-[#00a88f] flex items-center justify-center font-bold text-sm mb-6 mx-auto group-hover:scale-115 group-hover:rotate-6 group-hover:shadow-md transition-all duration-300">
                01
              </div>
              <h3 className="text-lg font-bold text-[#1e2430] mb-2 text-center group-hover:text-[#00a88f] transition-colors">
                Continuous Telemetry
              </h3>
              <p className="text-xs text-[#58647a] leading-relaxed text-center">
                Ingest real-time acoustic streams from Web Audio browser sessions, IoT nodes, and Class 1 certified environmental meters.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-[#f1f5f9] text-[11px] font-bold text-[#00a88f] uppercase tracking-wider text-center flex items-center justify-center gap-1">
              <span>Web Audio &amp; IoT Fleet</span>
              <span className="group-hover:translate-x-1.5 transition-transform duration-200">&rarr;</span>
            </div>
          </div>

          {/* Silhouette 2: Asymmetric Organic Pebble (rounded-tl-[64px] rounded-br-[64px]) */}
          <div className="shape-pebble-1 card-hover-coral bg-white border border-[#e5e9f2] p-8 shadow-xs flex flex-col justify-between text-left group cursor-pointer">
            <div>
              {/* Diamond-in-Circle Badge with Hover Scaling */}
              <div className="w-16 h-16 rounded-full bg-[#fff0f0] border border-[#ffd1d1] text-[#ff5757] flex items-center justify-center font-bold text-sm mb-6 group-hover:scale-115 group-hover:-rotate-6 group-hover:shadow-md transition-all duration-300">
                02
              </div>
              <h3 className="text-lg font-bold text-[#1e2430] mb-2 group-hover:text-[#ff5757] transition-colors">
                11-D ML Classifier
              </h3>
              <p className="text-xs text-[#58647a] leading-relaxed">
                Extracts RMS energy, spectral centroid, rolloff, and sub-band ratios to recognize industrial machinery, sirens, and traffic.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-[#f1f5f9] text-[11px] font-bold text-[#ff5757] uppercase tracking-wider flex items-center gap-1">
              <span>98% Cross-Validated</span>
              <span className="group-hover:translate-x-1.5 transition-transform duration-200">&rarr;</span>
            </div>
          </div>

          {/* Silhouette 3: Reverse Organic Pebble (rounded-tr-[64px] rounded-bl-[64px]) */}
          <div className="shape-pebble-2 card-hover-interactive bg-white border border-[#e5e9f2] p-8 shadow-xs flex flex-col justify-between text-left group cursor-pointer hover:border-[#1e2430]">
            <div>
              <div className="w-16 h-16 rounded-full bg-[#f8fafc] border border-[#e5e9f2] text-[#1e2430] flex items-center justify-center font-bold text-sm mb-6 group-hover:scale-115 group-hover:rotate-6 group-hover:shadow-md transition-all duration-300">
                03
              </div>
              <h3 className="text-lg font-bold text-[#1e2430] mb-2 group-hover:text-[#00a88f] transition-colors">
                Zone Statutory Engine
              </h3>
              <p className="text-xs text-[#58647a] leading-relaxed">
                Mathematical rule evaluation codifies residential, commercial, industrial, and silent zone limits with day/night time-awareness.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-[#f1f5f9] text-[11px] font-bold text-[#1e2430] uppercase tracking-wider flex items-center gap-1">
              <span>Rule 3(1) Compliant</span>
              <span className="group-hover:translate-x-1.5 transition-transform duration-200">&rarr;</span>
            </div>
          </div>

          {/* Silhouette 4: Inverted Arch (rounded-b-[80px]) */}
          <div className="shape-arch-inverted card-hover-teal bg-white border border-[#e5e9f2] p-8 shadow-xs flex flex-col justify-between text-left group cursor-pointer">
            <div>
              <div className="w-16 h-16 rounded-full bg-[#f0fdfa] border border-[#99f6e4] text-[#00a88f] flex items-center justify-center font-bold text-sm mb-6 mx-auto group-hover:scale-115 group-hover:-rotate-6 group-hover:shadow-md transition-all duration-300">
                04
              </div>
              <h3 className="text-lg font-bold text-[#1e2430] mb-2 text-center group-hover:text-[#00a88f] transition-colors">
                Court-Admissible PDFs
              </h3>
              <p className="text-xs text-[#58647a] leading-relaxed text-center">
                Automatic generation of formal compliance dossiers with SHA-256 cryptographic hashes, calibration metadata, and jurisdictional sign-off.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-[#f1f5f9] text-[11px] font-bold text-[#00a88f] uppercase tracking-wider text-center flex items-center justify-center gap-1">
              <span>ReportLab Engine</span>
              <span className="group-hover:translate-x-1.5 transition-transform duration-200">&rarr;</span>
            </div>
          </div>

        </div>
      </section>

      {/* ── 4. JURISDICTIONAL STANDARDS AS ARCHED STELE (NOT A FLAT TABLE) ── */}
      <section id="standards" className="py-20 px-4 sm:px-6 lg:px-12 max-w-[1440px] mx-auto border-t border-[#e5e9f2] bg-[#fafbfc]">
        
        <div className="max-w-3xl mb-12 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-[#ff5757] bg-[#fff0f0] border border-[#ffd1d1] mb-3">
            <span>REGULATORY STANDARDS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1e2430] tracking-tight">
            Codified statutory threshold limits.
          </h2>
          <p className="text-[#58647a] text-base mt-2 leading-relaxed">
            Statutory decibel limits codified under The Noise Pollution (Regulation &amp; Control) Rules and WHO Guidelines.
          </p>
        </div>

        {/* 4 Arched Stele Pillars with Rich Hover Effects */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
          
          {/* Zone 1: Residential Stele (Teal Arch) */}
          <div className="shape-arch card-hover-teal bg-white border border-[#e5e9f2] p-7 shadow-xs flex flex-col justify-between cursor-pointer group">
            <div>
              {/* Circular Dial Header with Hover Scaling */}
              <div className="w-20 h-20 rounded-full bg-[#f0fdfa] border-2 border-[#00a88f] mx-auto flex flex-col items-center justify-center text-center mb-5 group-hover:scale-115 group-hover:shadow-md transition-all duration-300">
                <span className="text-xl font-black text-[#00a88f]">55</span>
                <span className="text-[9px] font-bold text-[#58647a] uppercase">dB(A) DAY</span>
              </div>

              <h3 className="text-base font-bold text-[#1e2430] text-center mb-1 group-hover:text-[#00a88f] transition-colors">
                Residential Area
              </h3>
              <div className="text-[11px] font-mono text-[#8c97a8] text-center uppercase mb-4">
                Area Code C • Rule 3(1)
              </div>

              <div className="space-y-2 py-3 border-t border-b border-[#f1f5f9] text-xs">
                <div className="flex justify-between">
                  <span className="text-[#58647a]">Day (06:00–22:00):</span>
                  <span className="font-bold text-[#00a88f]">55 dB(A)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#58647a]">Night (22:00–06:00):</span>
                  <span className="font-bold text-[#ff5757]">45 dB(A)</span>
                </div>
              </div>
            </div>

            <div className="mt-5 text-[11px] text-[#58647a] text-center">
              Housing colonies, community suburbs and residential apartments.
            </div>
          </div>

          {/* Zone 2: Commercial Stele */}
          <div className="shape-arch card-hover-interactive bg-white border border-[#e5e9f2] p-7 shadow-xs flex flex-col justify-between hover:border-[#1e2430] cursor-pointer group">
            <div>
              <div className="w-20 h-20 rounded-full bg-[#f8fafc] border-2 border-[#1e2430] mx-auto flex flex-col items-center justify-center text-center mb-5 group-hover:scale-115 group-hover:shadow-md transition-all duration-300">
                <span className="text-xl font-black text-[#1e2430]">65</span>
                <span className="text-[9px] font-bold text-[#58647a] uppercase">dB(A) DAY</span>
              </div>

              <h3 className="text-base font-bold text-[#1e2430] text-center mb-1 group-hover:text-[#1e2430] transition-colors">
                Commercial Area
              </h3>
              <div className="text-[11px] font-mono text-[#8c97a8] text-center uppercase mb-4">
                Area Code B • Rule 3(1)
              </div>

              <div className="space-y-2 py-3 border-t border-b border-[#f1f5f9] text-xs">
                <div className="flex justify-between">
                  <span className="text-[#58647a]">Day (06:00–22:00):</span>
                  <span className="font-bold text-[#00a88f]">65 dB(A)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#58647a]">Night (22:00–06:00):</span>
                  <span className="font-bold text-[#ff5757]">55 dB(A)</span>
                </div>
              </div>
            </div>

            <div className="mt-5 text-[11px] text-[#58647a] text-center">
              Retail markets, shopping centers, restaurants and business districts.
            </div>
          </div>

          {/* Zone 3: Industrial Stele */}
          <div className="shape-arch card-hover-amber bg-white border border-[#e5e9f2] p-7 shadow-xs flex flex-col justify-between cursor-pointer group">
            <div>
              <div className="w-20 h-20 rounded-full bg-[#fffbeb] border-2 border-[#d97706] mx-auto flex flex-col items-center justify-center text-center mb-5 group-hover:scale-115 group-hover:shadow-md transition-all duration-300">
                <span className="text-xl font-black text-[#d97706]">75</span>
                <span className="text-[9px] font-bold text-[#58647a] uppercase">dB(A) DAY</span>
              </div>

              <h3 className="text-base font-bold text-[#1e2430] text-center mb-1 group-hover:text-[#d97706] transition-colors">
                Industrial Area
              </h3>
              <div className="text-[11px] font-mono text-[#8c97a8] text-center uppercase mb-4">
                Area Code A • Factories Act
              </div>

              <div className="space-y-2 py-3 border-t border-b border-[#f1f5f9] text-xs">
                <div className="flex justify-between">
                  <span className="text-[#58647a]">Day (06:00–22:00):</span>
                  <span className="font-bold text-[#00a88f]">75 dB(A)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#58647a]">Night (22:00–06:00):</span>
                  <span className="font-bold text-[#ff5757]">70 dB(A)</span>
                </div>
              </div>
            </div>

            <div className="mt-5 text-[11px] text-[#58647a] text-center">
              Heavy factories, manufacturing complexes and logistics hubs.
            </div>
          </div>

          {/* Zone 4: Silence Zone Stele (Coral Arch) */}
          <div className="shape-arch card-hover-coral bg-white border border-[#e5e9f2] p-7 shadow-xs flex flex-col justify-between cursor-pointer group">
            <div>
              <div className="w-20 h-20 rounded-full bg-[#fff0f0] border-2 border-[#ff5757] mx-auto flex flex-col items-center justify-center text-center mb-5 group-hover:scale-115 group-hover:shadow-md transition-all duration-300">
                <span className="text-xl font-black text-[#ff5757]">50</span>
                <span className="text-[9px] font-bold text-[#58647a] uppercase">dB(A) DAY</span>
              </div>

              <h3 className="text-base font-bold text-[#1e2430] text-center mb-1 group-hover:text-[#ff5757] transition-colors">
                Silence Zone
              </h3>
              <div className="text-[11px] font-mono text-[#8c97a8] text-center uppercase mb-4">
                100m Enclave • Rule 3(2)
              </div>

              <div className="space-y-2 py-3 border-t border-b border-[#f1f5f9] text-xs">
                <div className="flex justify-between">
                  <span className="text-[#58647a]">Day (06:00–22:00):</span>
                  <span className="font-bold text-[#00a88f]">50 dB(A)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#58647a]">Night (22:00–06:00):</span>
                  <span className="font-bold text-[#ff5757]">40 dB(A)</span>
                </div>
              </div>
            </div>

            <div className="mt-5 text-[11px] text-[#58647a] text-center">
              100m perimeter around hospitals, courts, schools and universities.
            </div>
          </div>

        </div>

      </section>

      {/* ── 5. SCIENTIFIC TRANSPARENCY NOTICE (STADIUM CAPSULE) ──── */}
      <section className="py-16 px-4 sm:px-6 lg:px-12 max-w-[1440px] mx-auto border-t border-[#e5e9f2]">
        <div className="bg-white border border-[#e5e9f2] rounded-3xl sm:rounded-full p-8 sm:p-12 text-left">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              <span className="inline-block px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full bg-[#fff0f0] text-[#ff5757] border border-[#ffd1d1]">
                Legal &amp; Scientific Governance
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-[#1e2430]">
                Strict separation of screening estimates from certified legal evidence.
              </h3>
              <p className="text-xs sm:text-sm text-[#58647a] leading-relaxed">
                NoiseWatch distinguishes between uncalibrated browser microphones, IoT screening stations, and IEC 61672 Class 1/2 sound level meters. Algorithmic flags initiate an operator review dossier and do not constitute a unilateral declaration of legal liability.
              </p>
            </div>
            <Link 
              to="/reports" 
              className="btn-qwilr-outline text-xs px-6 py-3 rounded-full whitespace-nowrap shrink-0"
            >
              READ FULL METHODOLOGY &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ── 6. BOTTOM CTA (DOUBLE ARCH PORTAL) ────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-12 max-w-[1440px] mx-auto border-t border-[#e5e9f2] text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1e2430] tracking-tight">
            Ready to monitor your acoustic environment?
          </h2>
          <p className="text-base text-[#58647a] leading-relaxed">
            Gain immediate visibility into real-time decibels, spectral classifications, and statutory compliance.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/dashboard" className="btn-qwilr-teal text-sm px-8 py-4 w-full sm:w-auto rounded-full">
              LAUNCH MONITORING DASHBOARD &rarr;
            </Link>
            <Link to="/map" className="btn-qwilr-outline text-sm px-7 py-4 w-full sm:w-auto rounded-full">
              VIEW LIVE MAP
            </Link>
          </div>
        </div>
      </section>

      {/* ── 7. FOOTER (PURE TYPOGRAPHY, ICON-FREE) ────────────────── */}
      <footer className="border-t border-[#e5e9f2] bg-white py-12 px-4 sm:px-6 lg:px-12 text-xs text-[#8c97a8]">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#1e2430] text-sm tracking-tight">
              Noise<span className="text-[#00a88f]">Watch</span>
            </span>
            <span className="mx-1">•</span>
            <span>&copy; {new Date().getFullYear()} Environmental Acoustic Intelligence</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="text-[#58647a] hover:text-[#1e2430] no-underline">Dashboard</Link>
            <Link to="/map" className="text-[#58647a] hover:text-[#1e2430] no-underline">Map</Link>
            <Link to="/reports" className="text-[#58647a] hover:text-[#1e2430] no-underline">Reports</Link>
            <Link to="/login" className="text-[#58647a] hover:text-[#1e2430] no-underline">Demo Login</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
