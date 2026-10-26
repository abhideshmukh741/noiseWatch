/**
 * Page A: Landing Page
 * Strict 3-Color Design System: Slate (#0f172a), Emerald (#059669), Amber (#d97706)
 * Features high-resolution environmental photography, interactive sound animations,
 * card hover effects, and complete provenance transparency.
 */

import { Link } from 'react-router-dom';
import WaveformVisualizer from '../components/WaveformVisualizer';

export default function LandingPage() {
  const demoWave = new Array(64).fill(0).map((_, i) => Math.sin(i * 0.2) * 0.35 + Math.cos(i * 0.4) * 0.15);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a]">
      
      {/* ── Hero Section with Environmental Photography & Sound Animation ── */}
      <section className="pt-12 pb-16 md:pt-20 md:pb-20 px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Left Content (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Curvy Pill Tag */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-[#047857] bg-[#ecfdf5] border border-[#a7f3d0] shadow-xs">
              <span className="status-dot status-dot--active" />
              <span>Continuous Environmental Acoustic Screening Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[#0f172a] leading-[1.12]">
              A Quieter World Starts With <span className="text-[#059669]">Listening.</span>
            </h1>

            <p className="text-base sm:text-lg text-[#475569] leading-relaxed max-w-2xl font-normal">
              NoiseWatch automates environmental sound monitoring, mathematical threshold exceedance detection, 
              and evidence-based complaint documentation with verified sensor calibration provenance.
            </p>

            {/* Curvy Pill CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <Link to="/dashboard" className="btn btn-primary w-full sm:w-auto text-sm px-8 py-3.5 font-bold rounded-full">
                Open Live Dashboard
              </Link>
              <a href="#how-it-works" className="btn btn-secondary w-full sm:w-auto text-sm px-8 py-3.5 font-semibold rounded-full">
                Explore How It Works
              </a>
            </div>

            {/* Realtime Equalizer Stats Banner */}
            <div className="pt-6 flex flex-wrap items-center gap-6 border-t border-[#e2e8f0] text-xs font-mono">
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#ecfdf5] border border-[#a7f3d0]">
                <div className="eq-container">
                  <span className="eq-bar" />
                  <span className="eq-bar" />
                  <span className="eq-bar" />
                  <span className="eq-bar" />
                </div>
                <span className="text-[#059669] font-bold text-[11px]">REALTIME ENGINE</span>
              </div>
              <div className="text-[#475569] px-3 py-1.5 rounded-full bg-[#f1f5f9]">
                NETWORK: <span className="text-[#0f172a] font-bold">5 SITES ACTIVE</span>
              </div>
              <div className="text-[#475569] px-3 py-1.5 rounded-full bg-[#f1f5f9]">
                COMPLIANCE: <span className="text-[#059669] font-bold">88.6%</span>
              </div>
            </div>
          </div>

          {/* Hero Right: Live Acoustic Station Showcase (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="glass-card p-4 rounded-3xl relative group shadow-lg border border-[#e2e8f0]">
              
              {/* Curvy Environmental Monitoring Station Photography */}
              <div className="img-zoom-container relative h-72 sm:h-80 w-full rounded-2xl overflow-hidden">
                <img 
                  src="/assets/images/acoustic_station.jpg" 
                  alt="IoT Acoustic Monitoring Station in City Park"
                  className="w-full h-full object-cover rounded-2xl"
                />
                
                {/* Floating Telemetry Badge Overlay */}
                <div className="absolute top-3 left-3 bg-white border border-[#cbd5e1] rounded-full px-4 py-1.5 shadow-md flex items-center gap-2.5 text-xs">
                  <span className="status-dot status-dot--active" />
                  <span className="font-mono font-bold text-[#0f172a]">54.3 dB(A)</span>
                  <span className="text-[10px] text-[#475569] font-semibold uppercase">Park Station #01</span>
                </div>

                <div className="absolute bottom-3 right-3">
                  <span className="badge-amber font-mono font-bold text-[10px] shadow-sm">
                    Continuous Screening
                  </span>
                </div>
              </div>

              {/* Time-Domain Waveform Preview Strip */}
              <div className="p-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl mt-4">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-mono text-[11px] font-bold text-[#475569]">TIME-DOMAIN SAMPLES</span>
                  <span className="font-mono text-[11px] font-bold text-[#059669]">48.5 dB(A) • RESIDENTIAL</span>
                </div>
                <WaveformVisualizer waveformData={demoWave} isActive={true} height={60} />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Curvy Acoustic Wave Transition ─────────────────────────── */}
      <div className="w-full overflow-hidden leading-none rotate-180">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-10 text-white fill-current">
          <path d="M0,0 C150,90 350,-40 500,60 C650,160 900,10 1200,40 L1200,120 L0,120 Z"></path>
        </svg>
      </div>

      {/* ── Transparency Notice Banner ────────────────────────────── */}
      <section className="bg-white py-10 px-4 sm:px-6">
        <div className="max-w-[1200px] mx-auto glass-card p-6 sm:p-8 rounded-3xl border border-[#e2e8f0] bg-gradient-to-r from-white to-[#f8fafc] shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="badge-amber">
                Notice
              </span>
              <h2 className="text-base sm:text-lg font-bold text-[#0f172a]">
                Scientific & Legal Transparency Commitment
              </h2>
              <p className="text-xs sm:text-sm text-[#475569] max-w-3xl leading-relaxed">
                NoiseWatch distinguishes between uncalibrated browser microphone estimates, certified Class 1/2 sound level meters,
                and AI-assisted classifications. Exceeding a threshold indicates a potential incident and does not automatically declare a legal violation without formal operator review.
              </p>
            </div>
            <Link to="/reports" className="btn btn-secondary btn-sm whitespace-nowrap text-xs shrink-0 font-semibold rounded-full px-5 py-2.5">
              Review Methodology
            </Link>
          </div>
        </div>
      </section>

      {/* ── Curvy Acoustic Wave Transition ─────────────────────────── */}
      <div className="w-full overflow-hidden leading-none">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-10 text-white fill-current">
          <path d="M0,0 C150,90 350,-40 500,60 C650,160 900,10 1200,40 L1200,120 L0,120 Z"></path>
        </svg>
      </div>

      {/* ── Subsystems Grid (Strict 3 Colors with Curvy Pods) ─────── */}
      <section id="how-it-works" className="py-16 px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold text-[#059669] bg-[#ecfdf5] border border-[#a7f3d0] mb-3">
            Core Architecture
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0f172a]">
            Engineered for Precision Environmental Stewardship
          </h2>
          <p className="text-xs sm:text-sm text-[#475569] mt-2">
            Four interconnected subsystems designed to transform acoustic noise data into verifiable compliance records.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Subsystem 1 */}
          <div className="glass-card p-7 rounded-3xl flex flex-col justify-between hover:shadow-xl transition-all duration-300">
            <div>
              <div className="inline-flex items-center px-3.5 py-1 rounded-full text-[11px] font-mono font-bold text-[#059669] bg-[#ecfdf5] border border-[#a7f3d0] mb-3.5">
                01 / CAPTURE
              </div>
              <h3 className="text-base font-bold text-[#0f172a] mb-2">
                Continuous Monitoring
              </h3>
              <p className="text-xs text-[#475569] leading-relaxed">
                Ingests real-time sound streams from browser microphones, IoT sensors, or calibrated hardware with complete measurement metadata and freshness tracking.
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-[#e2e8f0] flex items-center justify-between">
              <span className="text-[11px] text-[#059669] font-bold font-mono">Web Audio & IoT</span>
              <span className="w-2 h-2 rounded-full bg-[#059669]" />
            </div>
          </div>

          {/* Subsystem 2 */}
          <div className="glass-card p-7 rounded-3xl flex flex-col justify-between hover:shadow-xl transition-all duration-300">
            <div>
              <div className="inline-flex items-center px-3.5 py-1 rounded-full text-[11px] font-mono font-bold text-[#059669] bg-[#ecfdf5] border border-[#a7f3d0] mb-3.5">
                02 / ANALYSIS
              </div>
              <h3 className="text-base font-bold text-[#0f172a] mb-2">
                Sound Classification
              </h3>
              <p className="text-xs text-[#475569] leading-relaxed">
                Extracts spectral centroid, rolloff, zero-crossing rate, and energy bands to classify sound events (construction, traffic, alarms) with documented confidence scores.
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-[#e2e8f0] flex items-center justify-between">
              <span className="text-[11px] text-[#059669] font-bold font-mono">Spectral Features</span>
              <span className="w-2 h-2 rounded-full bg-[#059669]" />
            </div>
          </div>

          {/* Subsystem 3 */}
          <div className="glass-card p-7 rounded-3xl flex flex-col justify-between hover:shadow-xl transition-all duration-300">
            <div>
              <div className="inline-flex items-center px-3.5 py-1 rounded-full text-[11px] font-mono font-bold text-[#b45309] bg-[#fef3c7] border border-[#fde68a] mb-3.5">
                03 / RULES
              </div>
              <h3 className="text-base font-bold text-[#0f172a] mb-2">
                Threshold Rule Engine
              </h3>
              <p className="text-xs text-[#475569] leading-relaxed">
                Evaluates zone categories (Residential, Commercial, Industrial, Silent) against day and night statutory decibel limits with persistence and cooldown logic.
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-[#e2e8f0] flex items-center justify-between">
              <span className="text-[11px] text-[#d97706] font-bold font-mono">Zone Policies</span>
              <span className="w-2 h-2 rounded-full bg-[#d97706]" />
            </div>
          </div>

          {/* Subsystem 4 */}
          <div className="glass-card p-7 rounded-3xl flex flex-col justify-between hover:shadow-xl transition-all duration-300">
            <div>
              <div className="inline-flex items-center px-3.5 py-1 rounded-full text-[11px] font-mono font-bold text-[#334155] bg-[#f1f5f9] border border-[#e2e8f0] mb-3.5">
                04 / EVIDENCE
              </div>
              <h3 className="text-base font-bold text-[#0f172a] mb-2">
                Evidence-Based Reports
              </h3>
              <p className="text-xs text-[#475569] leading-relaxed">
                Generates formal publication-grade PDF incident dossiers with cryptographic checksums, regulatory citations, reviewer notes, and complaint dispatch channels.
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-[#e2e8f0] flex items-center justify-between">
              <span className="text-[11px] text-[#0f172a] font-bold font-mono">ReportLab PDF</span>
              <span className="w-2 h-2 rounded-full bg-[#0f172a]" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Laboratory & Acoustic Measurement Standards ─────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white border-t border-[#e2e8f0]">
        <div className="max-w-[1440px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Lab Image (5 Cols) */}
            <div className="lg:col-span-5">
              <div className="glass-card p-4 rounded-3xl shadow-lg border border-[#e2e8f0]">
                <div className="img-zoom-container rounded-2xl h-80 w-full relative overflow-hidden">
                  <img 
                    src="/assets/images/acoustic_lab.jpg" 
                    alt="Precision Sound Level Meter Calibration in Acoustic Laboratory"
                    className="w-full h-full object-cover rounded-2xl"
                  />
                  <div className="absolute bottom-3 left-3 bg-white border border-[#cbd5e1] rounded-full px-4 py-1.5 text-[11px] font-mono font-bold text-[#0f172a] shadow-sm">
                    Class 1 Reference: ±0.7 dB
                  </div>
                </div>
              </div>
            </div>

            {/* Measurement Hierarchy Content (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <span className="badge-emerald mb-2">Scientific Governance</span>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#0f172a] tracking-tight mt-1">
                  Measurement Hierarchy & Data Integrity
                </h2>
                <p className="text-xs sm:text-sm text-[#475569] mt-2 leading-relaxed">
                  Every data point processed by NoiseWatch carries its complete provenance and validation status, ensuring zero ambiguity in regulatory and community contexts.
                </p>
              </div>

              <div className="space-y-3.5">
                {/* Level 1 */}
                <div className="curvy-pod p-5 rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-[#059669] hover:bg-white transition-all shadow-xs hover:shadow-md">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#059669]" />
                      <span className="font-bold text-xs sm:text-sm text-[#0f172a]">Class 1 & Class 2 Calibrated Meters</span>
                      <span className="badge-emerald text-[9px]">Legal Grade</span>
                    </div>
                    <p className="text-xs text-[#475569] mt-1.5">
                      IEC 61672 compliant sound meters with active calibration certificates. Valid for formal regulatory citations and legal evidence.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#059669] whitespace-nowrap bg-[#ecfdf5] px-3 py-1 rounded-full border border-[#a7f3d0]">
                    ±0.7 dB
                  </span>
                </div>

                {/* Level 2 */}
                <div className="curvy-pod p-5 rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-[#059669] hover:bg-white transition-all shadow-xs hover:shadow-md">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#059669]" />
                      <span className="font-bold text-xs sm:text-sm text-[#0f172a]">Calibrated IoT Sensor Nodes</span>
                      <span className="badge-slate text-[9px]">Screening Grade</span>
                    </div>
                    <p className="text-xs text-[#475569] mt-1.5">
                      Continuously powered outdoor microphone stations calibrated against acoustic standards for municipal trend monitoring.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#475569] whitespace-nowrap bg-[#f1f5f9] px-3 py-1 rounded-full border border-[#e2e8f0]">
                    ±2.0 dB
                  </span>
                </div>

                {/* Level 3 */}
                <div className="curvy-pod p-5 rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-[#d97706] hover:bg-white transition-all shadow-xs hover:shadow-md">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#d97706]" />
                      <span className="font-bold text-xs sm:text-sm text-[#0f172a]">Browser Microphone Capture</span>
                      <span className="badge-amber text-[9px]">Unverified Estimate</span>
                    </div>
                    <p className="text-xs text-[#475569] mt-1.5">
                      Consumer device microphones processed via Web Audio API. Labeled strictly as estimated relative sound intensity for personal awareness.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#b45309] whitespace-nowrap bg-[#fef3c7] px-3 py-1 rounded-full border border-[#fde68a]">
                    Screening Only
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Call to Action (Curvy Pod) ────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto glass-card p-10 sm:p-14 rounded-3xl text-center border border-[#e2e8f0] shadow-md bg-gradient-to-b from-white to-[#f8fafc]">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold text-[#059669] bg-[#ecfdf5] border border-[#a7f3d0] mb-4">
            Get Started
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold text-[#0f172a] mb-3">
            Ready to Monitor Your Acoustic Environment?
          </h2>
          <p className="text-xs sm:text-base text-[#475569] mb-8 max-w-2xl mx-auto leading-relaxed">
            Access real-time decibel screening, live interactive simulations, incident dossiers, and automated PDF compliance reports.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/dashboard" className="btn btn-primary px-8 py-3.5 font-bold text-sm rounded-full w-full sm:w-auto shadow-md">
              Launch Monitoring Dashboard
            </Link>
            <Link to="/map" className="btn btn-secondary px-8 py-3.5 font-semibold text-sm rounded-full w-full sm:w-auto">
              View Sensor Map
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="border-t border-[#e2e8f0] bg-white py-10 px-4 text-xs text-[#475569]">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-[#0f172a] text-sm">NoiseWatch</span>
            <span>— Environmental Noise Monitoring & Compliance Platform</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="badge-emerald text-[10px]">Demo Mode Active</span>
            <span className="text-[#64748b]"> • Strictly 3-Color Harmonious Palette</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
