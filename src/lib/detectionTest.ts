/**
 * Robustness Evaluation for AquaAudit
 *
 * Runs 540 deterministic seeded simulations across 18 parameter combinations:
 * - Leak sizes: [0, 10, 20, 50, 100, 200] L/hour
 * - Missed reading rates: [0, 20, 40]%
 * - 30 independent seeded runs each
 *
 * Evaluates:
 * - Detection Rate: Alert occurring in days 30–43 (for leak > 0)
 * - False Alarm Rate: Any alert across 60 days (for leak = 0)
 */

import { RobustnessTestRow } from '../types.ts';
import { simulateMeterReadings } from './simulator.ts';
import { validateMeterReadings } from './validation.ts';
import { detectNightFlowLoss } from './detector.ts';

export const LEAK_SIZES_TO_TEST = [0, 10, 20, 50, 100, 200];
export const MISSED_RATES_TO_TEST = [0, 20, 40];
export const RUNS_PER_COMBO = 30;
export const TOTAL_SIMULATION_RUNS = LEAK_SIZES_TO_TEST.length * MISSED_RATES_TO_TEST.length * RUNS_PER_COMBO; // 540

/**
 * Runs a single simulation and checks detection / false alarm criteria
 */
export function evaluateSingleRun(
  leakSize: number,
  missedReadingsPct: number,
  seed: number
): { hasDetectionInWindow: boolean; hasAnyAlert: boolean } {
  const readings = simulateMeterReadings({
    residents: 100,
    leakSize,
    missedReadingsPct,
    seed,
    totalDays: 60,
    leakStartDay: 30,
    initialMeterLitres: 100000,
    waterPrice: 30,
  });

  const validation = validateMeterReadings(readings);
  const detection = detectNightFlowLoss(validation.validatedReadings, 30);

  // Check alert in days 30-43 inclusive
  const hasDetectionInWindow = detection.days.some(
    d => d.day >= 30 && d.day <= 43 && d.hasAlert
  );

  // Check any alert across all 60 days
  const hasAnyAlert = detection.days.some(d => d.hasAlert);

  return {
    hasDetectionInWindow,
    hasAnyAlert,
  };
}

/**
 * Executes the full robustness test with asynchronous chunking to avoid UI blocking.
 */
export async function runFullRobustnessTest(
  onProgress?: (completedRuns: number, totalRuns: number) => void
): Promise<RobustnessTestRow[]> {
  const results: RobustnessTestRow[] = [];
  let completedRuns = 0;
  let comboIndex = 0;

  for (const leakSize of LEAK_SIZES_TO_TEST) {
    for (const missedRate of MISSED_RATES_TO_TEST) {
      let detectionsCount = 0;
      let falseAlarmsCount = 0;

      for (let run = 0; run < RUNS_PER_COMBO; run++) {
        // Unique deterministic seed for each combo and run
        const seed = 50000 + comboIndex * 1000 + run * 97 + 13;
        const evaluation = evaluateSingleRun(leakSize, missedRate, seed);

        if (leakSize > 0) {
          if (evaluation.hasDetectionInWindow) {
            detectionsCount++;
          }
        } else {
          // Zero leak: check for false alarms
          if (evaluation.hasAnyAlert) {
            falseAlarmsCount++;
          }
        }

        completedRuns++;
        if (completedRuns % 15 === 0) {
          if (onProgress) {
            onProgress(completedRuns, TOTAL_SIMULATION_RUNS);
          }
          // Yield to browser event loop
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }

      const detectionRatePct =
        leakSize > 0 ? (detectionsCount / RUNS_PER_COMBO) * 100 : null;
      const falseAlarmRatePct =
        leakSize === 0 ? (falseAlarmsCount / RUNS_PER_COMBO) * 100 : null;

      results.push({
        leakSize,
        missedReadingsPct: missedRate,
        runsCount: RUNS_PER_COMBO,
        successfulDetections: leakSize > 0 ? detectionsCount : 0,
        detectionRatePct,
        falseAlarms: leakSize === 0 ? falseAlarmsCount : 0,
        falseAlarmRatePct,
      });

      comboIndex++;
    }
  }

  if (onProgress) {
    onProgress(TOTAL_SIMULATION_RUNS, TOTAL_SIMULATION_RUNS);
  }

  return results;
}
