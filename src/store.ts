import type { Job, Shift, AppSettings, Break } from './types';

// ─── Keys ────────────────────────────────────────────────────────────────────
const JOBS_KEY = 'ht_jobs';
const SHIFTS_KEY = 'ht_shifts';
const SETTINGS_KEY = 'ht_settings';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ─── Default data ─────────────────────────────────────────────────────────────
const defaultJob: Job = {
  id: 'default',
  name: 'My Job',
  hourlyRate: 15,
  currency: 'USD',
  overtimeEnabled: true,
  dailyOvertimeAfter: 8,
  weeklyOvertimeAfter: 40,
  overtimeMultiplier: 1.5,
  taxPercent: 22,
  color: '#6366f1',
  reminderClockIn: null,
  reminderClockOut: null,
};

const defaultSettings: AppSettings = {
  activeJobId: 'default',
  theme: 'midnight',
};

// ─── Jobs ─────────────────────────────────────────────────────────────────────
export function getJobs(): Job[] {
  const jobs = load<Job[]>(JOBS_KEY, []);
  if (jobs.length === 0) {
    const initial = [defaultJob];
    save(JOBS_KEY, initial);
    return initial;
  }
  return jobs;
}

export function saveJob(job: Job): void {
  const jobs = getJobs();
  const idx = jobs.findIndex((j) => j.id === job.id);
  if (idx >= 0) jobs[idx] = job;
  else jobs.push(job);
  save(JOBS_KEY, jobs);
}

export function createJob(partial: Omit<Job, 'id'>): Job {
  const job: Job = { ...partial, id: uid() };
  const jobs = getJobs();
  jobs.push(job);
  save(JOBS_KEY, jobs);
  return job;
}

export function deleteJob(id: string): void {
  const jobs = getJobs().filter((j) => j.id !== id);
  save(JOBS_KEY, jobs);
}

// ─── Shifts ───────────────────────────────────────────────────────────────────
export function getShifts(): Shift[] {
  return load<Shift[]>(SHIFTS_KEY, []);
}

export function saveShift(shift: Shift): void {
  const shifts = getShifts();
  const idx = shifts.findIndex((s) => s.id === shift.id);
  if (idx >= 0) shifts[idx] = shift;
  else shifts.push(shift);
  save(SHIFTS_KEY, shifts);
}

export function deleteShift(id: string): void {
  const shifts = getShifts().filter((s) => s.id !== id);
  save(SHIFTS_KEY, shifts);
}

export function getActiveShift(): Shift | null {
  return getShifts().find((s) => s.endTime === null) ?? null;
}

export function clockIn(jobId: string, hourlyRate: number): Shift {
  const shift: Shift = {
    id: uid(),
    jobId,
    startTime: Date.now(),
    endTime: null,
    breaks: [],
    hourlyRate,
    notes: '',
  };
  saveShift(shift);
  return shift;
}

export function clockOut(shiftId: string): Shift {
  const shifts = getShifts();
  const shift = shifts.find((s) => s.id === shiftId)!;
  // end any open break first
  const openBreak = shift.breaks.find((b) => b.endTime === null);
  if (openBreak) openBreak.endTime = Date.now();
  shift.endTime = Date.now();
  saveShift(shift);
  return shift;
}

export function startBreak(shiftId: string): Break {
  const shifts = getShifts();
  const shift = shifts.find((s) => s.id === shiftId)!;
  const brk: Break = { id: uid(), startTime: Date.now(), endTime: null };
  shift.breaks.push(brk);
  saveShift(shift);
  return brk;
}

export function endBreak(shiftId: string): void {
  const shifts = getShifts();
  const shift = shifts.find((s) => s.id === shiftId)!;
  const brk = shift.breaks.find((b) => b.endTime === null);
  if (brk) brk.endTime = Date.now();
  saveShift(shift);
}

export function updateShift(shift: Shift): void {
  saveShift(shift);
}

// ─── Settings ─────────────────────────────────────────────────────────────────
export function getSettings(): AppSettings {
  return load<AppSettings>(SETTINGS_KEY, defaultSettings);
}

export function saveSettings(s: AppSettings): void {
  save(SETTINGS_KEY, s);
}
