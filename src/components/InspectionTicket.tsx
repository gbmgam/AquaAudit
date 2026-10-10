import React, { useState } from 'react';
import { DetectionSummary } from '../types.ts';
import { ReportService } from '../lib/reports.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  ClipboardCheck,
  Printer,
  AlertTriangle,
  CheckSquare,
  Square,
  ShieldAlert,
  Building,
  Calendar,
  IndianRupee,
  Droplet,
  Save,
  CheckCircle2,
} from 'lucide-react';

interface InspectionTicketProps {
  summary: DetectionSummary;
  waterPrice: number;
  buildingName?: string;
  dataSource?: 'simulated' | 'uploaded';
  onReportSaved?: () => void;
}

export const InspectionTicket: React.FC<InspectionTicketProps> = ({
  summary,
  waterPrice,
  buildingName,
  dataSource = 'simulated',
  onReportSaved,
}) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({
    1: false,
    2: false,
    3: false,
    4: false,
  });

  const toggleCheck = (idx: number) => {
    setCheckedItems(prev => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const handleSaveReport = () => {
    if (!summary.latestDayAlert) return;
    ReportService.saveReport({
      userId: user?.id || 'demo_user',
      buildingName: buildingName || user?.buildingName || 'Hostel Campus',
      detectionDay: summary.latestDay,
      alertStatus: 'alert',
      alertConfidence: summary.latestConfidence,
      extraNightFlow: summary.extraNightFlow,
      estimatedLitresPerDay: summary.estimatedLitresPerDay,
      estimatedMonthlyCost: summary.estimatedMonthlyCost,
      checklistStatus: {
        tankOverflowChecked: !!checkedItems[1],
        cisternDyeChecked: !!checkedItems[2],
        wingValveChecked: !!checkedItems[3],
        pumpMainLineChecked: !!checkedItems[4],
      },
      dataSource,
      notes: 'Inspection report generated from persistent alert on dashboard.',
    });
    setSaveStatus('Report saved to archive!');
    setTimeout(() => setSaveStatus(null), 3500);
    if (onReportSaved) {
      onReportSaved();
    }
  };

  const [printStatus, setPrintStatus] = useState<string | null>(null);

  const generateTicketText = () => {
    return `================================================
AQUAAUDIT WATER LOSS INSPECTION TICKET
================================================
Alert Day: Day ${summary.latestDay}
Confidence: ${summary.latestConfidence}
Estimated Loss: ${summary.estimatedLitresPerDay !== null ? Math.round(summary.estimatedLitresPerDay).toLocaleString() + ' L/day' : 'N/A'}
Estimated Monthly Cost: ${summary.estimatedMonthlyCost !== null ? '₹' + Math.round(summary.estimatedMonthlyCost).toLocaleString() : 'N/A'}
Water Price Assumption: ₹${waterPrice} / 1,000 L

IMPORTANT NOTICE:
This ticket records a suspected water loss based on statistical night-flow anomalies, not a confirmed leak.
The detector identifies unusual overnight consumption patterns; it does not establish the physical cause or exact location.

MANDATORY PHYSICAL INSPECTION PROTOCOL (FOLLOW IN ORDER):
[${checkedItems[1] ? 'X' : ' '}] 1. Check overhead tank overflow
    Inspect the rooftop float ball valve, overflow discharge pipe, and level sensors during pump cycles.
[${checkedItems[2] ? 'X' : ' '}] 2. Toilet cistern dye test
    Add non-toxic food coloring or dye tablets to toilet flush tanks without flushing. Check after 20 minutes if dye enters the toilet bowl.
[${checkedItems[3] ? 'X' : ' '}] 3. Close one wing's valve and re-check night flow
    Isolate one building wing or floor manifold overnight to identify which zone causes the abnormal flow drop.
[${checkedItems[4] ? 'X' : ' '}] 4. Check pump and main line
    Examine ground delivery lines, booster pump seals, non-return valves (NRVs), and underground sump headers for seepage.

Inspected By: ___________________________
Date of Action: ___________________________
================================================`;
  };

  const handlePrint = () => {
    let printModalOpened = false;
    try {
      if (typeof window !== 'undefined' && window.print) {
        window.print();
        printModalOpened = true;
      }
    } catch (e) {
      console.warn('Browser print dialog unavailable or restricted in iframe:', e);
      printModalOpened = false;
    }

    // In iframe or sandboxed environments, window.print may be blocked or ignored.
    // Export/download the text ticket and copy to clipboard as guaranteed fallback.
    const ticketText = generateTicketText();
    try {
      const blob = new Blob([ticketText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `AquaAudit_Inspection_Day_${summary.latestDay}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(ticketText).catch(() => {});
      }

      setPrintStatus('Ticket downloaded & copied to clipboard!');
      setTimeout(() => setPrintStatus(null), 4000);
    } catch {
      if (printModalOpened) {
        setPrintStatus('Print dialog opened');
      } else {
        setPrintStatus('Action completed');
      }
      setTimeout(() => setPrintStatus(null), 3000);
    }
  };

  // If no alert is present on latest day
  if (!summary.latestDayAlert) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 transition-all">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold text-sm">
            3
          </span>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Inspection Ticket</h2>
            <p className="text-xs text-slate-500">Actionable maintenance protocol</p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-6 text-center border border-slate-200/60 max-w-xl mx-auto">
          <ClipboardCheck className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-700">Inspection Ticket Locked</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            An inspection ticket can only be generated when a persistent water loss anomaly is flagged on the latest recorded day.
            Currently, no persistent leak pattern has been detected.
          </p>
          <button
            type="button"
            disabled
            className="mt-4 px-4 py-2 bg-slate-200 text-slate-400 font-medium text-xs rounded-lg cursor-not-allowed inline-flex items-center gap-1.5"
          >
            <ClipboardCheck className="w-4 h-4" />
            Create inspection ticket
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 transition-all">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm shadow-sm">
            3
          </span>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Inspection Ticket</h2>
            <p className="text-xs text-slate-500">
              Generate actionable maintenance ticket for ground inspection
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-all"
        >
          <ClipboardCheck className="w-4 h-4" />
          {isOpen ? 'Close Inspection Ticket' : 'Create inspection ticket'}
        </button>
      </div>

      {isOpen && (
        <div
          id="printable-inspection-ticket"
          className="bg-white border-2 border-slate-300 rounded-2xl p-6 md:p-8 shadow-md relative print:border-none print:shadow-none print:p-0"
        >
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-slate-900 pb-5 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 rounded-md font-bold text-xs uppercase tracking-wider mb-2">
                <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                Physical Investigation Required
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                AquaAudit Water Loss Inspection
              </h3>
              <p className="text-xs text-slate-600 mt-1 flex items-center gap-2">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                Facility Management & Plumbing Maintenance Ticket
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 print:hidden">
              <button
                type="button"
                onClick={handleSaveReport}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-lg border border-emerald-700 shadow-sm transition-all cursor-pointer"
                title="Archive this inspection report to local database"
              >
                <Save className="w-4 h-4 text-white" />
                <span>Save to Reports</span>
              </button>

              <div className="flex flex-col items-end gap-1.5">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-lg border border-blue-700 shadow-sm transition-all cursor-pointer"
                  title="Print or download this inspection ticket"
                >
                  <Printer className="w-4 h-4 text-white" />
                  <span>{printStatus ? 'Saved & Copied!' : 'Print Ticket'}</span>
                </button>
              </div>

              {(saveStatus || printStatus) && (
                <div className="w-full text-right">
                  <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shadow-xs inline-block">
                    {saveStatus || printStatus}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Ticket Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 mb-6">
            <div>
              <span className="text-[11px] font-bold uppercase text-slate-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Alert Day
              </span>
              <span className="text-sm font-extrabold text-slate-800 mt-0.5 block">
                Day {summary.latestDay}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase text-slate-500">
                Confidence
              </span>
              <span className="text-sm font-extrabold text-red-600 mt-0.5 block">
                {summary.latestConfidence}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase text-slate-500 flex items-center gap-1">
                <Droplet className="w-3 h-3 text-cyan-600" />
                Estimated Loss
              </span>
              <span className="text-sm font-extrabold text-slate-800 mt-0.5 block">
                {summary.estimatedLitresPerDay !== null
                  ? `${Math.round(summary.estimatedLitresPerDay).toLocaleString()} L / day`
                  : 'N/A'}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase text-slate-500 flex items-center gap-1">
                <IndianRupee className="w-3 h-3 text-emerald-600" />
                Est. Monthly Cost
              </span>
              <span className="text-sm font-extrabold text-emerald-700 mt-0.5 block">
                {summary.estimatedMonthlyCost !== null
                  ? `₹${Math.round(summary.estimatedMonthlyCost).toLocaleString()}`
                  : 'N/A'}
              </span>
            </div>
          </div>

          {/* Mandatory Reminder Box */}
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl mb-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <strong className="font-bold">Important Notice: </strong>
              This ticket records a <em>suspected water loss</em> based on statistical night-flow anomalies, not a confirmed leak.
              The detector identifies unusual overnight consumption patterns; it does not establish the physical cause or exact location.
            </div>
          </div>

          {/* Standard Physical Checklist - EXACT ORDER REQUIRED BY SPEC */}
          <div className="space-y-3 mb-6">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-2">
              Mandatory Physical Inspection Protocol (Follow In Order)
            </h4>

            {/* Item 1 */}
            <div
              onClick={() => toggleCheck(1)}
              className={`flex items-start gap-3.5 p-3.5 rounded-xl border cursor-pointer transition-all ${
                checkedItems[1]
                  ? 'bg-blue-50/60 border-blue-200 text-slate-600 line-through'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="mt-0.5 text-blue-600">
                {checkedItems[1] ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-slate-400" />}
              </div>
              <div className="flex-1">
                <span className="font-bold text-sm text-slate-900 block">
                  1. Check overhead tank overflow
                </span>
                <span className="text-xs text-slate-500 block mt-0.5">
                  Inspect the rooftop float ball valve, overflow discharge pipe, and level sensors during pump cycles.
                </span>
              </div>
            </div>

            {/* Item 2 */}
            <div
              onClick={() => toggleCheck(2)}
              className={`flex items-start gap-3.5 p-3.5 rounded-xl border cursor-pointer transition-all ${
                checkedItems[2]
                  ? 'bg-blue-50/60 border-blue-200 text-slate-600 line-through'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="mt-0.5 text-blue-600">
                {checkedItems[2] ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-slate-400" />}
              </div>
              <div className="flex-1">
                <span className="font-bold text-sm text-slate-900 block">
                  2. Toilet cistern dye test
                </span>
                <span className="text-xs text-slate-500 block mt-0.5">
                  Add non-toxic food coloring or dye tablets to toilet flush tanks without flushing. Check after 20 minutes if dye enters the toilet bowl.
                </span>
              </div>
            </div>

            {/* Item 3 */}
            <div
              onClick={() => toggleCheck(3)}
              className={`flex items-start gap-3.5 p-3.5 rounded-xl border cursor-pointer transition-all ${
                checkedItems[3]
                  ? 'bg-blue-50/60 border-blue-200 text-slate-600 line-through'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="mt-0.5 text-blue-600">
                {checkedItems[3] ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-slate-400" />}
              </div>
              <div className="flex-1">
                <span className="font-bold text-sm text-slate-900 block">
                  3. Close one wing&apos;s valve and re-check night flow
                </span>
                <span className="text-xs text-slate-500 block mt-0.5">
                  Isolate one building wing or floor manifold overnight to identify which zone causes the abnormal flow drop.
                </span>
              </div>
            </div>

            {/* Item 4 */}
            <div
              onClick={() => toggleCheck(4)}
              className={`flex items-start gap-3.5 p-3.5 rounded-xl border cursor-pointer transition-all ${
                checkedItems[4]
                  ? 'bg-blue-50/60 border-blue-200 text-slate-600 line-through'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="mt-0.5 text-blue-600">
                {checkedItems[4] ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-slate-400" />}
              </div>
              <div className="flex-1">
                <span className="font-bold text-sm text-slate-900 block">
                  4. Check pump and main line
                </span>
                <span className="text-xs text-slate-500 block mt-0.5">
                  Examine ground delivery lines, booster pump seals, non-return valves (NRVs), and underground sump headers for seepage.
                </span>
              </div>
            </div>
          </div>

          {/* Signoff Footer */}
          <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-4 text-xs text-slate-600">
            <div>
              <span className="font-semibold text-slate-700 block">Inspected By:</span>
              <div className="border-b border-slate-300 h-8 mt-1"></div>
            </div>
            <div>
              <span className="font-semibold text-slate-700 block">Date of Action:</span>
              <div className="border-b border-slate-300 h-8 mt-1"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
