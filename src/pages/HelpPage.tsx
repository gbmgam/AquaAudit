import React from 'react';
import {
  HelpCircle,
  Clock,
  Database,
  AlertTriangle,
  ClipboardList,
  FileText,
  User,
  Sparkles,
  ShieldAlert,
  Moon,
  Sun,
  ChevronRight,
} from 'lucide-react';

interface HelpPageProps {
  onOpenOnboarding: () => void;
}

export const HelpPage: React.FC<HelpPageProps> = ({ onOpenOnboarding }) => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60 mb-2">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Operational Handbook</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Help & Knowledge Base</h2>
          <p className="text-xs text-slate-500 mt-1">
            Practical guidelines for hostel wardens, facility guards, and building managers.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenOnboarding}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold border border-blue-200 transition-colors"
        >
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span>Launch First-Use Tour</span>
        </button>
      </div>

      {/* Guide Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Topic 1: Meter Logging Protocol */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">Recording Meter Readings</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            AquaAudit detects silent leaks using the quiet 6-hour interval when residents are asleep:
          </p>
          <div className="space-y-2 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5">
              <Moon className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
              <div>
                <strong className="text-slate-800">11:00 PM Reading (r_23):</strong>
                <span className="text-slate-600 block">
                  Night guard records the main meter before retiring.
                </span>
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5">
              <Sun className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <strong className="text-slate-800">5:00 AM Reading (r_05):</strong>
                <span className="text-slate-600 block">
                  Recorded promptly at 5 AM before morning showers and geysers start.
                </span>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 italic">
            Overnight flow = (r_05 on Day i - r_23 on Day i-1) / 6 hours.
          </p>
        </div>

        {/* Topic 2: CSV Upload Guidelines */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">Uploading CSV Records</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your guard log file must be in standard comma-separated format with headers:
          </p>
          <div className="p-3 bg-slate-900 text-slate-200 font-mono text-[11px] rounded-xl overflow-x-auto">
            day,r_23,r_05<br />
            1,100000,100120<br />
            2,100250,100310<br />
            3,,100500
          </div>
          <ul className="text-xs text-slate-600 list-disc list-inside space-y-1">
            <li>Empty cells are treated as missing readings (never zero).</li>
            <li>Decreasing readings are automatically rejected to preserve baseline accuracy.</li>
          </ul>
        </div>

        {/* Topic 3: Understanding Leak Alerts */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">What a &quot;Possible Leak&quot; Means</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            A red alert signifies that overnight water flow has significantly exceeded your property&apos;s
            historical median + 3×MAD threshold in at least 60% of recent valid observations.
          </p>
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
            <strong>Honesty Rule:</strong> An alert flags unusual overnight flow volume. It does not locate the leak
            or prove whether it is caused by an open tap, toilet cistern, or burst pipe.
          </div>
        </div>

        {/* Topic 4: Inspection & Tickets */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
              <ClipboardList className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">Physical Inspection Protocol</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            When an alert appears, generate an Inspection Ticket and instruct plumbing crews to execute
            the 4 steps in exact order:
          </p>
          <ol className="text-xs text-slate-700 list-decimal list-inside space-y-1 font-medium">
            <li>Check overhead tank overflow ball float valve.</li>
            <li>Perform toilet cistern dye test (colored water in bowl).</li>
            <li>Close one wing valve overnight and re-check night flow.</li>
            <li>Check booster pump seals and underground sump line.</li>
          </ol>
        </div>
      </div>

      {/* Account & Storage FAQ */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <User className="w-4 h-4 text-blue-600" />
          <span>Account, Reports & Privacy FAQ</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <strong className="text-slate-800 block mb-1">Are meter logs sent to external servers?</strong>
            No. All leak detection, MAD calculations, and simulations run 100% locally in your browser.
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <strong className="text-slate-800 block mb-1">How are saved reports stored?</strong>
            Reports are saved locally under your active user session. Export them as CSV or print them to keep records.
          </div>
        </div>
      </div>
    </div>
  );
};
