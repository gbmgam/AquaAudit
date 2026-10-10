/**
 * Report Management & Export Service for AquaAudit
 *
 * Handles saving, retrieving, filtering, CSV export, and deletion of inspection reports.
 * Enforces per-user report isolation.
 */

import { SavedReport } from '../types.ts';

const REPORTS_STORAGE_KEY = 'aquaaudit_saved_reports';

export class ReportService {
  private static inMemoryStore: SavedReport[] = [];

  /**
   * Retrieves all reports from storage or in-memory fallback
   */
  private static getAllStoredReports(): SavedReport[] {
    try {
      if (typeof localStorage !== 'undefined' && localStorage.getItem) {
        const data = localStorage.getItem(REPORTS_STORAGE_KEY);
        if (data) {
          return JSON.parse(data) as SavedReport[];
        }
      }
    } catch {
      // Ignore
    }
    return this.inMemoryStore;
  }

  /**
   * Saves updated reports array to storage and in-memory fallback
   */
  private static saveStoredReports(reports: SavedReport[]): void {
    this.inMemoryStore = [...reports];
    try {
      if (typeof localStorage !== 'undefined' && localStorage.setItem) {
        localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(reports));
      }
    } catch {
      // Storage quota or blocked
    }
  }

  /**
   * Returns reports isolated for a specific user ID
   */
  static getReportsForUser(userId: string): SavedReport[] {
    const all = this.getAllStoredReports();
    return all
      .filter(r => r.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  private static reportCounter = 1;

  /**
   * Saves a new inspection report
   */
  static saveReport(reportData: Omit<SavedReport, 'id' | 'createdAt'>): SavedReport {
    const all = this.getAllStoredReports();
    const count = this.reportCounter++;
    const newReport: SavedReport = {
      ...reportData,
      id: `REP-${Date.now().toString().slice(-5)}-${count}`,
      createdAt: new Date().toISOString(),
    };

    all.unshift(newReport);
    this.saveStoredReports(all);
    return newReport;
  }

  /**
   * Deletes a report by ID
   */
  static deleteReport(reportId: string, userId: string): boolean {
    const all = this.getAllStoredReports();
    const filtered = all.filter(r => !(r.id === reportId && r.userId === userId));
    if (filtered.length !== all.length) {
      this.saveStoredReports(filtered);
      return true;
    }
    return false;
  }

  /**
   * Exports an array of reports into a clean CSV string
   */
  static exportReportsToCsv(reports: SavedReport[]): string {
    const headers = [
      'Report ID',
      'Created Date',
      'Building Name',
      'Detection Day',
      'Alert Status',
      'Confidence',
      'Extra Night Flow (L/h)',
      'Estimated Daily Loss (L/day)',
      'Estimated Monthly Cost (INR)',
      'Data Source',
      'Tank Overflow Checked',
      'Cistern Dye Checked',
      'Wing Valve Checked',
      'Pump Line Checked',
    ];

    const rows = reports.map(r => [
      r.id,
      new Date(r.createdAt).toLocaleDateString(),
      `"${r.buildingName.replace(/"/g, '""')}"`,
      r.detectionDay,
      r.alertStatus === 'alert' ? 'Suspected Water Loss' : 'Normal Baseline',
      r.alertConfidence || 'N/A',
      r.extraNightFlow !== null ? r.extraNightFlow.toFixed(1) : 'N/A',
      r.estimatedLitresPerDay !== null ? Math.round(r.estimatedLitresPerDay) : 'N/A',
      r.estimatedMonthlyCost !== null ? Math.round(r.estimatedMonthlyCost) : 'N/A',
      r.dataSource,
      r.checklistStatus.tankOverflowChecked ? 'Yes' : 'No',
      r.checklistStatus.cisternDyeChecked ? 'Yes' : 'No',
      r.checklistStatus.wingValveChecked ? 'Yes' : 'No',
      r.checklistStatus.pumpMainLineChecked ? 'Yes' : 'No',
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  /**
   * Generates a sample demo report for onboarding illustration if none exist
   */
  static seedInitialReportIfEmpty(userId: string, buildingName: string): void {
    const existing = this.getReportsForUser(userId);
    if (existing.length === 0) {
      this.saveReport({
        userId,
        buildingName,
        detectionDay: 35,
        alertStatus: 'alert',
        alertConfidence: 'High',
        extraNightFlow: 58.3,
        estimatedLitresPerDay: 1399,
        estimatedMonthlyCost: 1259,
        checklistStatus: {
          tankOverflowChecked: true,
          cisternDyeChecked: true,
          wingValveChecked: false,
          pumpMainLineChecked: false,
        },
        dataSource: 'simulated',
        notes: 'Initial inspection generated during hostel onboarding audit.',
      });
    }
  }
}
