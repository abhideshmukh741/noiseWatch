/**
 * Reusable stat card for metrics
 * Strict 3-Color Design System: Slate (#0f172a), Emerald (#059669), Amber (#d97706)
 * Icon-free, clean typography with interactive hover lift effect.
 */

export default function StatCard({ title, value, unit, trend, trendLabel, accent = false, badge }) {
  return (
    <div className={`stat-card-delight group p-6 rounded-3xl relative ${accent ? 'border-t-4 border-t-[#00a88f]' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-bold text-[#475569] group-hover:text-[#1e2430] uppercase tracking-wider transition-colors duration-200">
          {title}
        </span>
        {badge && (
          <span className="badge-amber group-hover:scale-105 group-hover:shadow-xs transition-transform duration-200">
            {badge}
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] group-hover:text-[#00a88f] group-hover:scale-105 font-mono tracking-tight transition-all duration-200 origin-left">
          {value}
        </span>
        {unit && (
          <span className="text-xs font-semibold text-[#475569] group-hover:text-[#1e2430] transition-colors duration-200">
            {unit}
          </span>
        )}
      </div>

      {trend !== undefined && (
        <div className="mt-3 pt-2.5 border-t border-[#e2e8f0] flex items-center gap-1.5 text-xs font-medium">
          <span className={`font-bold font-mono group-hover:scale-110 transition-transform origin-left duration-200 ${
            trend > 0 ? 'text-[#ff5757]' : trend < 0 ? 'text-[#00a88f]' : 'text-[#475569]'
          }`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
          {trendLabel && (
            <span className="text-[#475569] group-hover:text-[#1e2430] text-[11px] font-medium transition-colors duration-200">
              {trendLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
