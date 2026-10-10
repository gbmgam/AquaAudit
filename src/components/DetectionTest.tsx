import React, { useState } from 'react';
import { RobustnessTestRow } from '../types.ts';
import { runFullRobustnessTest, TOTAL_SIMULATION_RUNS } from '../lib/detectionTest.ts';
import {
  TestTubes,
  Play,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  BarChart2,
} from 'lucide-react';

export const DetectionTest: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<{ completed: number; total: number }>({
    completed: 0,
    total: TOTAL_SIMULATION_RUNS,
  });
  const [results, setResults] = useState<RobustnessTestRow[] | null>(null);

  const handleStartTest = async () => {
    setIsRunning(true);
    setProgress({ completed: 0, total: TOTAL_SIMULATION_RUNS });

    try {
      const data = await runFullRobustnessTest((completed, total) => {
        setProgress({ completed, total });
      });
      setResults(data);
    } catch (err) {
      console.error('Detection test failed:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const progressPercent = Math.round((progress.completed / progress.total) * 100);

  // Compute educational summary based on REAL calculated results
  const renderSummary = () => {
    if (!results) return null;

    // Zero leak false alarms across all missed rates
    const zeroLeakRows = results.filter(r => r.leakSize === 0);
    const totalZeroRuns = zeroLeakRows.reduce((acc, r) => acc + r.runsCount, 0);
    const totalFalseAlarms = zeroLeakRows.reduce((acc, r) => acc + r.falseAlarms, 0);
    const overallFalseAlarmRate = ((totalFalseAlarms / totalZeroRuns) * 100).toFixed(1);

    // High leak (>= 50 L/h) detection rate at 0% missed readings
    const largeLeakZeroMissed = results.filter(r => r.leakSize >= 50 && r.missedReadingsPct === 0);
    const avgLargeDetection = (
      largeLeakZeroMissed.reduce((acc, r) => acc + (r.detectionRatePct || 0), 0) /
      largeLeakZeroMissed.length
    ).toFixed(1);

    // Subtle leak (10-20 L/h) at 40% missed readings
    const smallLeakHighMissed = results.filter(
      r => (r.leakSize === 10 || r.leakSize === 20) && r.missedReadingsPct === 40
    );
    const avgSmallHardDetection = (
      smallLeakHighMissed.reduce((acc, r) => acc + (r.detectionRatePct || 0), 0) /
      smallLeakHighMissed.length
    ).toFixed(1);

    return (
      <div className="mt-5 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2 text-slate-700">
        <div className="font-bold text-slate-800 flex items-center gap-1.5">
          <BarChart2 className="w-4 h-4 text-blue-600" />
          Empirical Insights From The 540 Simulated Runs
        </div>
        <ul className="list-disc list-inside space-y-1 text-slate-600">
          <li>
            <strong>False Alarm Sensitivity:</strong> With zero planted leak, the baseline + 3×MAD rule maintained an overall false alarm rate of{' '}
            <span className="font-bold text-slate-800">{overallFalseAlarmRate}%</span> ({totalFalseAlarms} alerts out of {totalZeroRuns} trials).
          </li>
          <li>
            <strong>Impact of Leak Magnitude:</strong> Moderate to heavy leaks (≥ 50 L/hour) achieved an average detection rate of{' '}
            <span className="font-bold text-emerald-700">{avgLargeDetection}%</span> within the 14-day post-onset evaluation window under complete logging.
          </li>
          <li>
            <strong>Impact of Missed Guard Logs:</strong> Missing 40% of readings combined with subtle flow anomalies (10–20 L/hour) reduced early detection to{' '}
            <span className="font-bold text-amber-700">{avgSmallHardDetection}%</span>, demonstrating that regular physical meter logging is essential for prompt alert generation.
          </li>
        </ul>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 my-6 transition-all">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl">
            <TestTubes className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Robustness Evaluation Study</h2>
            <p className="text-xs text-slate-500">
              540 independent seeded runs across 18 parameter combinations (30 runs each)
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={isRunning}
          onClick={handleStartTest}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all ${
            isRunning
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}
        >
          {isRunning ? (
            <>
              <RotateCcw className="w-4 h-4 animate-spin" />
              Running Study ({progressPercent}%)
            </>
          ) : results ? (
            <>
              <RotateCcw className="w-4 h-4" />
              Rerun Detection test
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Detection test
            </>
          )}
        </button>
      </div>

      {/* Progress Bar while running */}
      {isRunning && (
        <div className="mb-6 bg-indigo-50/70 border border-indigo-100 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-indigo-900 mb-2">
            <span>Executing deterministic browser simulation runs...</span>
            <span>
              {progress.completed} / {progress.total} runs completed ({progressPercent}%)
            </span>
          </div>
          <div className="w-full bg-indigo-200 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-2.5 rounded-full transition-all duration-150"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <p className="text-[11px] text-indigo-700 mt-2">
            Simulating 60-day consumption histories, applying chronological validation, and evaluating persistent alert rules locally.
          </p>
        </div>
      )}

      {/* Exact Warning Required by Section 12 */}
      <div className="mb-5 p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-black text-amber-900">
            Tested on SIMULATED data only - shows robustness, not real-world accuracy.
          </h4>
          <p className="text-xs text-amber-800 mt-0.5">
            This study measures algorithmic behavior against controlled mathematical noise and planted synthetic losses.
            It is designed for educational verification and does not guarantee detection of real physical plumbing faults.
          </p>
        </div>
      </div>

      {/* Initial state before test is run */}
      {!results && !isRunning && (
        <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
          <TestTubes className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-700">Benchmark Ready to Run</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
            Click &quot;Detection test&quot; above to simulate 540 distinct 60-day hostel scenarios locally in your browser.
            Evaluates detection rate within days 30–43 and false-alarm frequency on leak-free baselines.
          </p>
          <button
            type="button"
            onClick={handleStartTest}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm"
          >
            <Play className="w-3.5 h-3.5" />
            Run Detection test
          </button>
        </div>
      )}

      {/* Results Table */}
      {results && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Leak Size (L/h)</th>
                  <th className="py-2.5 px-3">Missed Readings (%)</th>
                  <th className="py-2.5 px-3">Successful Detections</th>
                  <th className="py-2.5 px-3">Detection Rate (%)</th>
                  <th className="py-2.5 px-3">False Alarms</th>
                  <th className="py-2.5 px-3">False-Alarm Rate (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {results.map((row, idx) => {
                  const isZeroLeak = row.leakSize === 0;
                  return (
                    <tr
                      key={idx}
                      className={
                        isZeroLeak
                          ? 'bg-slate-50/60 hover:bg-slate-100/60'
                          : 'hover:bg-slate-50'
                      }
                    >
                      <td className="py-2.5 px-3 font-bold text-slate-800">
                        {row.leakSize === 0 ? '0 (No leak)' : `${row.leakSize} L/h`}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-600">
                        {row.missedReadingsPct}%
                      </td>
                      <td className="py-2.5 px-3">
                        {isZeroLeak ? (
                          <span className="text-slate-400 font-medium">N/A</span>
                        ) : (
                          <span className="font-semibold text-slate-800">
                            {row.successfulDetections} / {row.runsCount}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {isZeroLeak ? (
                          <span className="text-slate-400 font-medium">N/A</span>
                        ) : (
                          <span
                            className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                              (row.detectionRatePct ?? 0) >= 80
                                ? 'bg-emerald-100 text-emerald-800'
                                : (row.detectionRatePct ?? 0) >= 50
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {(row.detectionRatePct ?? 0).toFixed(1)}%
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {!isZeroLeak ? (
                          <span className="text-slate-400 font-medium">N/A</span>
                        ) : (
                          <span className="font-semibold text-slate-800">
                            {row.falseAlarms} / {row.runsCount}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {!isZeroLeak ? (
                          <span className="text-slate-400 font-medium">N/A</span>
                        ) : (
                          <span
                            className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                              (row.falseAlarmRatePct ?? 0) <= 5
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {(row.falseAlarmRatePct ?? 0).toFixed(1)}%
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Educational Insights Summary */}
          {renderSummary()}
        </div>
      )}
    </div>
  );
};
