# NoiseWatch Improvement Roadmap (GSD Incremental Plan)

## Milestone 1: UX/UI Polish, Design System Consistency & Accessibility

### Phase 1: Typography, Meta, and Brand Identity Polish [COMPLETED]
- [x] Configure Google Fonts (`Outfit`, `Inter`, `JetBrains Mono`) in `index.html`.
- [x] Replace default Vite `<title>` with descriptive metadata, favicon, and SEO description.
- [x] Enforce modular font sizing with fluid clamps and contrast compliant with WCAG 2.1 AA.

### Phase 2: Design Token & Anti-Pattern Normalization [IN PROGRESS]
- [ ] Audit and remove "AI Slop" tells (generic gray text, nested cards, inconsistent padding).
- [ ] Ensure all buttons have explicit focus rings, hover, active, and disabled states.
- [ ] Add subtle micro-animations for status badges, live signal pulses, and chart transitions.

### Phase 3: Dashboard & Telemetry Visual Hierarchy
- [ ] Refine the live sound gauge with responsive scaling and high-contrast color steps.
- [ ] Improve audio visualizer canvas sizing and add signal-to-noise ratio indicator.
- [ ] Add empty states and loading skeleton animations for data fetch latency.

### Phase 4: Map & Location Inspection Polish
- [ ] Enhance Leaflet map tiles with optimized contrast filter for dark mode.
- [ ] Add smooth zoom transitions and keyboard navigable marker pins with ARIA labels.
- [ ] Improve mobile drawer behavior for location inspection panel.

### Phase 5: Error Resilience & Testing Verification
- [ ] Implement a React Error Boundary component with friendly fallback.
- [ ] Verify responsive layout across Mobile (375px), Tablet (768px), and Desktop (1440px).
- [ ] Re-run build and integration tests to confirm zero regressions.
