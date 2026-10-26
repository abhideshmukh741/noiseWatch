/**
 * Reusable stat card for metrics
 * Strict 3-Color Design System: Slate (#0f172a), Emerald (#059669), Amber (#d97706)
 * Icon-free, clean typography with interactive hover lift effect.
 */

export default function StatCard({ title, value, unit, trend, trendLabel, accent = false, badge }) {
  return (
    <div className={`glass-card p-6 rounded-3xl relative ${accent ? 'border-t-4 border-t-[#059669]' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-bold text-[#475569] uppercase tracking-wider">
          {title}
        </span>
        {badge && <span className="demo-badge">{badge}</span>}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-bold text-[#0f172a] font-mono tracking-tight">
          {value}
        </span>
        {unit && (
          <span className="text-xs font-semibold text-[#475569]">{unit}</span>
        )}
      </div>

      {trend !== undefined && (
        <div className="mt-3 pt-2.5 border-t border-[#e2e8f0] flex items-center gap-1.5 text-xs font-medium">
          <span className={`font-bold font-mono ${
            trend > 0 ? 'text-[#d97706]' : trend < 0 ? 'text-[#059669]' : 'text-[#475569]'
          }`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
          {trendLabel && (
            <span className="text-[#475569] text-[11px] font-medium">{trendLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
