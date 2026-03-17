import React from "react";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

export default function MetricCard({
  title,
  value,
  unit,
  trend,
  icon = <Activity className="w-4 h-4 text-slate-400" />,
}) {
  const isPositive = trend && trend > 0;

  return (
    <div className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/10 hover:bg-white/[0.04] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] sm:min-w-[240px]">
      {/* Subtle background glow effect on hover */}
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-white/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Header: Icon & Title */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium uppercase tracking-wider text-slate-400">
          {title}
        </h3>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10 transition-colors group-hover:bg-white/10">
          {icon}
        </div>
      </div>

      {/* Main Metric & Trend */}
      <div className="flex items-end justify-between">
        <div className="flex items-baseline gap-1">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-50">
            {value}
          </h2>
          {unit && (
            <span className="text-sm font-medium text-emerald-400">{unit}</span>
          )}
        </div>

        {/* Trend Indicator */}
        {trend !== undefined && (
          <div
            className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
              isPositive
                ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
                : "bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20"
            }`}
          >
            {isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
