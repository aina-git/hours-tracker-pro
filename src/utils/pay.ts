import type { Shift, Job, PayResult } from '../types';
import { calcFederalTax, calcFICA, calcStateTax } from './tax';
import type { FilingStatus } from './tax';


/** Scale a gross amount to net using real IRS brackets + FICA + state tax */
function netFromGross(gross: number, filing: FilingStatus, state: string): {
  netPay: number;
  federalTax: number;
  stateTax: number;
  socialSecurity: number;
  medicare: number;
  effectiveRate: number;
} {
  if (gross <= 0) {
    return { netPay: 0, federalTax: 0, stateTax: 0, socialSecurity: 0, medicare: 0, effectiveRate: 0 };
  }
  // Annualise to get accurate bracket placement
  // Treat gross as if earned in one year for bracket purposes (weekly pay period)
  const annualEquiv = gross * 52;

  const fedAnnual = calcFederalTax(annualEquiv, filing);
  const stateAnnual = calcStateTax(annualEquiv, state);
  const { socialSecurity: ssAnnual, medicare: medAnnual } = calcFICA(annualEquiv);

  const totalTaxAnnual = fedAnnual + stateAnnual + ssAnnual + medAnnual;
  const effectiveRate = totalTaxAnnual / annualEquiv;

  // Apply effective rate to actual gross
  const federalTax = gross * (fedAnnual / annualEquiv);
  const stateTax = gross * (stateAnnual / annualEquiv);
  const socialSecurity = gross * (ssAnnual / annualEquiv);
  const medicare = gross * (medAnnual / annualEquiv);
  const netPay = gross - federalTax - stateTax - socialSecurity - medicare;

  return { netPay, federalTax, stateTax, socialSecurity, medicare, effectiveRate };
}

export function calcShiftPay(shift: Shift, job: Job): PayResult {
  const rate = shift.hourlyRate ?? job.hourlyRate;

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

  const filing: FilingStatus = job.filingStatus ?? 'single';
  const state: string = job.state ?? 'TX';

  const tax = netFromGross(grossPay, filing, state);

  return {
    regularHours,
    overtimeHours,
    grossPay,
    netPay: tax.netPay,
    totalHours,
    totalBreakMinutes: breakMs / 60_000,
    federalTax: tax.federalTax,
    stateTax: tax.stateTax,
    socialSecurity: tax.socialSecurity,
    medicare: tax.medicare,
    effectiveRate: tax.effectiveRate,
  };
}

export function calcWeeklyPay(
  shifts: Shift[],
  job: Job,
): { grossPay: number; netPay: number; totalHours: number; overtimeHours: number; effectiveRate: number } {
  let totalHours = 0;

  shifts.forEach((s) => {
    const r = calcShiftPay(s, job);
    totalHours += r.totalHours;
  });

  let regularHours = totalHours;
  let overtimeHours = 0;

  if (job.overtimeEnabled && totalHours > job.weeklyOvertimeAfter) {
    regularHours = job.weeklyOvertimeAfter;
    overtimeHours = totalHours - job.weeklyOvertimeAfter;
  }

  const grossPay = regularHours * job.hourlyRate + overtimeHours * job.hourlyRate * job.overtimeMultiplier;

  const filing: FilingStatus = job.filingStatus ?? 'single';
  const state: string = job.state ?? 'TX';
  const tax = netFromGross(grossPay, filing, state);

  return { grossPay, netPay: tax.netPay, totalHours, overtimeHours, effectiveRate: tax.effectiveRate };
}

export function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

export function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0 && m === 0) return '0m';
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
