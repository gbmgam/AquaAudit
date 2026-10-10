import React, { useRef } from 'react';
import { SimulationConfig, ValidationResult, MeterReading } from '../types.ts';
import { parseMeterCsv } from '../lib/validation.ts';
import {
  Sliders,
  Upload,
  AlertTriangle,
  FileText,
  RefreshCw,
  Users,
  Droplet,
  Percent,
  Hash,
  Download,
  CheckCircle,
  Eye,
} from 'lucide-react';

interface DataPanelProps {
  dataSource: 'demo' | 'csv';
  onDataSourceChange: (source: 'demo' | 'csv') => void;
  simConfig: SimulationConfig;
  onSimConfigChange: (config: SimulationConfig) => void;
  validationResult: ValidationResult | null;
  csvFileName: string | null;
  onCsvUploaded: (readings: MeterReading[], filename: string) => void;
  rawReadings: MeterReading[];
}

export const DataPanel: React.FC<DataPanelProps> = ({
  dataSource,
  onDataSourceChange,
  simConfig,
  onSimConfigChange,
  validationResult,
  csvFileName,
  onCsvUploaded,
  rawReadings,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvError, setCsvError] = React.useState<string | null>(null);
  const [showTableModal, setShowTableModal] = React.useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvError(null);
    const reader = new FileReader();
    reader.onload = event => {
      const text = event.target?.result as string;
      const parseRes = parseMeterCsv(text);
      if (!parseRes.success) {
        setCsvError(parseRes.error || 'Failed to parse CSV');
      } else {
        onCsvUploaded(parseRes.data, file.name);
      }
    };
    reader.onerror = () => {
      setCsvError('Could not read file from disk.');
    };
    reader.readAsText(file);
    // Reset file input so same file can be re-selected if edited
    e.target.value = '';
  };

  const handleDownloadSampleCsv = () => {
    const sampleContent = `day,r_23,r_05
1,100000,100120
2,100250,100310
3,,100500
4,100680,100740
5,100910,100980
6,101150,101210
7,101390,101460
8,101620,101700
9,101880,101960
10,102120,102200
`;
    const blob = new Blob([sampleContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_meter_readings.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 transition-all">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm shadow-sm">
            1
          </span>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Data Source</h2>
            <p className="text-xs text-slate-500">
              Select deterministic simulated conditions or upload real daily logs
            </p>
          </div>
        </div>

        {/* Source Toggle */}
        <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/70">
          <button
            type="button"
            onClick={() => onDataSourceChange('demo')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              dataSource === 'demo'
                ? 'bg-white text-blue-700 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4" />
            Demo (simulated)
          </button>
          <button
            type="button"
            onClick={() => onDataSourceChange('csv')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              dataSource === 'csv'
                ? 'bg-white text-blue-700 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4" />
            Upload CSV
          </button>
        </div>
      </div>

      {/* Demo Controls */}
      {dataSource === 'demo' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Planted Leak Size */}
            <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/60">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                  <Droplet className="w-4 h-4 text-blue-500" />
                  Planted Leak Size
                </label>
                <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                  {simConfig.leakSize} L/hour
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                step="10"
                value={simConfig.leakSize}
                onChange={e =>
                  onSimConfigChange({
                    ...simConfig,
                    leakSize: Number(e.target.value),
                  })
                }
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>0 (No leak)</span>
                <span>Starts day 30</span>
                <span>200 L/h</span>
              </div>
            </div>

            {/* Missed Readings Slider */}
            <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/60">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                  <Percent className="w-4 h-4 text-amber-500" />
                  Missed Readings Rate
                </label>
                <span className="text-sm font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                  {simConfig.missedReadingsPct}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={simConfig.missedReadingsPct}
                onChange={e =>
                  onSimConfigChange({
                    ...simConfig,
                    missedReadingsPct: Number(e.target.value),
                  })
                }
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>0% (Perfect guard logs)</span>
                <span>50% missing</span>
              </div>
            </div>

            {/* Residents Input */}
            <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/60">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 mb-2">
                <Users className="w-4 h-4 text-emerald-500" />
                Hostel / PG Residents
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="5000"
                  value={simConfig.residents}
                  onChange={e => {
                    const val = Math.max(1, Number(e.target.value) || 1);
                    onSimConfigChange({ ...simConfig, residents: val });
                  }}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="absolute right-3 top-2 text-xs text-slate-400">people</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Standard benchmark: ~135 L / resident / day
              </p>
            </div>
          </div>

          {/* Educational Seed & Scenario Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-blue-50/60 border border-blue-100/80 rounded-xl p-3 text-slate-600">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-blue-500" />
              <span>
                <strong>Seed:</strong> {simConfig.seed} (deterministic pseudo-random sequence)
              </span>
              <button
                type="button"
                onClick={() =>
                  onSimConfigChange({
                    ...simConfig,
                    seed: Math.floor(Math.random() * 100000) + 1,
                  })
                }
                className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-800 font-medium ml-1 underline decoration-dotted"
                title="Randomize seed for new educational video demonstration"
              >
                <RefreshCw className="w-3 h-3" />
                Change Seed
              </button>
            </div>
            <div className="text-slate-500">
              Meter starts at <strong>100,000 L</strong> • 60-day timeline • Leak begins at Day 30
            </div>
          </div>
        </div>
      )}

      {/* CSV Upload Mode */}
      {dataSource === 'csv' && (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-slate-300 hover:border-blue-400 bg-slate-50/60 rounded-xl p-6 text-center transition-all">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="hidden"
              id="meter-csv-upload"
            />
            <FileText className="w-10 h-10 text-blue-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700 mb-1">
              {csvFileName ? `Loaded file: ${csvFileName}` : 'Select or drag & drop meter reading CSV'}
            </p>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
              Columns required: <code>day,r_23,r_05</code>. Empty cells are treated as missing readings.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <label
                htmlFor="meter-csv-upload"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm cursor-pointer transition-colors"
              >
                <Upload className="w-4 h-4" />
                Browse File
              </label>
              <button
                type="button"
                onClick={handleDownloadSampleCsv}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-sm font-medium transition-colors"
              >
                <Download className="w-4 h-4 text-slate-500" />
                Download Sample CSV
              </button>
            </div>
          </div>

          {/* CSV Parse Error Alert */}
          {csvError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-700 text-xs">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold">CSV Error: </strong>
                {csvError}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Validation & Summary Badge Bar */}
      {validationResult && (
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md font-medium">
              <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
              {validationResult.totalRows} days loaded
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-md font-medium border border-amber-200/50">
              {validationResult.missingReadingsCount} missing readings
            </span>
            {validationResult.rejectedReadingsCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 rounded-md font-medium border border-red-200">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                {validationResult.rejectedReadingsCount} readings rejected (lower than previous)
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowTableModal(!showTableModal)}
            className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-semibold"
          >
            <Eye className="w-3.5 h-3.5" />
            {showTableModal ? 'Hide Raw Readings' : 'Inspect Raw Readings'}
          </button>
        </div>
      )}

      {/* Decreasing Reading Warning List */}
      {validationResult && validationResult.issues.length > 0 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl space-y-1.5">
          <div className="text-xs font-bold text-red-800 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            Validation Anomalies Detected ({validationResult.issues.length}):
          </div>
          <div className="max-h-32 overflow-y-auto space-y-1 text-xs text-red-700 pr-1">
            {validationResult.issues.map((issue, idx) => (
              <div key={idx} className="flex items-center justify-between py-0.5 border-b border-red-100 last:border-none">
                <span>{issue.message}</span>
                <span className="text-[11px] text-red-500">
                  (Recorded: {issue.value.toLocaleString()} L vs Prior: {issue.lastValidValue.toLocaleString()} L)
                </span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-red-600 italic">
            Rejected readings are safely excluded from overnight calculations to protect detection integrity.
          </p>
        </div>
      )}

      {/* Raw Readings Data Table Accordion */}
      {showTableModal && (
        <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
          <div className="max-h-60 overflow-y-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">Day</th>
                  <th className="py-2 px-3">5 AM Reading (r_05)</th>
                  <th className="py-2 px-3">11 PM Reading (r_23)</th>
                  <th className="py-2 px-3">Validation Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {rawReadings.map(r => {
                  const val = validationResult?.validatedReadings.find(v => v.day === r.day);
                  return (
                    <tr key={r.day} className="hover:bg-slate-50">
                      <td className="py-1.5 px-3 font-semibold text-slate-700">Day {r.day}</td>
                      <td className="py-1.5 px-3">
                        {r.r_05 !== null ? (
                          <span
                            className={
                              val?.is_r_05_valid === false
                                ? 'text-red-600 font-semibold line-through'
                                : 'text-slate-700'
                            }
                          >
                            {r.r_05.toLocaleString()} L
                          </span>
                        ) : (
                          <span className="text-amber-500 font-medium italic">Missing</span>
                        )}
                      </td>
                      <td className="py-1.5 px-3">
                        {r.r_23 !== null ? (
                          <span
                            className={
                              val?.is_r_23_valid === false
                                ? 'text-red-600 font-semibold line-through'
                                : 'text-slate-700'
                            }
                          >
                            {r.r_23.toLocaleString()} L
                          </span>
                        ) : (
                          <span className="text-amber-500 font-medium italic">Missing</span>
                        )}
                      </td>
                      <td className="py-1.5 px-3">
                        {val?.is_r_05_valid === false || val?.is_r_23_valid === false ? (
                          <span className="text-red-600 font-semibold">Rejected Reading</span>
                        ) : r.r_05 === null || r.r_23 === null ? (
                          <span className="text-amber-600">Incomplete Day</span>
                        ) : (
                          <span className="text-emerald-600">Valid</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
