/**
 * Deterministic Demo Simulator for AquaAudit
 *
 * Implements a seeded pseudo-random generator, normal distribution sampling,
 * and realistic hourly water consumption modeling with planted leaks.
 */

import { MeterReading, SimulationConfig } from '../types.ts';

export const DEFAULT_HOURLY_PROFILE = [
  0.03, 0.02, 0.02, 0.02, 0.04, 1, 3, 4,
  3, 2, 1.5, 1.5, 2, 1.5, 1, 1,
  1.5, 2.5, 3.5, 3.5, 3, 2, 1, 0.3
];

const HOURLY_PROFILE_SUM = DEFAULT_HOURLY_PROFILE.reduce((acc, val) => acc + val, 0);

/**
 * Seeded 32-bit PRNG (Mulberry32) + Box-Muller Gaussian generator
 * Completely deterministic and self-contained.
 */
export class SeededRandom {
  private s: number;
  private hasSpare = false;
  private spare = 0;

  constructor(seed: number) {
    this.s = Math.floor(Math.abs(seed)) >>> 0 || 123456789;
  }

  /**
   * Generates a uniform random float in [0, 1)
   */
  next(): number {
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Generates standard normal variable N(0, 1) via Box-Muller transform
   */
  nextGaussian(): number {
    if (this.hasSpare) {
      this.hasSpare = false;
      return this.spare;
    }
    let u = 0;
    let v = 0;
    while (u <= 0.0000001) u = this.next();
    while (v <= 0.0000001) v = this.next();

    const r = Math.sqrt(-2.0 * Math.log(u));
    const theta = 2.0 * Math.PI * v;
    this.spare = r * Math.sin(theta);
    this.hasSpare = true;
    return r * Math.cos(theta);
  }

  /**
   * Generates normal variable with specified mean and standard deviation
   */
  randomNormal(mean: number, stdDev: number): number {
    return mean + this.nextGaussian() * stdDev;
  }
}

/**
 * Simulates meter readings for AquaAudit.
 *
 * Timeline modeling:
 * Day 1 begins at 00:00 with initial meter at 100,000 L.
 * Hours 0..4 (00:00 - 05:00) run, then r_05[1] is sampled at 5:00 AM.
 * Hours 5..22 (05:00 - 23:00) run, then r_23[1] is sampled at 11:00 PM.
 * Hour 23 (23:00 - 24:00) of day 1 + hours 0..4 of day 2 run, then r_05[2] is sampled at 5:00 AM.
 * Night flow between day 1 23:00 and day 2 05:00 is (r_05[2] - r_23[1]) / 6 hours.
 */
export function simulateMeterReadings(config: SimulationConfig): MeterReading[] {
  const {
    residents = 100,
    leakSize = 0,
    missedReadingsPct = 0,
    seed = 42,
    totalDays = 60,
    leakStartDay = 30,
    initialMeterLitres = 100000,
  } = config;

  const rng = new SeededRandom(seed);
  const missedProb = Math.max(0, Math.min(0.5, missedReadingsPct / 100));

  let currentMeter = initialMeterLitres;
  const readings: MeterReading[] = [];

  for (let day = 1; day <= totalDays; day++) {
    // Weekend definition: day % 7 === 5 || day % 7 === 6
    const isWeekend = day % 7 === 5 || day % 7 === 6;
    const dailyMean = isWeekend ? 1.05 : 1.0;

    // Daily water use: residents * 135 * randomNormal(mean, 0.08)
    const dailyMultiplier = Math.max(0.1, rng.randomNormal(dailyMean, 0.08));
    const dailyUse = Math.max(0, residents * 135 * dailyMultiplier);

    const isLeakActive = day >= leakStartDay && leakSize > 0;

    // Hours 0..4 (00:00 - 05:00) on day d
    for (let h = 0; h < 5; h++) {
      const baseHourly = (dailyUse * DEFAULT_HOURLY_PROFILE[h]) / HOURLY_PROFILE_SUM;
      const hourlyMultiplier = Math.max(0.01, rng.randomNormal(1.0, 0.15));
      let hourUse = baseHourly * hourlyMultiplier;
      if (isLeakActive) {
        hourUse += leakSize;
      }
      currentMeter += Math.max(0, hourUse);
    }

    // 5 AM reading (r_05) on day d
    const raw_r_05 = Math.floor(currentMeter / 10) * 10;
    const drop_05 = rng.next() < missedProb;
    const r_05 = drop_05 ? null : raw_r_05;

    // Hours 5..22 (05:00 - 23:00) on day d
    for (let h = 5; h < 23; h++) {
      const baseHourly = (dailyUse * DEFAULT_HOURLY_PROFILE[h]) / HOURLY_PROFILE_SUM;
      const hourlyMultiplier = Math.max(0.01, rng.randomNormal(1.0, 0.15));
      let hourUse = baseHourly * hourlyMultiplier;
      if (isLeakActive) {
        hourUse += leakSize;
      }
      currentMeter += Math.max(0, hourUse);
    }

    // 11 PM reading (r_23) on day d
    const raw_r_23 = Math.floor(currentMeter / 10) * 10;
    const drop_23 = rng.next() < missedProb;
    const r_23 = drop_23 ? null : raw_r_23;

    readings.push({
      day,
      r_05,
      r_23,
    });

    // Hour 23 (23:00 - 00:00) of day d: contributes to overnight flow before next day 05:00
    const baseHour23 = (dailyUse * DEFAULT_HOURLY_PROFILE[23]) / HOURLY_PROFILE_SUM;
    const hour23Multiplier = Math.max(0.01, rng.randomNormal(1.0, 0.15));
    let hour23Use = baseHour23 * hour23Multiplier;
    if (isLeakActive) {
      hour23Use += leakSize;
    }
    currentMeter += Math.max(0, hour23Use);
  }

  return readings;
}
