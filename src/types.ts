/**
 * Core type definitions for AquaAudit
 */

export interface MeterReading {
  day: number;
  r_23: number | null; // 11 PM reading
  r_05: number | null; // 5 AM reading
}

export interface ValidationIssue {
  day: number;
  readingType: 'r_05' | 'r_23';
  value: number;
  lastValidValue: number;
  message: string;
}

export interface ValidatedDayReading {
  day: number;
  raw_r_05: number | null;
  raw_r_23: number | null;
  valid_r_05: number | null;
  valid_r_23: number | null;
  is_r_05_valid: boolean;
  is_r_23_valid: boolean;
}

export interface ValidationResult {
  validatedReadings: ValidatedDayReading[];
  issues: ValidationIssue[];
  totalRows: number;
  missingReadingsCount: number;
  rejectedReadingsCount: number;
}

export type AlertConfidence = 'High' | 'Medium';

export interface DayAnalysis {
  day: number;
  // Raw and validated meter readings
  raw_r_05: number | null;
  raw_r_23: number | null;
  valid_r_05: number | null;
  valid_r_23: number | null;
  
  // Overnight flow: (r_05[day] - r_23[day - 1]) / 6
  nightFlow: number | null;
  
  // Baseline stats at the time of evaluation
  baseline: number | null;
  mad: number | null;
  threshold: number | null;
  
  // Individual night flag status: true (flagged leak), false (normal), null (learning phase or missing flow)
  isFlagged: boolean | null;
  
  // Status explanation
  flowStatus: 'learning' | 'normal' | 'flagged' | 'missing_endpoint';
  
  // 7-day rolling window alert status
  hasAlert: boolean;
  confidence: AlertConfidence | null;
  windowValidFlags: number;
  windowFlaggedCount: number;
}

export interface DetectionSummary {
  days: DayAnalysis[];
  latestDayAlert: boolean;
  latestConfidence: AlertConfidence | null;
  latestDay: number;
  extraNightFlow: number | null; // L/hour median over last 7 flagged nights
  estimatedLitresPerDay: number | null; // extraNightFlow * 24
  estimatedMonthlyCost: number | null; // estimatedLitresPerDay * 30 / 1000 * waterPrice
  totalFlaggedDays: number;
  usableFlaggedNightsCount: number;
}

export interface SimulationConfig {
  residents: number;
  leakSize: number; // L/hour, starts on day 30
  missedReadingsPct: number; // 0 to 50%
  waterPrice: number; // Rs per 1000 litres, default 30
  seed: number;
  totalDays?: number; // default 60
  leakStartDay?: number; // default 30
  initialMeterLitres?: number; // default 100000
}

export interface RobustnessTestRow {
  leakSize: number;
  missedReadingsPct: number;
  runsCount: number;
  successfulDetections: number; // out of 30 (for leak > 0 in days 30-43)
  detectionRatePct: number | null; // null if leak === 0
  falseAlarms: number; // out of 30 (for leak === 0 any alert across 60 days)
  falseAlarmRatePct: number | null; // null if leak > 0
}

// ---------------------------------------------------------------------------
// Authentication & User Models
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  name: string;
  email: string;
  buildingName: string;
  isDemoMode: boolean;
  createdAt: string;
}

export interface BuildingSettings {
  userName: string;
  buildingName: string;
  residents: number;
  waterPrice: number;
  currency: string;
  defaultDataSource: 'demo' | 'csv';
  notifyEmailAlerts: boolean;
  notifyWeeklySummary: boolean;
}

// ---------------------------------------------------------------------------
// Report Model
// ---------------------------------------------------------------------------

export interface SavedReport {
  id: string;
  createdAt: string; // ISO date string
  buildingName: string;
  detectionDay: number;
  alertStatus: 'alert' | 'normal';
  alertConfidence: AlertConfidence | null;
  extraNightFlow: number | null;
  estimatedLitresPerDay: number | null;
  estimatedMonthlyCost: number | null;
  checklistStatus: {
    tankOverflowChecked: boolean;
    cisternDyeChecked: boolean;
    wingValveChecked: boolean;
    pumpMainLineChecked: boolean;
  };
  dataSource: 'simulated' | 'uploaded';
  userId: string;
  notes?: string;
}

export type NavigationTab =
  | 'dashboard'
  | 'data'
  | 'results'
  | 'tickets'
  | 'reports'
  | 'settings'
  | 'help';
