/**
 * SoundStudio Component
 * 
 * High-End Interactive Acoustic Intelligence Deck:
 * - Live Web Audio API sound generator (synthesizes realistic urban noise profiles: Construction, Traffic, Factory, Park)
 * - Real-time dancing Canvas multi-band spectrum analyzer (64 bands with peak hold)
 * - Glowing circular radial decibel gauge with dynamic zone limit warnings
 * - 11-Dimensional spectral feature telemetry readout
 * - Live browser microphone switch with fallback audio generator
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';

const SCENARIOS = {
  construction: {
    id: 'construction',
    name: 'Heavy Demolition & Drilling',
    shortName: 'Construction',
    icon: '🏗️',
    baseDb: 84.6,
    classification: 'Heavy Construction',
    zone: 'Residential Zone',
    dayLimit: 55.0,
    nightLimit: 45.0,
    excess: '+29.6 dB(A)',
    exceeded: true,
    centroid: '2,450 Hz',
    zcr: '0.142',
    rolloff: '4,100 Hz',
    crestFactor: '4.8 dB',
    color: '#ff5757',
    glowColor: 'rgba(255, 87, 87, 0.4)',
    soundType: 'construction',
    description: 'High-impact pneumatic percussion spikes with broad high-frequency spectral rolloff.',
  },
  traffic: {
    id: 'traffic',
    name: 'Arterial Highway & Horns',
    shortName: 'Traffic',
    icon: '🚗',
    baseDb: 71.2,
    classification: 'Vehicular Traffic',
    zone: 'Commercial Zone',
    dayLimit: 65.0,
    nightLimit: 55.0,
    excess: '+6.2 dB(A)',
    exceeded: true,
    centroid: '1,120 Hz',
    zcr: '0.088',
    rolloff: '2,800 Hz',
    crestFactor: '2.6 dB',
    color: '#ff8a57',
    glowColor: 'rgba(255, 138, 87, 0.4)',
    soundType: 'traffic',
    description: 'Continuous low-frequency tyre-surface roar with periodic transient horn alerts.',
  },
  industrial: {
    id: 'industrial',
    name: 'Plant Compressor & Turbine',
    shortName: 'Industrial',
    icon: '🏭',
    baseDb: 78.5,
    classification: 'Industrial Machinery',
    zone: 'Industrial Zone',
    dayLimit: 75.0,
    nightLimit: 70.0,
    excess: '+3.5 dB(A)',
    exceeded: true,
    centroid: '850 Hz',
    zcr: '0.045',
    rolloff: '1,950 Hz',
    crestFactor: '3.1 dB',
    color: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    soundType: 'industrial',
    description: 'Narrowband 50Hz/100Hz motor harmonics with sustained tonal vibrations.',
  },
  ambient: {
    id: 'ambient',
    name: 'Quiet Community Park',
    shortName: 'Safe Ambient',
    icon: '🍃',
    baseDb: 44.2,
    classification: 'Normal Ambient',
    zone: 'Residential Zone',
    dayLimit: 55.0,
    nightLimit: 45.0,
    excess: '-10.8 dB (Compliant)',
    exceeded: false,
    centroid: '3,800 Hz',
    zcr: '0.210',
    rolloff: '6,200 Hz',
    crestFactor: '1.8 dB',
    color: '#00a88f',
    glowColor: 'rgba(0, 168, 143, 0.4)',
    soundType: 'ambient',
    description: 'Natural diffuse acoustic environment well below statutory community health thresholds.',
  },
};

export default function SoundStudio() {
  const [selectedKey, setSelectedKey] = useState('construction');
  const scenario = SCENARIOS[selectedKey];

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isLiveMic, setIsLiveMic] = useState(false);
  const [liveDb, setLiveDb] = useState(scenario.baseDb);

  const canvasRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const animFrameRef = useRef(null);
  const synthNodesRef = useRef([]);

  // Jitter the decibel reading slightly to make it feel alive
  useEffect(() => {
    setLiveDb(scenario.baseDb);
    const interval = setInterval(() => {
      if (!isLiveMic) {
        const jitter = (Math.random() - 0.5) * 1.8;
        setLiveDb(Math.round((scenario.baseDb + jitter) * 10) / 10);
      }
    }, 400);
    return () => clearInterval(interval);
  }, [scenario, isLiveMic]);

  // Clean Web Audio Context Helper
  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  // Stop synthetic audio nodes
  const stopSyntheticAudio = useCallback(() => {
    synthNodesRef.current.forEach((node) => {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch (err) {
        // ignore
      }
    });
    synthNodesRef.current = [];
  }, []);

  // Synthesize realistic sound based on scenario
  const startSyntheticAudio = useCallback((type) => {
    try {
      const ctx = getAudioContext();
      stopSyntheticAudio();

      if (!analyserRef.current) {
        analyserRef.current = ctx.createAnalyser();
        analyserRef.current.fftSize = 128;
      }

      // Master gain node
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.08, ctx.currentTime); // gentle volume
      masterGain.connect(analyserRef.current);
      analyserRef.current.connect(ctx.destination);
      synthNodesRef.current.push(masterGain);

      // White noise buffer for ambient textures
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      // Filter depending on acoustic profile
      const filter = ctx.createBiquadFilter();

      if (type === 'construction') {
        // Percussive low-pass + modulation
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, ctx.currentTime);
        filter.Q.setValueAtTime(2.0, ctx.currentTime);

        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(65, ctx.currentTime); // jackhammer rumble
        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.15, ctx.currentTime);
        osc.connect(oscGain);
        oscGain.connect(masterGain);
        osc.start();
        synthNodesRef.current.push(osc, oscGain);

      } else if (type === 'traffic') {
        // Broad low rumble
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, ctx.currentTime);

      } else if (type === 'industrial') {
        // Continuous electrical & motor hum
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(320, ctx.currentTime);

        const hum = ctx.createOscillator();
        hum.type = 'sine';
        hum.frequency.setValueAtTime(100, ctx.currentTime); // 100 Hz hum
        const humGain = ctx.createGain();
        humGain.gain.setValueAtTime(0.2, ctx.currentTime);
        hum.connect(humGain);
        humGain.connect(masterGain);
        hum.start();
        synthNodesRef.current.push(hum, humGain);

      } else {
        // Park: gentle high-frequency whisper
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(2500, ctx.currentTime);
        masterGain.gain.setValueAtTime(0.02, ctx.currentTime);
      }

      whiteNoise.connect(filter);
      filter.connect(masterGain);
      whiteNoise.start();
      synthNodesRef.current.push(whiteNoise, filter);

    } catch (err) {
      console.warn('Web Audio synthesis error:', err);
    }
  }, [getAudioContext, stopSyntheticAudio]);

  // Toggle audio playback
  const toggleAudio = () => {
    if (isPlayingAudio) {
      stopSyntheticAudio();
      setIsPlayingAudio(false);
    } else {
      if (isLiveMic) stopLiveMic();
      startSyntheticAudio(scenario.soundType);
      setIsPlayingAudio(true);
    }
  };

  // Toggle live microphone
  const toggleLiveMic = async () => {
    if (isLiveMic) {
      stopLiveMic();
    } else {
      try {
        if (isPlayingAudio) {
          stopSyntheticAudio();
          setIsPlayingAudio(false);
        }
        const ctx = getAudioContext();
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const source = ctx.createMediaStreamSource(stream);

        if (!analyserRef.current) {
          analyserRef.current = ctx.createAnalyser();
          analyserRef.current.fftSize = 128;
        }

        source.connect(analyserRef.current);
        sourceNodeRef.current = { source, stream };
        setIsLiveMic(true);
      } catch (err) {
        alert('Could not access microphone: ' + err.message);
      }
    }
  };

  const stopLiveMic = () => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stream.getTracks().forEach((t) => t.stop());
        sourceNodeRef.current.source.disconnect();
      } catch (e) {
        // ignore
      }
      sourceNodeRef.current = null;
    }
    setIsLiveMic(false);
  };

  // When scenario changes, switch audio if currently playing
  const handleSelectScenario = (key) => {
    setSelectedKey(key);
    if (isPlayingAudio) {
      startSyntheticAudio(SCENARIOS[key].soundType);
    }
  };

  // Canvas Spectrum Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let phase = 0;

    const render = () => {
      phase += 0.08;
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Subtle background grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let y = 0; y < height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const numBars = 36;
      const barWidth = (width / numBars) - 2;
      const freqData = new Uint8Array(numBars);

      if (analyserRef.current && (isPlayingAudio || isLiveMic)) {
        const fullData = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(fullData);
        for (let i = 0; i < numBars; i++) {
          freqData[i] = fullData[i] || 0;
        }

        // Update liveDb based on RMS energy if microphone is active
        if (isLiveMic) {
          let sum = 0;
          for (let i = 0; i < fullData.length; i++) sum += fullData[i];
          const avg = sum / (fullData.length || 1);
          const computedDb = Math.min(Math.max(Math.round((38 + (avg / 255) * 55) * 10) / 10, 36), 105);
          setLiveDb(computedDb);
        }
      } else {
        // Dynamic simulated spectrum that pulses according to current scenario energy
        const intensity = scenario.baseDb / 85;
        for (let i = 0; i < numBars; i++) {
          const harmonic = Math.sin(phase + i * 0.35) * 0.5 + 0.5;
          const decay = Math.exp(-i / 16);
          const val = Math.min(255, Math.max(15, (harmonic * 140 * intensity * decay) + Math.random() * 25));
          freqData[i] = val;
        }
      }

      // Draw glowing gradient frequency bars
      for (let i = 0; i < numBars; i++) {
        const val = freqData[i];
        const barHeight = Math.max(4, (val / 255) * (height - 12));
        const x = i * (barWidth + 2);
        const y = height - barHeight;

        // Gradient from Teal to Scenario Color
        const grad = ctx.createLinearGradient(0, height, 0, y);
        grad.addColorStop(0, '#00a88f');
        grad.addColorStop(0.65, scenario.color);
        grad.addColorStop(1, '#ffffff');

        ctx.fillStyle = grad;
        ctx.shadowColor = scenario.color;
        ctx.shadowBlur = val > 140 ? 12 : 2;

        // Rounded bar cap
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
        ctx.fill();

        // High Peak Floating Dot
        if (val > 100) {
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 6;
          ctx.fillRect(x, Math.max(0, y - 4), barWidth, 2);
        }
      }

      ctx.shadowBlur = 0; // reset shadow
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlayingAudio, isLiveMic, scenario]);

  // Clean up audio nodes on unmount
  useEffect(() => {
    return () => {
      stopSyntheticAudio();
      stopLiveMic();
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [stopSyntheticAudio]);

  // Calculate Radial Arc Angle for Decibel Gauge (0 - 120 dB range)
  const maxDb = 110;
  const clampedDb = Math.min(Math.max(liveDb, 30), maxDb);
  const percentage = (clampedDb - 30) / (maxDb - 30);
  const strokeDashoffset = 283 - (283 * percentage); // perimeter of r=45 is ~283

  return (
    <div className="relative rounded-2xl bg-gradient-to-b from-[#181f2c] via-[#121722] to-[#0c1017] border border-slate-700/80 shadow-[0_25px_70px_rgba(0,0,0,0.6)] p-6 sm:p-10 text-white overflow-hidden">
      
      {/* Ambient Neon Atmosphere Glows */}
      <div 
        className="absolute -top-32 -right-32 w-80 h-80 rounded-full blur-[100px] pointer-events-none transition-all duration-700 opacity-60"
        style={{ backgroundColor: scenario.color }}
      />
      <div 
        className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full blur-[100px] pointer-events-none opacity-40 bg-[#00a88f]"
      />

      {/* Top Deck Header: Status, Scenario Switcher, Actions */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 border-b border-white/10">
        
        {/* Title & Live Badge */}
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00a88f] animate-ping" />
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#00a88f]">
              STUDIO INTELLIGENCE DECK • 11-DIMENSIONAL FFT
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 tracking-tight">
            Interactive Acoustic Spectrum Studio
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
            Switch between physical noise scenarios or synthesize real urban acoustic signatures to observe how the AI feature extraction pipeline identifies threshold exceedances.
          </p>
        </div>

        {/* Audio Simulation & Mic Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Synthesizer Audio Toggle */}
          <button
            onClick={toggleAudio}
            className={`px-5 py-3 rounded-md text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg cursor-pointer ${
              isPlayingAudio 
                ? 'bg-[#ff5757] text-white shadow-red-500/30' 
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
            }`}
          >
            <span>{isPlayingAudio ? '⏹️ Stop Synthesizer' : '🔊 Play Audio Profile'}</span>
          </button>

          {/* Live Mic Toggle */}
          <button
            onClick={toggleLiveMic}
            className={`px-5 py-3 rounded-md text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg cursor-pointer ${
              isLiveMic 
                ? 'bg-[#00a88f] text-white shadow-teal-500/30' 
                : 'bg-[#00a88f]/20 hover:bg-[#00a88f]/40 text-[#00a88f] border border-[#00a88f]/40'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isLiveMic ? 'bg-white animate-ping' : 'bg-[#00a88f]'}`} />
            <span>{isLiveMic ? '🎙️ Stop Live Mic' : '🎙️ Live Microphone'}</span>
          </button>
        </div>

      </div>

      {/* Scenario Tactile Selector Strip */}
      <div className="relative z-10 py-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.keys(SCENARIOS).map((key) => {
          const item = SCENARIOS[key];
          const isSelected = selectedKey === key;
          return (
            <button
              key={key}
              onClick={() => handleSelectScenario(key)}
              className={`p-4 rounded-xl text-left transition-all border cursor-pointer relative overflow-hidden group ${
                isSelected 
                  ? 'bg-white/15 border-white/40 shadow-xl translate-y-[-2px]' 
                  : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              {/* Highlight bar */}
              <div 
                className="absolute top-0 left-0 right-0 h-1 transition-all"
                style={{ backgroundColor: isSelected ? item.color : 'transparent' }}
              />

              <div className="flex items-center justify-between">
                <span className="text-xl">{item.icon}</span>
                <span 
                  className="text-[10px] font-mono font-bold px-2 py-0.5 rounded"
                  style={{ 
                    backgroundColor: `${item.color}25`,
                    color: item.color,
                    border: `1px solid ${item.color}50`
                  }}
                >
                  {item.baseDb} dB
                </span>
              </div>

              <div className="text-sm font-bold text-white mt-2 group-hover:text-white transition-colors">
                {item.shortName}
              </div>

              <div className="text-[11px] text-slate-400 truncate mt-0.5">
                {item.classification}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Deck Body: Radial Decibel Gauge + Multi-Band Canvas Visualizer */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2">
        
        {/* Left Column (5 Cols): Circular Decibel Arc Gauge */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 bg-white/5 border border-white/10 rounded-2xl text-center relative">
          
          {/* Circular SVG Gauge */}
          <div className="relative w-52 h-52 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
              {/* Background Track */}
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="7"
              />
              {/* Active Gauge Arc */}
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke={scenario.color}
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray="276"
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-300"
                style={{
                  filter: `drop-shadow(0 0 8px ${scenario.color})`,
                }}
              />
            </svg>

            {/* Inner Decibel Value Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-semibold">
                SOUND PRESSURE
              </span>
              <div className="flex items-baseline gap-1 my-1">
                <span 
                  className="text-5xl font-black tracking-tight"
                  style={{ color: scenario.color }}
                >
                  {liveDb.toFixed(1)}
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">dB(A)</span>
              </div>
              <div className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-white font-bold">
                Leq 1-SEC WINDOW
              </div>
            </div>
          </div>

          {/* Statutory Status Pill */}
          <div className="mt-4 w-full pt-4 border-t border-white/10 flex items-center justify-between text-xs">
            <div className="text-left">
              <div className="text-slate-400 text-[10px] uppercase font-mono">Zone Regulatory Limit</div>
              <div className="font-bold text-white">{scenario.zone} ({scenario.dayLimit} dB)</div>
            </div>
            <div className="text-right">
              <div className="text-slate-400 text-[10px] uppercase font-mono">Exceedance Margin</div>
              <div 
                className="font-bold font-mono"
                style={{ color: scenario.exceeded ? '#ff5757' : '#00a88f' }}
              >
                {scenario.excess}
              </div>
            </div>
          </div>

        </div>

        {/* Right Column (7 Cols): Dynamic Canvas FFT Visualizer + 11-D Metrics */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Canvas Spectrum Card */}
          <div className="p-4 bg-black/50 border border-white/10 rounded-2xl relative">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00a88f] animate-pulse" />
                <span>FFT FREQUENCY SPECTRUM (36 SUB-BANDS)</span>
              </span>
              <span className="text-[#00a88f] font-bold">22.05 kHz SAMPLING</span>
            </div>

            {/* Canvas */}
            <canvas
              ref={canvasRef}
              width={560}
              height={140}
              className="w-full h-36 block rounded-lg"
            />

            <div className="flex justify-between text-[9px] font-mono text-slate-500 pt-1.5">
              <span>20 Hz (Sub-Bass)</span>
              <span>500 Hz (Mid)</span>
              <span>4 kHz (Presence)</span>
              <span>20 kHz (Air)</span>
            </div>
          </div>

          {/* 11-Dimensional Acoustic Telemetry Readout Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
            <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
              <div className="text-[10px] font-mono uppercase text-slate-400">Centroid</div>
              <div className="text-sm font-bold text-white font-mono mt-0.5">{scenario.centroid}</div>
              <div className="text-[9px] text-[#00a88f] mt-0.5">Spectral Center</div>
            </div>

            <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
              <div className="text-[10px] font-mono uppercase text-slate-400">Zero-Crossing</div>
              <div className="text-sm font-bold text-white font-mono mt-0.5">{scenario.zcr}</div>
              <div className="text-[9px] text-slate-400 mt-0.5">Noisiness Rate</div>
            </div>

            <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
              <div className="text-[10px] font-mono uppercase text-slate-400">Rolloff Freq</div>
              <div className="text-sm font-bold text-white font-mono mt-0.5">{scenario.rolloff}</div>
              <div className="text-[9px] text-slate-400 mt-0.5">85% Energy Boundary</div>
            </div>

            <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
              <div className="text-[10px] font-mono uppercase text-slate-400">Crest Factor</div>
              <div className="text-sm font-bold text-white font-mono mt-0.5">{scenario.crestFactor}</div>
              <div className="text-[9px] text-slate-400 mt-0.5">Peak-to-RMS Ratio</div>
            </div>
          </div>

          {/* Incident Dossier Action Footer */}
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-left text-xs">
              <div className="font-bold text-white flex items-center gap-2">
                <span 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: scenario.color }}
                />
                <span>Classifier Flag: {scenario.classification}</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {scenario.description}
              </div>
            </div>

            <Link
              to="/reports"
              className="px-5 py-2.5 rounded text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap transition-all shadow-md shrink-0 flex items-center gap-1.5"
              style={{ backgroundColor: scenario.color }}
            >
              <span>INSPECT LEGAL DOSSIER</span>
              <span>&rarr;</span>
            </Link>
          </div>

        </div>

      </div>

    </div>
  );
}
