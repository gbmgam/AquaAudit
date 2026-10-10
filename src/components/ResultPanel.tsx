import React from 'react';
import { DetectionSummary } from '../types.ts';
import {
  AlertOctagon,
  CheckCircle2,
  TrendingUp,
  Droplet,
  IndianRupee,
  HelpCircle,
  Clock,
} from 'lucide-react';

interface ResultPanelProps {
  summary: DetectionSummary;
  waterPrice: number;
  onWaterPriceChange: (price: number) => void;
}

export const ResultPanel: React.FC<ResultPanelProps> = ({
  summary,
  waterPrice,
  onWaterPriceChange,
}) => {
  const formatNumber = (num: number | null, decimals: number = 0): string => {
    if (num === null || isNaN(num) || !isFinite(num)) return 'Not enough data';
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals,
    }).format(num);
  };

  const formatCurrency = (num: number | null): string => {
    if (num === null || isNaN(num) || !isFinite(num)) return 'Not enough data';
    return '₹' + new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 transition-all">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm shadow-sm">
          2
        </span>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Detection Result</h2>
          <p className="text-xs text-slate-500">
            Statistical anomaly evaluation based on Day {summary.latestDay || 1} status
          </p>
        </div>
      </div>

      {/* Main Alert Card */}
      {summary.latestDayAlert ? (
        <div className="bg-gradient-to-br from-red-500 to-rose-600 text-white rounded-2xl p-6 shadow-md border border-red-400 mb-6 relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-xs">
                <AlertOctagon className="w-8 h-8 text-white" />
              </div>
              <div>
                <span className="text-xs font-semibold tracking-wider uppercase text-red-100">
                  Anomaly Flagged on Day {summary.latestDay}
                </span>
                <h3 className="text-2xl font-black tracking-tight text-white">
                  Possible leak — confidence: {summary.latestConfidence}
                </h3>
              </div>
            </div>
            <div className="bg-white/15 px-3 py-1.5 rounded-lg border border-white/20 text-xs font-medium backdrop-blur-xs">
              {summary.totalFlaggedDays} total leak nights flagged
            </div>
          </div>
          <p className="mt-3 text-red-100 text-xs max-w-2xl leading-relaxed">
            Overnight flow has consistently breached the statistical baseline (median + 3×MAD) in at least 60% of recent valid observations.
          </p>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-6 shadow-md border border-emerald-500 mb-6 relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-xs">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <span className="text-xs font-semibold tracking-wider uppercase text-emerald-100">
                  Latest Status (Day {summary.latestDay || 1})
                </span>
                <h3 className="text-2xl font-black tracking-tight text-white">
                  No persistent leak pattern found (or still learning)
                </h3>
              </div>
            </div>
            <div className="bg-white/15 px-3 py-1.5 rounded-lg border border-white/20 text-xs font-medium backdrop-blur-xs">
              Baseline Protected
            </div>
          </div>
          <p className="mt-3 text-emerald-100 text-xs max-w-2xl leading-relaxed">
            Missing readings, gradual changes, or small leaks can make detection harder. A green status does not prove that zero water is being lost.
          </p>
        </div>
      )}

      {/* 3 Large Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        {/* Metric 1: Extra Night Flow */}
        <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/70 hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Extra Night Flow
            </span>
            <span className="text-[11px] bg-slate-200/70 px-2 py-0.5 rounded text-slate-600 font-medium">
              Median
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-3xl font-black text-slate-800 tracking-tight">
              {formatNumber(summary.extraNightFlow, 1)}
            </span>
            {summary.extraNightFlow !== null && (
              <span className="text-sm font-semibold text-slate-500">L / hour</span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-normal">
            Calculated over the {summary.usableFlaggedNightsCount > 0 ? summary.usableFlaggedNightsCount : 'recent'} most recent flagged nights.
          </p>
        </div>

        {/* Metric 2: Estimated Daily Loss */}
        <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/70 hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Droplet className="w-4 h-4 text-cyan-600" />
              Estimated Loss
            </span>
            <span className="text-[11px] bg-slate-200/70 px-2 py-0.5 rounded text-slate-600 font-medium">
              24h Run
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-3xl font-black text-slate-800 tracking-tight">
              {formatNumber(summary.estimatedLitresPerDay, 0)}
            </span>
            {summary.estimatedLitresPerDay !== null && (
              <span className="text-sm font-semibold text-slate-500">Litres / day</span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-normal">
            Estimated continuous 24-hour volume lost if leak persists uninterrupted.
          </p>
        </div>

        {/* Metric 3: Estimated Monthly Cost */}
        <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/70 hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <IndianRupee className="w-4 h-4 text-emerald-600" />
              Estimated Monthly Cost
            </span>
            <span className="text-[11px] bg-slate-200/70 px-2 py-0.5 rounded text-slate-600 font-medium">
              30 Days
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-3xl font-black text-slate-800 tracking-tight">
              {formatCurrency(summary.estimatedMonthlyCost)}
            </span>
            {summary.estimatedMonthlyCost !== null && (
              <span className="text-xs font-semibold text-slate-500">/ month</span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-normal">
            Calculated at ₹{waterPrice} per 1,000 litres over 30 days.
          </p>
        </div>
      </div>

      {/* Assumptions and Water Price Setting */}
      <div className="bg-blue-50/60 rounded-xl p-4 border border-blue-100 flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 min-w-[260px]">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
            <HelpCircle className="w-4 h-4 text-blue-500" />
            <span>Scope & Physical Caveats</span>
          </div>
          <p className="text-xs text-slate-600 font-medium">
            Assumes the leak runs 24h/day. Shows THAT water is escaping, not exactly WHERE.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-700 whitespace-nowrap">
            Water price (assumption - set your local cost):
          </label>
          <div className="relative w-28">
            <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-500">₹</span>
            <input
              type="number"
              min="0"
              max="500"
              step="1"
              value={waterPrice}
              onChange={e => onWaterPriceChange(Math.max(0, Number(e.target.value) || 0))}
              className="w-full bg-white border border-slate-300 rounded-lg pl-6 pr-2 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
            />
          </div>
          <span className="text-[11px] text-slate-500">/ 1,000 L</span>
        </div>
      </div>
    </div>
  );
};
