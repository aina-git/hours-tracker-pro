import type { Shift, Job, PayResult } from '../types';

export function calcShiftPay(shift: Shift, job: Job): PayResult {
  const rate = shift.hourlyRate ?? job.hourlyRate;

  // Total break duration in ms
  const breakMs = shift.breaks.reduce((acc, b) => {
    const end = b.endTime ?? Date.now();
    return acc + (end - b.startTime);
  }, 0);

  const endMs = shift.endTime ?? Date.now();
  const totalMs = Math.max(0, endMs - shift.startTime - breakMs);
  const totalHours = totalMs / 3_600_000;

  let regularHours = totalHours;
  let overtimeHours = 0;

  if (job.overtimeEnabled && totalHours > job.dailyOvertimeAfter) {
    regularHours = job.dailyOvertimeAfter;
    overtimeHours = totalHours - job.dailyOvertimeAfter;
  }

  const grossPay = regularHours * rate + overtimeHours * rate * job.overtimeMultiplier;
  const netPay = grossPay * (1 - job.taxPercent / 100);

  return {
    regularHours,
    overtimeHours,
    grossPay,
    netPay,
    totalHours,
    totalBreakMinutes: breakMs / 60_000,
  };
}

export function calcWeeklyPay(
  shifts: Shift[],
  job: Job,
): { grossPay: number; netPay: number; totalHours: number; overtimeHours: number } {
  let totalRegularHours = 0;
  let totalHours = 0;

  shifts.forEach((s) => {
    const r = calcShiftPay(s, job);
    totalHours += r.totalHours;
    totalRegularHours += r.regularHours;
  });

  let regularHours = totalHours;
  let overtimeHours = 0;

  if (job.overtimeEnabled && totalHours > job.weeklyOvertimeAfter) {
    regularHours = job.weeklyOvertimeAfter;
    overtimeHours = totalHours - job.weeklyOvertimeAfter;
  }

  const grossPay = regularHours * job.hourlyRate + overtimeHours * job.hourlyRate * job.overtimeMultiplier;
  const netPay = grossPay * (1 - job.taxPercent / 100);

  return { grossPay, netPay, totalHours, overtimeHours };
}

export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
