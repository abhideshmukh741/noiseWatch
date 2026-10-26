/**
 * WaveformVisualizer Component (Clean light theme).
 */

import { useRef, useEffect } from 'react';

export default function WaveformVisualizer({ waveformData = [], isActive = true, height = 120 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, width, h);

    // Subtle light grid line
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(width, h / 2);
    ctx.stroke();

    if (!isActive || waveformData.length === 0) {
      // Quiet baseline
      ctx.strokeStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(width, h / 2);
      ctx.stroke();
      return;
    }

    const sliceWidth = width / (waveformData.length - 1);

    // Clean emerald line
    const grad = ctx.createLinearGradient(0, 0, width, 0);
    grad.addColorStop(0, '#047857');
    grad.addColorStop(0.5, '#059669');
    grad.addColorStop(1, '#10b981');

    ctx.strokeStyle = grad;
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let i = 0; i < waveformData.length; i++) {
      const v = waveformData[i];
      const y = (h / 2) + v * (h * 0.42);
      const x = i * sliceWidth;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        const prevX = (i - 1) * sliceWidth;
        const prevY = (h / 2) + waveformData[i - 1] * (h * 0.42);
        const cpX = (prevX + x) / 2;
        ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y);
      }
    }
    ctx.stroke();
  }, [waveformData, isActive]);

  return (
    <div className="relative w-full rounded-md overflow-hidden bg-[#f8fafc] border border-[#e2e8f0] p-2">
      <canvas
        ref={canvasRef}
        width={600}
        height={height}
        className="w-full h-full block"
      />
      <div className="absolute top-2 right-3 flex items-center gap-1.5 text-[10px] text-[#64748b] font-mono">
        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-[#059669]' : 'bg-[#94a3b8]'}`} />
        {isActive ? 'SIGNAL ACQUIRED' : 'STANDBY'}
      </div>
    </div>
  );
}
