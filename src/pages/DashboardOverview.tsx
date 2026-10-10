import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { DetectionSummary, NavigationTab, ValidationResult } from '../types.ts';
import {
  TrendingUp,
  Droplet,
  IndianRupee,
  Activity,
  AlertOctagon,
  CheckCircle2,
  ArrowRight,
  Database,
  ClipboardList,
  FileText,
  Sliders,
  Upload,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

interface DashboardOverviewProps {
  summary: DetectionSummary;
  validationResult: ValidationResult | null;
  dataSource: 'demo' | 'csv';
  waterPrice: number;
  onNavigateTab: (tab: NavigationTab) => void;
  savedReportsCount: number;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  summary,
  validationResult,
  dataSource,
  waterPrice,
  onNavigateTab,
  savedReportsCount,
}) => {
  const { user } = useAuth();

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

  const validObservationsCount = summary.days.filter(d => d.nightFlow !== null).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Welcome Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs relative overflow-hidden">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Hostel Water Management System</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Good day, {user?.name || 'Building Manager'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Active facility: <strong className="text-slate-800">{user?.buildingName || 'Hostel Campus'}</strong>
            </p>
          </div>

          {/* Status Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <div
              className={`px-3.5 py-2 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
                dataSource === 'demo'
                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                  : 'bg-blue-50 text-blue-900 border-blue-200'
              }`}
            >
              {dataSource === 'demo' ? (
                <>
                  <Sliders className="w-4 h-4 text-amber-600" />
                  <span>Demo Simulator</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span>Real CSV Data</span>
                </>
              )}
            </div>

            <div
              className={`px-3.5 py-2 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
                summary.latestDayAlert
                  ? 'bg-red-50 text-red-800 border-red-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}
            >
              {summary.latestDayAlert ? (
                <>
                  <AlertOctagon className="w-4 h-4 text-red-600" />
                  <span>Suspected Anomaly ({summary.latestConfidence} Conf.)</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Baseline Normal</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Latest Detection Status */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Leak Status</span>
              {summary.latestDayAlert ? (
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
              ) : (
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              )}
            </div>
            <div className="text-xl font-black tracking-tight text-slate-800 mt-1">
              {summary.latestDayAlert ? 'Suspected Loss' : 'No Persistent Leak'}
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-100">
            Based on Day {summary.latestDay || 1} rolling statistical evaluation
          </p>
        </div>

        {/* Metric 2: Estimated Daily Water Loss */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Est. Daily Loss</span>
              <Droplet className="w-4 h-4 text-cyan-600" />
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black tracking-tight text-slate-900">
                {formatNumber(summary.estimatedLitresPerDay, 0)}
              </span>
              {summary.estimatedLitresPerDay !== null && (
                <span className="text-xs font-bold text-slate-500">L / day</span>
              )}
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-100">
            {summary.extraNightFlow !== null
              ? `Extra flow: ~${summary.extraNightFlow.toFixed(1)} L/hour`
              : 'Requires active persistent alert'}
          </p>
        </div>

        {/* Metric 3: Estimated Monthly Cost */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Est. Monthly Cost</span>
              <IndianRupee className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black tracking-tight text-slate-900">
                {formatCurrency(summary.estimatedMonthlyCost)}
              </span>
              {summary.estimatedMonthlyCost !== null && (
                <span className="text-xs font-bold text-slate-500">/ mo</span>
              )}
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-100">
            Calculated at ₹{waterPrice} per 1,000 litres
          </p>
        </div>

        {/* Metric 4: Valid Observations */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Valid Night Flows</span>
              <Activity className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black tracking-tight text-slate-900">
                {validObservationsCount}
              </span>
              <span className="text-xs font-bold text-slate-500">nights logged</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-100">
            {validationResult?.missingReadingsCount || 0} missing guard readings
          </p>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-4">Quick Operations</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Action 1 */}
          <button
            type="button"
            onClick={() => onNavigateTab('data')}
            className="p-4 rounded-2xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 text-left transition-all group flex items-start gap-3.5"
          >
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Database className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm text-slate-900 group-hover:text-blue-700 flex items-center justify-between">
                <span>Manage Water Data</span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Adjust synthetic hostel simulator sliders or upload daily guard CSV logs.
              </p>
            </div>
          </button>

          {/* Action 2 */}
          <button
            type="button"
            onClick={() => onNavigateTab('results')}
            className="p-4 rounded-2xl border border-slate-200 hover:border-cyan-300 hover:bg-cyan-50/40 text-left transition-all group flex items-start gap-3.5"
          >
            <div className="p-3 bg-cyan-50 text-cyan-600 rounded-xl group-hover:bg-cyan-600 group-hover:text-white transition-colors">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm text-slate-900 group-hover:text-cyan-700 flex items-center justify-between">
                <span>View Detection Charts</span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Inspect 60-day flow timelines, MAD baseline bounds, and flagged nights.
              </p>
            </div>
          </button>

          {/* Action 3 */}
          <button
            type="button"
            onClick={() => onNavigateTab('tickets')}
            className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 text-left transition-all group flex items-start gap-3.5"
          >
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 flex items-center justify-between">
                <span>Inspection Tickets</span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Generate the ordered 4-step checklist for plumbing crews and save reports.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Reports Summary Banner */}
      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white text-slate-700 rounded-xl border border-slate-200">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">Inspection Reports History</h4>
            <p className="text-xs text-slate-500">
              {savedReportsCount > 0
                ? `${savedReportsCount} inspection reports saved for this property.`
                : 'No inspection reports saved yet. Generate one from the Inspection Ticket tab.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('reports')}
          className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition-colors shadow-2xs"
        >
          Open Reports Archive ({savedReportsCount})
        </button>
      </div>
    </div>
  );
};
