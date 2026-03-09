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
  hourlyRate: number; // override for this shift; falls back to job rate
  notes: string;
}

export interface Job {
  id: string;
  name: string;
  hourlyRate: number;
  currency: string;
  overtimeEnabled: boolean;
  dailyOvertimeAfter: number; // hours, e.g. 8
  weeklyOvertimeAfter: number; // hours, e.g. 40
  overtimeMultiplier: number; // e.g. 1.5
  taxPercent: number; // e.g. 22
  color: string; // hex color for the job badge
  reminderClockIn: string | null; // "HH:MM" or null
  reminderClockOut: string | null; // "HH:MM" or null
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
}
