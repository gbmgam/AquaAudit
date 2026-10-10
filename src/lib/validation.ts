/**
 * Meter Reading Validation and CSV Parser for AquaAudit
 *
 * Implements strict monotonic nondecreasing validation and robust browser-based CSV parsing.
 */

import { MeterReading, ValidatedDayReading, ValidationIssue, ValidationResult } from '../types.ts';

/**
 * Validates meter readings chronologically (r_05 then r_23 for each day).
 * Any reading lower than the most recent valid reading is flagged and ignored.
 */
export function validateMeterReadings(readings: MeterReading[]): ValidationResult {
  // Sort chronologically by day
  const sorted = [...readings].sort((a, b) => a.day - b.day);

  let lastValidReading: number | null = null;
  const issues: ValidationIssue[] = [];
  const validatedReadings: ValidatedDayReading[] = [];

  let missingCount = 0;
  let rejectedCount = 0;

  for (const r of sorted) {
    let valid_r_05: number | null = null;
    let is_r_05_valid = false;

    // Check r_05 (5 AM reading)
    if (r.r_05 === null || r.r_05 === undefined) {
      missingCount++;
    } else {
      if (lastValidReading !== null && r.r_05 < lastValidReading) {
        // Decreasing reading detected
        issues.push({
          day: r.day,
          readingType: 'r_05',
          value: r.r_05,
          lastValidValue: lastValidReading,
          message: `Day ${r.day}: reading is lower than an earlier reading. Re-check?`,
        });
        rejectedCount++;
        // Ignore this reading: do not update lastValidReading
      } else {
        valid_r_05 = r.r_05;
        is_r_05_valid = true;
        lastValidReading = r.r_05;
      }
    }

    // Check r_23 (11 PM reading)
    let valid_r_23: number | null = null;
    let is_r_23_valid = false;

    if (r.r_23 === null || r.r_23 === undefined) {
      missingCount++;
    } else {
      if (lastValidReading !== null && r.r_23 < lastValidReading) {
        // Decreasing reading detected
        issues.push({
          day: r.day,
          readingType: 'r_23',
          value: r.r_23,
          lastValidValue: lastValidReading,
          message: `Day ${r.day}: reading is lower than an earlier reading. Re-check?`,
        });
        rejectedCount++;
        // Ignore this reading: do not update lastValidReading
      } else {
        valid_r_23 = r.r_23;
        is_r_23_valid = true;
        lastValidReading = r.r_23;
      }
    }

    validatedReadings.push({
      day: r.day,
      raw_r_05: r.r_05,
      raw_r_23: r.r_23,
      valid_r_05,
      valid_r_23,
      is_r_05_valid,
      is_r_23_valid,
    });
  }

  return {
    validatedReadings,
    issues,
    totalRows: readings.length,
    missingReadingsCount: missingCount,
    rejectedReadingsCount: rejectedCount,
  };
}

export interface CsvParseResult {
  success: boolean;
  data: MeterReading[];
  error?: string;
  rowCount: number;
  emptyReadingsCount: number;
}

/**
 * Parses CSV text strictly in the browser.
 * Expected headers: day, r_23, r_05 (in any column order, case-insensitive).
 * Empty cells are treated as null (missing readings).
 * Rejects malformed rows and duplicate days.
 */
export function parseMeterCsv(csvText: string): CsvParseResult {
  const trimmed = csvText.trim();
  if (!trimmed) {
    return {
      success: false,
      data: [],
      error: 'CSV file is empty. Please provide meter reading rows.',
      rowCount: 0,
      emptyReadingsCount: 0,
    };
  }

  // Split lines while handling both \r\n and \n
  const lines = trimmed.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) {
    return {
      success: false,
      data: [],
      error: 'CSV must contain at least a header row and one data row.',
      rowCount: 0,
      emptyReadingsCount: 0,
    };
  }

  // Parse header
  const headerLine = lines[0];
  const headers = headerLine.split(',').map(h => h.trim().toLowerCase().replace(/^["']|["']$/g, ''));

  const dayIdx = headers.indexOf('day');
  const r23Idx = headers.indexOf('r_23');
  const r05Idx = headers.indexOf('r_05');

  if (dayIdx === -1 || r23Idx === -1 || r05Idx === -1) {
    return {
      success: false,
      data: [],
      error: `Missing required header columns. Expected "day", "r_23", "r_05". Found: [${headers.join(', ')}]`,
      rowCount: 0,
      emptyReadingsCount: 0,
    };
  }

  const seenDays = new Set<number>();
  const readings: MeterReading[] = [];
  let emptyReadingsCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i].trim();
    if (!line) continue;

    // Simple robust comma splitter taking quotes into account
    const tokens: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        tokens.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    tokens.push(current.trim());

    if (tokens.length < Math.max(dayIdx, r23Idx, r05Idx) + 1) {
      return {
        success: false,
        data: [],
        error: `Row ${lineNum} is malformed: expected at least ${headers.length} columns, found ${tokens.length}.`,
        rowCount: 0,
        emptyReadingsCount: 0,
      };
    }

    const dayStr = tokens[dayIdx].replace(/^["']|["']$/g, '').trim();
    const dayVal = Number(dayStr);
    if (!dayStr || isNaN(dayVal) || !Number.isInteger(dayVal) || dayVal <= 0) {
      return {
        success: false,
        data: [],
        error: `Row ${lineNum}: "day" must be a positive integer (found "${dayStr}").`,
        rowCount: 0,
        emptyReadingsCount: 0,
      };
    }

    if (seenDays.has(dayVal)) {
      return {
        success: false,
        data: [],
        error: `Duplicate day ${dayVal} found at row ${lineNum}. Each day must appear only once.`,
        rowCount: 0,
        emptyReadingsCount: 0,
      };
    }
    seenDays.add(dayVal);

    // Parse r_23
    const r23Str = tokens[r23Idx].replace(/^["']|["']$/g, '').trim();
    let r_23: number | null = null;
    if (r23Str === '') {
      emptyReadingsCount++;
    } else {
      const parsed = Number(r23Str);
      if (isNaN(parsed) || parsed < 0) {
        return {
          success: false,
          data: [],
          error: `Row ${lineNum}: "r_23" must be a nonnegative number or blank (found "${r23Str}").`,
          rowCount: 0,
          emptyReadingsCount: 0,
        };
      }
      r_23 = parsed;
    }

    // Parse r_05
    const r05Str = tokens[r05Idx].replace(/^["']|["']$/g, '').trim();
    let r_05: number | null = null;
    if (r05Str === '') {
      emptyReadingsCount++;
    } else {
      const parsed = Number(r05Str);
      if (isNaN(parsed) || parsed < 0) {
        return {
          success: false,
          data: [],
          error: `Row ${lineNum}: "r_05" must be a nonnegative number or blank (found "${r05Str}").`,
          rowCount: 0,
          emptyReadingsCount: 0,
        };
      }
      r_05 = parsed;
    }

    readings.push({
      day: dayVal,
      r_23,
      r_05,
    });
  }

  // Sort chronologically by day
  readings.sort((a, b) => a.day - b.day);

  return {
    success: true,
    data: readings,
    rowCount: readings.length,
    emptyReadingsCount,
  };
}
