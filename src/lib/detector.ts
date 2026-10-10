/**
 * Deterministic Night-Flow Detector for AquaAudit
 *
 * Implements:
 * - Robust median and Median Absolute Deviation (MAD)
 * - 6-hour overnight flow calculation: (r_05[i] - r_23[i-1]) / 6
 * - Baseline protection (suspected leak nights never enter normal history)
 * - 7-day rolling window persistent alert rule with High/Medium confidence
 * - Loss and cost estimations based on the latest alert
 */

import { AlertConfidence, DayAnalysis, DetectionSummary, ValidatedDayReading } from '../types.ts';

/**
 * Calculates the median of an array of numbers.
 * Supports both odd and even length arrays with exact middle averaging.
 */
export function calculateMedian(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return sorted[mid];
  }
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Calculates Median Absolute Deviation (MAD) and scales by 1.4826 (normal consistency factor)
 */
export function calculateMAD(numbers: number[], baseline: number): number {
  if (numbers.length === 0) return 0;
  const absoluteDeviations = numbers.map(val => Math.abs(val - baseline));
  const medianDeviation = calculateMedian(absoluteDeviations);
  return 1.4826 * medianDeviation;
}

/**
 * Calculates threshold: baseline + max(3 * mad, 10)
 */
export function calculateThreshold(baseline: number, mad: number): number {
  return baseline + Math.max(3 * mad, 10);
}

/**
 * Detects silent water loss across a sequence of validated meter readings.
 */
export function detectNightFlowLoss(
  validatedDays: ValidatedDayReading[],
  waterPrice: number = 30
): DetectionSummary {
  if (validatedDays.length === 0) {
    return {
      days: [],
      latestDayAlert: false,
      latestConfidence: null,
      latestDay: 0,
      extraNightFlow: null,
      estimatedLitresPerDay: null,
      estimatedMonthlyCost: null,
      totalFlaggedDays: 0,
      usableFlaggedNightsCount: 0,
    };
  }

  // Map day -> validated reading for direct fast lookup
  const dayMap = new Map<number, ValidatedDayReading>();
  for (const d of validatedDays) {
    dayMap.set(d.day, d);
  }

  const sortedDays = [...validatedDays].sort((a, b) => a.day - b.day);
  const minDay = sortedDays[0].day;
  const maxDay = sortedDays[sortedDays.length - 1].day;

  // History of normal (unflagged) night flows
  const normalHistory: number[] = [];
  const dayAnalyses: DayAnalysis[] = [];

  // Step A & B: Sequential processing through time
  for (const currentDayRecord of sortedDays) {
    const day = currentDayRecord.day;
    const prevDayRecord = dayMap.get(day - 1);

    // Compute eligible night flow: (r_05[day] - r_23[day - 1]) / 6
    let nightFlow: number | null = null;
    if (
      currentDayRecord.is_r_05_valid &&
      currentDayRecord.valid_r_05 !== null &&
      prevDayRecord &&
      prevDayRecord.is_r_23_valid &&
      prevDayRecord.valid_r_23 !== null
    ) {
      nightFlow = (currentDayRecord.valid_r_05 - prevDayRecord.valid_r_23) / 6;
    }

    let baseline: number | null = null;
    let mad: number | null = null;
    let threshold: number | null = null;
    let isFlagged: boolean | null = null;
    let flowStatus: DayAnalysis['flowStatus'] = 'missing_endpoint';

    if (nightFlow !== null) {
      if (normalHistory.length < 5) {
        // Learning phase: history contains fewer than 5 normal values
        // Do not flag; append flow to history
        flowStatus = 'learning';
        isFlagged = null; // Spec: days in learning phase have no flag value
        normalHistory.push(nightFlow);
      } else {
        // At least 5 values exist in normal history
        // Take the last up to 14 history values
        const windowValues = normalHistory.slice(-14);
        baseline = calculateMedian(windowValues);
        mad = calculateMAD(windowValues, baseline);
        threshold = calculateThreshold(baseline, mad);

        // Flag if night flow strictly exceeds threshold
        if (nightFlow > threshold) {
          isFlagged = true;
          flowStatus = 'flagged';
          // DO NOT append flagged night to normalHistory (baseline protection)
        } else {
          isFlagged = false;
          flowStatus = 'normal';
          normalHistory.push(nightFlow);
        }
      }
    }

    dayAnalyses.push({
      day,
      raw_r_05: currentDayRecord.raw_r_05,
      raw_r_23: currentDayRecord.raw_r_23,
      valid_r_05: currentDayRecord.valid_r_05,
      valid_r_23: currentDayRecord.valid_r_23,
      nightFlow,
      baseline,
      mad,
      threshold,
      isFlagged,
      flowStatus,
      hasAlert: false,
      confidence: null,
      windowValidFlags: 0,
      windowFlaggedCount: 0,
    });
  }

  // Step C: Persistent-alert rule
  // For each day i, examine inclusive window [max(minDay, day - 6), day]
  const analysisByDay = new Map<number, DayAnalysis>();
  for (const analysis of dayAnalyses) {
    analysisByDay.set(analysis.day, analysis);
  }

  let totalFlaggedDays = 0;

  for (const analysis of dayAnalyses) {
    if (analysis.isFlagged === true) {
      totalFlaggedDays++;
    }

    const startWindowDay = Math.max(minDay, analysis.day - 6);
    let validFlags = 0;
    let flaggedCount = 0;

    for (let d = startWindowDay; d <= analysis.day; d++) {
      const windowDay = analysisByDay.get(d);
      if (windowDay && windowDay.isFlagged !== null) {
        validFlags++;
        if (windowDay.isFlagged === true) {
          flaggedCount++;
        }
      }
    }

    analysis.windowValidFlags = validFlags;
    analysis.windowFlaggedCount = flaggedCount;

    // Conditions: validFlags >= 3 && flaggedCount >= 3 && (flaggedCount / validFlags) >= 0.6
    if (validFlags >= 3 && flaggedCount >= 3 && flaggedCount / validFlags >= 0.6) {
      analysis.hasAlert = true;
      analysis.confidence = flaggedCount >= 5 ? 'High' : 'Medium';
    } else {
      analysis.hasAlert = false;
      analysis.confidence = null;
    }
  }

  // Latest day results drive the Result Panel
  const latestAnalysis = dayAnalyses[dayAnalyses.length - 1];
  const latestDayAlert = latestAnalysis ? latestAnalysis.hasAlert : false;
  const latestConfidence = latestAnalysis ? latestAnalysis.confidence : null;
  const latestDay = latestAnalysis ? latestAnalysis.day : 0;

  // Calculate Extra Night Flow and estimated loss
  // Median of (nightFlow - baseline) over the most recent 7 flagged nights up to latest day
  let extraNightFlow: number | null = null;
  let estimatedLitresPerDay: number | null = null;
  let estimatedMonthlyCost: number | null = null;
  let usableFlaggedNightsCount = 0;

  if (latestDayAlert) {
    const allFlaggedSoFar = dayAnalyses.filter(
      d => d.day <= latestDay && d.isFlagged === true && d.nightFlow !== null && d.baseline !== null
    );

    if (allFlaggedSoFar.length > 0) {
      // Take the most recent up to 7 flagged nights
      const recentFlagged = allFlaggedSoFar.slice(-7);
      usableFlaggedNightsCount = recentFlagged.length;

      const deviations = recentFlagged.map(f => (f.nightFlow as number) - (f.baseline as number));
      extraNightFlow = Math.max(0, calculateMedian(deviations));
      estimatedLitresPerDay = extraNightFlow * 24;
      estimatedMonthlyCost = (estimatedLitresPerDay * 30 / 1000) * waterPrice;
    }
  }

  return {
    days: dayAnalyses,
    latestDayAlert,
    latestConfidence,
    latestDay,
    extraNightFlow,
    estimatedLitresPerDay,
    estimatedMonthlyCost,
    totalFlaggedDays,
    usableFlaggedNightsCount,
  };
}
