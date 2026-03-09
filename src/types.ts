import type { FilingStatus } from './utils/tax';
export type { FilingStatus };

export interface Break {
  id: string;
  startTime: number; // unix ms
  endTime: number | null; // null if break is ongoing
}

export interface Shift {
  id: string;
  jobId: string;
  startTime: number; // unix ms
  endTime: number | null; // null if shift is active
  breaks: Break[];
  hourlyRate: number; // per-shift override; falls back to job rate
  notes: string;
}

export interface Job {
  id: string;
  name: string;
  hourlyRate: number;
  currency: string;
  overtimeEnabled: boolean;
  dailyOvertimeAfter: number;  // hours e.g. 8
  weeklyOvertimeAfter: number; // hours e.g. 40
  overtimeMultiplier: number;  // e.g. 1.5
  // Real IRS tax fields (replaces flat taxPercent)
  filingStatus: FilingStatus;
  state: string; // 2-letter US state code e.g. "TX"
  taxPercent?: number; // legacy fallback — kept so old data still loads
  color: string;
  reminderClockIn: string | null;
  reminderClockOut: string | null;
}

export interface AppSettings {
  activeJobId: string;
  theme: 'midnight' | 'forest' | 'velvet';
}

export interface PayResult {
  regularHours: number;
  overtimeHours: number;
  grossPay: number;
  netPay: number;
  totalHours: number;
  totalBreakMinutes: number;
  // Full tax breakdown
  federalTax: number;
  stateTax: number;
  socialSecurity: number;
  medicare: number;
  effectiveRate: number;
}
