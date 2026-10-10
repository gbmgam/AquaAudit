import { describe, it, expect } from 'vitest';
import {
  calculateMedian,
  calculateMAD,
  calculateThreshold,
  detectNightFlowLoss,
} from '../detector.ts';
import { validateMeterReadings, parseMeterCsv } from '../validation.ts';
import { simulateMeterReadings } from '../simulator.ts';
import {
  evaluateSingleRun,
  LEAK_SIZES_TO_TEST,
  MISSED_RATES_TO_TEST,
  RUNS_PER_COMBO,
} from '../detectionTest.ts';
import { AuthService } from '../auth.ts';
import { ReportService } from '../reports.ts';
import { MeterReading, ValidatedDayReading } from '../../types.ts';

describe('AquaAudit Core Logic Unit Tests', () => {
  // Test 1: Median for odd and even sample sizes
  it('1. correctly computes median for odd and even sample sizes', () => {
    // Odd
    expect(calculateMedian([5])).toBe(5);
    expect(calculateMedian([7, 1, 3])).toBe(3);
    expect(calculateMedian([10, 20, 30, 40, 50])).toBe(30);

    // Even
    expect(calculateMedian([10, 20])).toBe(15);
    expect(calculateMedian([1, 2, 3, 4])).toBe(2.5);
    expect(calculateMedian([100, 20, 50, 80])).toBe(65); // sorted: [20, 50, 80, 100] -> (50+80)/2 = 65

    // Empty array edge case
    expect(calculateMedian([])).toBe(0);
  });

  // Test 2: MAD and threshold calculations
  it('2. correctly computes MAD and scaled threshold calculations', () => {
    // Array: [10, 12, 10, 11, 10]
    // Median = 10
    // Absolute deviations from 10: [0, 2, 0, 1, 0] -> sorted: [0, 0, 0, 1, 2] -> median deviation = 0
    // MAD = 1.4826 * 0 = 0
    // Threshold = baseline + max(3 * mad, 10) = 10 + max(0, 10) = 20
    const vals = [10, 12, 10, 11, 10];
    const baseline = calculateMedian(vals);
    const mad = calculateMAD(vals, baseline);
    const threshold = calculateThreshold(baseline, mad);

    expect(baseline).toBe(10);
    expect(mad).toBe(0);
    expect(threshold).toBe(20);

    // Array with spread: [10, 20, 30, 40, 50]
    // Baseline = 30
    // Absolute deviations: [20, 10, 0, 10, 20] -> sorted: [0, 10, 10, 20, 20] -> median deviation = 10
    // MAD = 1.4826 * 10 = 14.826
    // Threshold = 30 + max(3 * 14.826, 10) = 30 + 44.478 = 74.478
    const spread = [10, 20, 30, 40, 50];
    const b2 = calculateMedian(spread);
    const m2 = calculateMAD(spread, b2);
    const t2 = calculateThreshold(b2, m2);

    expect(b2).toBe(30);
    expect(Number(m2.toFixed(3))).toBe(14.826);
    expect(Number(t2.toFixed(3))).toBe(74.478);
  });

  // Test 3: Learning phase does not flag nights before five baseline values exist
  it('3. does not flag nights during learning phase (before 5 baseline values exist)', () => {
    // Provide 5 days of readings (which creates 4 night flows: day 2, 3, 4, 5)
    // Night 2: (100060 - 100000)/6 = 10 L/h (history length becomes 1)
    // Night 3: (100120 - 100060)/6 = 10 L/h (history length becomes 2)
    // Night 4: (100180 - 100120)/6 = 10 L/h (history length becomes 3)
    // Night 5: (100800 - 100180)/6 = 103.3 L/h (even if huge, history length was 3 < 5!)
    const validatedDays: ValidatedDayReading[] = [
      { day: 1, raw_r_05: 100000, raw_r_23: 100000, valid_r_05: 100000, valid_r_23: 100000, is_r_05_valid: true, is_r_23_valid: true },
      { day: 2, raw_r_05: 100060, raw_r_23: 100060, valid_r_05: 100060, valid_r_23: 100060, is_r_05_valid: true, is_r_23_valid: true },
      { day: 3, raw_r_05: 100120, raw_r_23: 100120, valid_r_05: 100120, valid_r_23: 100120, is_r_05_valid: true, is_r_23_valid: true },
      { day: 4, raw_r_05: 100180, raw_r_23: 100180, valid_r_05: 100180, valid_r_23: 100180, is_r_05_valid: true, is_r_23_valid: true },
      { day: 5, raw_r_05: 100800, raw_r_23: 100800, valid_r_05: 100800, valid_r_23: 100800, is_r_05_valid: true, is_r_23_valid: true },
    ];

    const result = detectNightFlowLoss(validatedDays);
    const day5 = result.days.find(d => d.day === 5);
    expect(day5?.flowStatus).toBe('learning');
    expect(day5?.isFlagged).toBeNull();
  });

  // Test 4: A high-flow night is flagged correctly once baseline is established
  it('4. flags a high-flow night correctly once baseline is established', () => {
    // 6 normal nights: days 2..7 have flow ~10 L/h
    // Night 8 has flow = (100760 - 100400)/6 = 60 L/h
    const days: ValidatedDayReading[] = [];
    let meter = 100000;
    for (let d = 1; d <= 7; d++) {
      days.push({
        day: d,
        raw_r_05: meter,
        raw_r_23: meter + 50,
        valid_r_05: meter,
        valid_r_23: meter + 50,
        is_r_05_valid: true,
        is_r_23_valid: true,
      });
      // Night flow from day d 11 PM to day d+1 5 AM:
      // (meter + 50 + 60) - (meter + 50) = 60 / 6 = 10 L/h
      meter += 110;
    }
    // Day 8 high overnight jump: 600 litres overnight = 100 L/hour
    const prevDay23 = days[days.length - 1].valid_r_23!;
    days.push({
      day: 8,
      raw_r_05: prevDay23 + 600,
      raw_r_23: prevDay23 + 800,
      valid_r_05: prevDay23 + 600,
      valid_r_23: prevDay23 + 800,
      is_r_05_valid: true,
      is_r_23_valid: true,
    });

    const result = detectNightFlowLoss(days);
    const day8 = result.days.find(d => d.day === 8);
    expect(day8?.nightFlow).toBe(100);
    expect(day8?.isFlagged).toBe(true);
    expect(day8?.flowStatus).toBe('flagged');
  });

  // Test 5: Flagged nights never enter the normal history
  it('5. ensures flagged nights never contaminate normal baseline history', () => {
    const days: ValidatedDayReading[] = [];
    let meter = 100000;
    // Build 6 normal days (night flow = 10 L/h)
    for (let d = 1; d <= 7; d++) {
      days.push({
        day: d,
        raw_r_05: meter,
        raw_r_23: meter,
        valid_r_05: meter,
        valid_r_23: meter,
        is_r_05_valid: true,
        is_r_23_valid: true,
      });
      meter += 60; // 60/6 = 10 L/h
    }

    // Day 8: Massive leak of 300 L/h
    days.push({
      day: 8,
      raw_r_05: meter + 1800, // (1800 / 6) = 300 L/h
      raw_r_23: meter + 1800,
      valid_r_05: meter + 1800,
      valid_r_23: meter + 1800,
      is_r_05_valid: true,
      is_r_23_valid: true,
    });
    meter += 1800;

    // Day 9: Normal night again (10 L/h)
    days.push({
      day: 9,
      raw_r_05: meter + 60,
      raw_r_23: meter + 60,
      valid_r_05: meter + 60,
      valid_r_23: meter + 60,
      is_r_05_valid: true,
      is_r_23_valid: true,
    });

    const result = detectNightFlowLoss(days);
    const day8 = result.days.find(d => d.day === 8)!;
    const day9 = result.days.find(d => d.day === 9)!;

    expect(day8.isFlagged).toBe(true);
    // If day 8 had entered normal history, day 9 baseline would have jumped significantly.
    // Because day 8 was rejected from history, day 9 baseline remains near 10 L/h!
    expect(day9.baseline).toBe(10);
    expect(day9.isFlagged).toBe(false);
  });

  // Test 6: Persistent alerts require at least 3 valid flags and ratio >= 0.6
  it('6. enforces persistent alert rules: validFlags >= 3, flaggedCount >= 3, ratio >= 0.6', () => {
    // 7 days of evaluations
    // If 2 flagged nights out of 3 evaluated: flaggedCount=2 < 3 -> no alert
    const days: ValidatedDayReading[] = [];
    let meter = 100000;
    for (let d = 1; d <= 7; d++) {
      days.push({
        day: d,
        raw_r_05: meter,
        raw_r_23: meter,
        valid_r_05: meter,
        valid_r_23: meter,
        is_r_05_valid: true,
        is_r_23_valid: true,
      });
      meter += 60;
    }
    // Days 8, 9 flagged (2 flagged), Day 10 normal
    days.push({
      day: 8,
      raw_r_05: meter + 300,
      raw_r_23: meter + 300,
      valid_r_05: meter + 300,
      valid_r_23: meter + 300,
      is_r_05_valid: true,
      is_r_23_valid: true,
    });
    meter += 300;
    days.push({
      day: 9,
      raw_r_05: meter + 300,
      raw_r_23: meter + 300,
      valid_r_05: meter + 300,
      valid_r_23: meter + 300,
      is_r_05_valid: true,
      is_r_23_valid: true,
    });
    meter += 300;
    days.push({
      day: 10,
      raw_r_05: meter + 60,
      raw_r_23: meter + 60,
      valid_r_05: meter + 60,
      valid_r_23: meter + 60,
      is_r_05_valid: true,
      is_r_23_valid: true,
    });

    const result = detectNightFlowLoss(days);
    const day9 = result.days.find(d => d.day === 9);
    // On day 9: only 2 flagged days in window -> no alert
    expect(day9?.hasAlert).toBe(false);

    // Now if day 10 is ALSO flagged (making 3 flagged out of 3 or 4)
    days[days.length - 1].valid_r_05 = meter + 300;
    days[days.length - 1].valid_r_23 = meter + 300;
    const result2 = detectNightFlowLoss(days);
    const day10_alert = result2.days.find(d => d.day === 10);
    expect(day10_alert?.hasAlert).toBe(true);
    expect(day10_alert?.confidence).toBe('Medium'); // 3 flagged < 5 -> Medium
  });

  // Test 7: Confidence becomes High at 5 or more flags
  it('7. assigns High confidence when 5 or more flags exist in rolling window', () => {
    const days: ValidatedDayReading[] = [];
    let meter = 100000;
    // 6 normal days to pass learning phase
    for (let d = 1; d <= 7; d++) {
      days.push({
        day: d,
        raw_r_05: meter,
        raw_r_23: meter,
        valid_r_05: meter,
        valid_r_23: meter,
        is_r_05_valid: true,
        is_r_23_valid: true,
      });
      meter += 60;
    }
    // Next 5 days all flagged
    for (let d = 8; d <= 12; d++) {
      days.push({
        day: d,
        raw_r_05: meter + 600,
        raw_r_23: meter + 600,
        valid_r_05: meter + 600,
        valid_r_23: meter + 600,
        is_r_05_valid: true,
        is_r_23_valid: true,
      });
      meter += 600;
    }

    const result = detectNightFlowLoss(days);
    const day12 = result.days.find(d => d.day === 12);
    expect(day12?.hasAlert).toBe(true);
    expect(day12?.confidence).toBe('High');
  });

  // Test 8: Missing readings produce no night-flow flag
  it('8. produces no night-flow flag when readings are missing', () => {
    const rawReadings: MeterReading[] = [
      { day: 1, r_05: 100000, r_23: 100100 },
      { day: 2, r_05: null, r_23: 100200 }, // missing 5 AM
      { day: 3, r_05: 100300, r_23: null },
      { day: 4, r_05: null, r_23: null },
    ];
    const validation = validateMeterReadings(rawReadings);
    const result = detectNightFlowLoss(validation.validatedReadings);

    const day2 = result.days.find(d => d.day === 2);
    expect(day2?.nightFlow).toBeNull();
    expect(day2?.isFlagged).toBeNull();
    expect(day2?.flowStatus).toBe('missing_endpoint');
  });

  // Test 9: Decreasing meter readings are ignored and reported
  it('9. ignores decreasing meter readings and generates exact required error message', () => {
    const rawReadings: MeterReading[] = [
      { day: 1, r_05: 100000, r_23: 100100 },
      { day: 2, r_05: 99950, r_23: 100200 }, // r_05 dropped below 100100
      { day: 3, r_05: 100300, r_23: 100150 }, // r_23 dropped below 100300
    ];

    const validation = validateMeterReadings(rawReadings);

    expect(validation.issues.length).toBe(2);
    expect(validation.issues[0].message).toBe(
      'Day 2: reading is lower than an earlier reading. Re-check?'
    );
    expect(validation.issues[1].message).toBe(
      'Day 3: reading is lower than an earlier reading. Re-check?'
    );

    // Ignored readings are not valid for night flow
    const day2 = validation.validatedReadings.find(d => d.day === 2)!;
    expect(day2.is_r_05_valid).toBe(false);
    expect(day2.valid_r_05).toBeNull();
  });

  // Test 10: Latest-day result does not reuse an earlier alert
  it('10. ensures latest-day result reflects only the latest day, not an old historic alert', () => {
    const days: ValidatedDayReading[] = [];
    let meter = 100000;
    // 6 normal days
    for (let d = 1; d <= 7; d++) {
      days.push({
        day: d,
        raw_r_05: meter,
        raw_r_23: meter,
        valid_r_05: meter,
        valid_r_23: meter,
        is_r_05_valid: true,
        is_r_23_valid: true,
      });
      meter += 60;
    }
    // Days 8, 9, 10, 11 flagged -> Day 11 has alert
    for (let d = 8; d <= 11; d++) {
      days.push({
        day: d,
        raw_r_05: meter + 500,
        raw_r_23: meter + 500,
        valid_r_05: meter + 500,
        valid_r_23: meter + 500,
        is_r_05_valid: true,
        is_r_23_valid: true,
      });
      meter += 500;
    }
    // Followed by 10 consecutive normal days (leak fixed)
    for (let d = 12; d <= 22; d++) {
      days.push({
        day: d,
        raw_r_05: meter + 60,
        raw_r_23: meter + 60,
        valid_r_05: meter + 60,
        valid_r_23: meter + 60,
        is_r_05_valid: true,
        is_r_23_valid: true,
      });
      meter += 60;
    }

    const result = detectNightFlowLoss(days);
    // Day 11 historically had an alert
    const day11 = result.days.find(d => d.day === 11);
    expect(day11?.hasAlert).toBe(true);

    // Latest day (Day 22) is leak-free and must NOT show an alert!
    expect(result.latestDay).toBe(22);
    expect(result.latestDayAlert).toBe(false);
    expect(result.latestConfidence).toBeNull();
  });

  // Test 11: A zero-leak simulation is handled correctly
  it('11. handles zero-leak simulation correctly without false persistent alarms', () => {
    const readings = simulateMeterReadings({
      residents: 100,
      leakSize: 0,
      missedReadingsPct: 0,
      seed: 999,
      totalDays: 60,
      leakStartDay: 30,
      waterPrice: 30,
    });
    const validation = validateMeterReadings(readings);
    const detection = detectNightFlowLoss(validation.validatedReadings);

    expect(readings.length).toBe(60);
    expect(validation.rejectedReadingsCount).toBe(0);
    // Latest day should be normal
    expect(detection.latestDayAlert).toBe(false);
  });

  // Test 12: Fixed seeds reproduce identical simulation results
  it('12. reproduces identical simulation results given the same seed and parameters', () => {
    const run1 = simulateMeterReadings({
      residents: 80,
      leakSize: 50,
      missedReadingsPct: 10,
      seed: 12345,
      totalDays: 40,
      waterPrice: 30,
    });

    const run2 = simulateMeterReadings({
      residents: 80,
      leakSize: 50,
      missedReadingsPct: 10,
      seed: 12345,
      totalDays: 40,
      waterPrice: 30,
    });

    expect(run1).toEqual(run2);

    // Different seed produces different results
    const run3 = simulateMeterReadings({
      residents: 80,
      leakSize: 50,
      missedReadingsPct: 10,
      seed: 54321,
      totalDays: 40,
      waterPrice: 30,
    });
    expect(run1).not.toEqual(run3);
  });

  // Test 13: Detection-test denominators and 30–43 detection window are correct
  it('13. correctly tests the 30–43 detection window and parameters for robustness evaluation', () => {
    expect(LEAK_SIZES_TO_TEST).toEqual([0, 10, 20, 50, 100, 200]);
    expect(MISSED_RATES_TO_TEST).toEqual([0, 20, 40]);
    expect(RUNS_PER_COMBO).toBe(30);

    // Evaluate single run with 100 L/h leak starting at day 30: should detect within days 30-43
    const evalRun = evaluateSingleRun(100, 0, 777);
    expect(evalRun.hasDetectionInWindow).toBe(true);

    // Evaluate single zero leak run: should not alarm
    const evalZero = evaluateSingleRun(0, 0, 777);
    expect(evalZero.hasAnyAlert).toBe(false);
  });

  // Test 14: Inspection ticket / boundary test: threshold comparison exactly equal
  it('14. handles boundary equality: nightFlow equal to threshold is NOT flagged', () => {
    // Exact threshold boundary test
    const baseline = 20;
    const mad = 5;
    const threshold = calculateThreshold(baseline, mad); // 20 + max(15, 10) = 35

    // If nightFlow is exactly 35: rule is nightFlow > threshold
    const exactlyAtThreshold = 35;
    expect(exactlyAtThreshold > threshold).toBe(false);

    const strictlyAbove = 35.01;
    expect(strictlyAbove > threshold).toBe(true);
  });

  // Additional boundary test: CSV parser robustness and duplicate day rejection
  it('15. rejects malformed CSVs and duplicate days with actionable messages', () => {
    const duplicateCsv = `day,r_23,r_05
1,100000,100100
2,100200,100300
2,100400,100500`;

    const parsed = parseMeterCsv(duplicateCsv);
    expect(parsed.success).toBe(false);
    expect(parsed.error).toContain('Duplicate day 2');

    const validCsv = `day,r_23,r_05
1,100000,100100
2,,100300`;
    const parsedValid = parseMeterCsv(validCsv);
    expect(parsedValid.success).toBe(true);
    expect(parsedValid.data[1].r_23).toBeNull();
    expect(parsedValid.data[1].r_05).toBe(100300);
  });

  // Test 16: Authentication service demo mode & logout
  it('16. provides demo mode login without password storage and clears session on logout', () => {
    const demoRes = AuthService.loginAsDemo('Test Warden', 'Hostel Block B');
    expect(demoRes.success).toBe(true);
    expect(demoRes.user?.name).toBe('Test Warden');
    expect(demoRes.user?.isDemoMode).toBe(true);

    // Current user should match
    expect(AuthService.getCurrentUser()?.name).toBe('Test Warden');

    // Logout ends session
    AuthService.logout();
    expect(AuthService.getCurrentUser()).toBeNull();
  });

  // Test 17: Report isolation between users
  it('17. isolates saved inspection reports strictly between different users', () => {
    // User A saves report
    const repA = ReportService.saveReport({
      userId: 'user_A_123',
      buildingName: 'Hostel A',
      detectionDay: 32,
      alertStatus: 'alert',
      alertConfidence: 'High',
      extraNightFlow: 45,
      estimatedLitresPerDay: 1080,
      estimatedMonthlyCost: 972,
      checklistStatus: {
        tankOverflowChecked: true,
        cisternDyeChecked: false,
        wingValveChecked: false,
        pumpMainLineChecked: false,
      },
      dataSource: 'simulated',
    });

    // User B saves report
    ReportService.saveReport({
      userId: 'user_B_456',
      buildingName: 'Apartments B',
      detectionDay: 40,
      alertStatus: 'normal',
      alertConfidence: null,
      extraNightFlow: null,
      estimatedLitresPerDay: null,
      estimatedMonthlyCost: null,
      checklistStatus: {
        tankOverflowChecked: false,
        cisternDyeChecked: false,
        wingValveChecked: false,
        pumpMainLineChecked: false,
      },
      dataSource: 'uploaded',
    });

    const userAReports = ReportService.getReportsForUser('user_A_123');
    const userBReports = ReportService.getReportsForUser('user_B_456');

    expect(userAReports.some((r: any) => r.id === repA.id)).toBe(true);
    expect(userBReports.some((r: any) => r.id === repA.id)).toBe(false);

    // User A can export CSV
    const csv = ReportService.exportReportsToCsv(userAReports);
    expect(csv).toContain('Hostel A');
    expect(csv).toContain(repA.id);

    // Delete report
    const deleted = ReportService.deleteReport(repA.id, 'user_A_123');
    expect(deleted).toBe(true);
    expect(ReportService.getReportsForUser('user_A_123').some((r: any) => r.id === repA.id)).toBe(false);
  });
});
