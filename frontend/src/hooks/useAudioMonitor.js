/**
 * useAudioMonitor Hook
 * 
 * Manages browser-based Web Audio API capture, real-time waveform extraction,
 * uncalibrated decibel estimation, and simulation fallback.
 * 
 * CRITICAL TRANSPARENCY REQUIREMENT:
 * - Browser microphone readings are explicitly labeled as "Estimated Uncalibrated dB".
 * - Never present browser audio as certified Class 1 or Class 2 sound meter measurements.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export function useAudioMonitor({ onReadingRecorded } = {}) {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [micPermission, setMicPermission] = useState('prompt'); // 'prompt', 'granted', 'denied'
  const [currentDb, setCurrentDb] = useState(48.2);
  const [peakDb, setPeakDb] = useState(52.0);
  const [averageDb, setAverageDb] = useState(47.5);
  const [mode, setMode] = useState('simulated'); // 'live_microphone' or 'simulated'
  const [waveformData, setWaveformData] = useState(new Array(64).fill(0));
  const [measurementQuality, setQuality] = useState({
    method: 'simulated_demo',
    label: 'Simulated Demo Stream',
    isCalibrated: false,
    disclaimer: 'Sample data generated for demonstration purposes only.',
  });

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const readingHistoryRef = useRef([]);

  // Calculate dB from RMS (approximate logarithmic scale relative to standard reference)
  const rmsToDb = useCallback((rms) => {
    if (rms <= 0.00001) return 30.0;
    // Standard relative formula: 20 * log10(rms) + offset
    // Browser mics have no hardware calibration; calibrated baseline ~90-100dB offset
    const estimated = 20 * Math.log10(rms) + 94.0;
    return Math.min(Math.max(Math.round(estimated * 10) / 10, 32.0), 115.0);
  }, []);

  // Simulation step
  const runSimulationStep = useCallback(() => {
    // Generate realistic fluctuating ambient sound around 45-55 dBA, with occasional spikes
    const time = Date.now() / 1000;
    const base = 48.0 + Math.sin(time * 0.5) * 4.0 + Math.sin(time * 2.1) * 2.5;
    const jitter = (Math.random() - 0.5) * 3.0;
    const spike = Math.random() > 0.96 ? Math.random() * 22.0 : 0; // occasional loud event
    const val = Math.min(Math.max(Math.round((base + jitter + spike) * 10) / 10, 35.0), 92.0);

    setCurrentDb(val);
    setPeakDb((prev) => Math.max(prev, val));

    readingHistoryRef.current.push(val);
    if (readingHistoryRef.current.length > 50) readingHistoryRef.current.shift();
    const avg = readingHistoryRef.current.reduce((a, b) => a + b, 0) / readingHistoryRef.current.length;
    setAverageDb(Math.round(avg * 10) / 10);

    // Simulated waveform
    const wave = new Array(64).fill(0).map((_, i) => {
      return Math.sin(i * 0.3 + time * 6) * 0.4 + (Math.random() - 0.5) * 0.25;
    });
    setWaveformData(wave);
  }, []);

  // Web Audio microphone processor loop
  const processMicFrame = useCallback(() => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.fftSize;
    const dataArray = new Float32Array(bufferLength);
    analyserRef.current.getFloatTimeDomainData(dataArray);

    // Calculate RMS
    let sumSquares = 0;
    for (let i = 0; i < bufferLength; i++) {
      sumSquares += dataArray[i] * dataArray[i];
    }
    const rms = Math.sqrt(sumSquares / bufferLength);
    const db = rmsToDb(rms);

    setCurrentDb(db);
    setPeakDb((prev) => Math.max(prev, db));

    readingHistoryRef.current.push(db);
    if (readingHistoryRef.current.length > 50) readingHistoryRef.current.shift();
    const avg = readingHistoryRef.current.reduce((a, b) => a + b, 0) / readingHistoryRef.current.length;
    setAverageDb(Math.round(avg * 10) / 10);

    // Downsample waveform for visualizer (64 points)
    const step = Math.floor(bufferLength / 64);
    const wave = [];
    for (let i = 0; i < 64; i++) {
      wave.push(dataArray[i * step] || 0);
    }
    setWaveformData(wave);

    if (onReadingRecorded && Math.random() > 0.85) {
      onReadingRecorded({
        value: db,
        unit: 'dB(A) est.',
        method: 'browser_microphone_uncalibrated',
        timestamp: new Date().toISOString(),
      });
    }

    animationFrameRef.current = requestAnimationFrame(processMicFrame);
  }, [rmsToDb, onReadingRecorded]);

  // Start Live Microphone
  const startMicrophone = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Web Audio API getUserMedia is not supported in this browser.');
      }

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
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.7;
      source.connect(analyser);
      analyserRef.current = analyser;

      setIsMicActive(true);
      setMicPermission('granted');
      setMode('live_microphone');
      setIsMonitoring(true);
      setQuality({
        method: 'browser_microphone_uncalibrated',
        label: 'Live Browser Microphone (Uncalibrated)',
        isCalibrated: false,
        disclaimer:
          'UNVERIFIED ESTIMATE: Captured via standard uncalibrated browser input. Readings do not meet IEC 61672 Class 1/2 legal certification standards.',
      });

      processMicFrame();
    } catch (err) {
      console.warn('Microphone access unavailable or denied. Falling back to simulation mode:', err.message);
      setMicPermission('denied');
      startSimulation();
    }
  };

  // Start Simulation
  const startSimulation = () => {
    stopMicrophone();
    setMode('simulated');
    setIsMonitoring(true);
    setQuality({
      method: 'simulated_demo',
      label: 'Simulated Demo Stream (Synthetic)',
      isCalibrated: false,
      disclaimer: 'SYNTHETIC READINGS: Procedural environmental sound data for testing and demonstration.',
    });
  };

  // Stop Microphone
  const stopMicrophone = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setIsMicActive(false);
  };

  // Toggle general monitoring
  const toggleMonitoring = () => {
    if (isMonitoring) {
      stopMicrophone();
      setIsMonitoring(false);
    } else {
      if (mode === 'live_microphone') {
        startMicrophone();
      } else {
        startSimulation();
      }
    }
  };

  // Run simulation interval when in simulated monitoring mode
  useEffect(() => {
    let interval = null;
    if (isMonitoring && mode === 'simulated') {
      interval = setInterval(runSimulationStep, 250);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMonitoring, mode, runSimulationStep]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMicrophone();
    };
  }, []);

  return {
    isMonitoring,
    isMicActive,
    micPermission,
    currentDb,
    peakDb,
    averageDb,
    mode,
    waveformData,
    measurementQuality,
    startMicrophone,
    startSimulation,
    toggleMonitoring,
    resetPeak: () => setPeakDb(currentDb),
  };
}
