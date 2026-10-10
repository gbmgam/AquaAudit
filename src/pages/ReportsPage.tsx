import React, { useState } from 'react';
import { SavedReport } from '../types.ts';
import { ReportService } from '../lib/reports.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  FileText,
  Search,
  Filter,
  Download,
  Trash2,
  Eye,
  Printer,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Building,
  Droplet,
  IndianRupee,
  X,
  Sliders,
  Upload,
} from 'lucide-react';

interface ReportsPageProps {
  reports: SavedReport[];
  onRefreshReports: () => void;
  onNavigateToTickets: () => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({
  reports,
  onRefreshReports,
  onNavigateToTickets,
}) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'alert' | 'normal'>('all');
  const [selectedReport, setSelectedReport] = useState<SavedReport | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<SavedReport | null>(null);

  // Filter reports
  const filteredReports = reports.filter(r => {
    const matchesSearch =
      r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.buildingName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.notes && r.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'alert' && r.alertStatus === 'alert') ||
      (statusFilter === 'normal' && r.alertStatus === 'normal');

    return matchesSearch && matchesStatus;
  });

  const handleDownloadCsv = () => {
    if (filteredReports.length === 0) return;
    const csvContent = ReportService.exportReportsToCsv(filteredReports);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `AquaAudit_Reports_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleConfirmDelete = () => {
    if (!deleteCandidate || !user) return;
    ReportService.deleteReport(deleteCandidate.id, user.id);
    setDeleteCandidate(null);
    onRefreshReports();
  };

  const handlePrintModal = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60 mb-2">
            <FileText className="w-3.5 h-3.5" />
            <span>Inspection Archive</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Saved Audit Reports</h2>
          <p className="text-xs text-slate-500 mt-1">
            Historical records of night-flow inspections and maintenance checklist sign-offs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleDownloadCsv}
            disabled={filteredReports.length === 0}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              filteredReports.length === 0
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-2xs'
            }`}
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={onNavigateToTickets}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            <span>+ Create New Ticket</span>
          </button>
        </div>
      </div>

      {/* Storage Scope Notice */}
      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          <span>
            Reports are isolated to your active account and stored safely in your browser storage.
            They will persist across sessions on this device.
          </span>
        </div>
        <span className="text-[11px] font-bold text-slate-400">Total: {reports.length} reports</span>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by Report ID, property name or notes..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-600">Status:</span>
          <div className="inline-flex p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({reports.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('alert')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                statusFilter === 'alert'
                  ? 'bg-white text-red-700 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Alerts
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('normal')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                statusFilter === 'normal'
                  ? 'bg-white text-emerald-700 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Normal
            </button>
          </div>
        </div>
      </div>

      {/* Reports Table or Empty State */}
      {filteredReports.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No reports found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
            {searchTerm || statusFilter !== 'all'
              ? 'No reports match your active search filters.'
              : 'You have not saved any inspection tickets yet. Generate one from the Inspection Tickets tab!'}
          </p>
          <button
            type="button"
            onClick={onNavigateToTickets}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            Open Inspection Tickets
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Report ID</th>
                  <th className="py-3 px-4">Date & Day</th>
                  <th className="py-3 px-4">Status & Conf.</th>
                  <th className="py-3 px-4">Est. Loss</th>
                  <th className="py-3 px-4">Est. Cost</th>
                  <th className="py-3 px-4">Checklist</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReports.map(report => (
                  <tr key={report.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {report.id}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div>{new Date(report.createdAt).toLocaleDateString()}</div>
                      <div className="text-[10px] text-slate-400">Day {report.detectionDay}</div>
                    </td>
                    <td className="py-3 px-4">
                      {report.alertStatus === 'alert' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] bg-red-50 text-red-700 border border-red-200">
                          <AlertTriangle className="w-3 h-3 text-red-600" />
                          Alert ({report.alertConfidence || 'Med'})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Normal
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {report.estimatedLitresPerDay !== null
                        ? `${Math.round(report.estimatedLitresPerDay).toLocaleString()} L/day`
                        : 'N/A'}
                    </td>
                    <td className="py-3 px-4 font-semibold text-emerald-700">
                      {report.estimatedMonthlyCost !== null
                        ? `₹${Math.round(report.estimatedMonthlyCost).toLocaleString()}`
                        : 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      {(() => {
                        const checkedCount = Object.values(report.checklistStatus).filter(Boolean).length;
                        return (
                          <span
                            className={`px-2 py-0.5 rounded font-semibold text-[11px] ${
                              checkedCount === 4
                                ? 'bg-emerald-50 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {checkedCount}/4 tasks
                          </span>
                        );
                      })()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                        {report.dataSource === 'simulated' ? (
                          <>
                            <Sliders className="w-3 h-3 text-amber-500" />
                            <span>Simulated</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3 h-3 text-blue-500" />
                            <span>Uploaded</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedReport(report)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteCandidate(report)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Report"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setSelectedReport(null)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Inspection Report Record
              </span>
              <span className="text-xs text-slate-400">• {selectedReport.id}</span>
            </div>

            <h3 className="text-xl font-black text-slate-900 mb-1">
              AquaAudit Water Loss Inspection
            </h3>
            <p className="text-xs text-slate-500 mb-6 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5" />
              {selectedReport.buildingName} • Recorded {new Date(selectedReport.createdAt).toLocaleDateString()}
            </p>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 mb-6 text-xs">
              <div>
                <span className="text-slate-500 font-medium">Alert Status:</span>
                <p className="font-bold text-slate-800 mt-0.5">
                  {selectedReport.alertStatus === 'alert'
                    ? `Suspected Leak (${selectedReport.alertConfidence} Confidence)`
                    : 'Normal Baseline'}
                </p>
              </div>

              <div>
                <span className="text-slate-500 font-medium">Detection Day:</span>
                <p className="font-bold text-slate-800 mt-0.5">Day {selectedReport.detectionDay}</p>
              </div>

              <div>
                <span className="text-slate-500 font-medium">Estimated Daily Loss:</span>
                <p className="font-bold text-slate-800 mt-0.5">
                  {selectedReport.estimatedLitresPerDay !== null
                    ? `${Math.round(selectedReport.estimatedLitresPerDay).toLocaleString()} L / day`
                    : 'N/A'}
                </p>
              </div>

              <div>
                <span className="text-slate-500 font-medium">Estimated Monthly Cost:</span>
                <p className="font-bold text-emerald-700 mt-0.5">
                  {selectedReport.estimatedMonthlyCost !== null
                    ? `₹${Math.round(selectedReport.estimatedMonthlyCost).toLocaleString()}`
                    : 'N/A'}
                </p>
              </div>
            </div>

            {/* Mandatory Reminder Box */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl mb-6 text-xs text-amber-900 leading-relaxed">
              <strong className="font-bold">Notice: </strong>
              This record documents suspected water loss based on statistical overnight meter readings, not a confirmed leak.
            </div>

            {/* Checklist Results */}
            <div className="space-y-2 mb-6">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Inspection Protocol Status
              </h4>
              <ul className="text-xs space-y-2 text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <li className="flex items-center justify-between">
                  <span>1. Check overhead tank overflow</span>
                  <span
                    className={
                      selectedReport.checklistStatus.tankOverflowChecked
                        ? 'text-emerald-600 font-bold'
                        : 'text-slate-400'
                    }
                  >
                    {selectedReport.checklistStatus.tankOverflowChecked ? 'Completed' : 'Pending'}
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span>2. Toilet cistern dye test</span>
                  <span
                    className={
                      selectedReport.checklistStatus.cisternDyeChecked
                        ? 'text-emerald-600 font-bold'
                        : 'text-slate-400'
                    }
                  >
                    {selectedReport.checklistStatus.cisternDyeChecked ? 'Completed' : 'Pending'}
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span>3. Close one wing&apos;s valve and re-check night flow</span>
                  <span
                    className={
                      selectedReport.checklistStatus.wingValveChecked
                        ? 'text-emerald-600 font-bold'
                        : 'text-slate-400'
                    }
                  >
                    {selectedReport.checklistStatus.wingValveChecked ? 'Completed' : 'Pending'}
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span>4. Check pump and main line</span>
                  <span
                    className={
                      selectedReport.checklistStatus.pumpMainLineChecked
                        ? 'text-emerald-600 font-bold'
                        : 'text-slate-400'
                    }
                  >
                    {selectedReport.checklistStatus.pumpMainLineChecked ? 'Completed' : 'Pending'}
                  </span>
                </li>
              </ul>
            </div>

            {selectedReport.notes && (
              <div className="mb-6 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <strong className="block text-slate-700 font-bold mb-1">Inspector Notes:</strong>
                {selectedReport.notes}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handlePrintModal}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>Print Document</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-200">
                <Trash2 className="w-6 h-6" />
              </div>
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1">Delete Report {deleteCandidate.id}?</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              Are you sure you want to remove this inspection report from your archive? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
