/**
 * Cloud sync layer — wraps every localStorage read/write with a Supabase mirror.
 * Falls back to localStorage-only if Supabase is not configured.
 *
 * USER KEY: A short passphrase stored in localStorage that namespaces all of a
 * user's data in the DB. The user enters it once on each new device.
 */
import { supabase, isSyncEnabled } from './supabase';
import type { Shift, Job } from '../types';

const USER_KEY_STORAGE = 'ht_user_key';

// ─── User key ────────────────────────────────────────────────────────────────

export function getUserKey(): string | null {
  return localStorage.getItem(USER_KEY_STORAGE);
}

export function setUserKey(key: string): void {
  localStorage.setItem(USER_KEY_STORAGE, key.trim().toLowerCase());
}

export function clearUserKey(): void {
  localStorage.removeItem(USER_KEY_STORAGE);
}

// ─── Shifts ──────────────────────────────────────────────────────────────────

export async function syncPushShift(shift: Shift): Promise<void> {
  if (!isSyncEnabled || !supabase) return;
  const userKey = getUserKey();
  if (!userKey) return;

  await supabase.from('shifts').upsert({
    id: shift.id,
    user_key: userKey,
    job_id: shift.jobId,
    start_time: shift.startTime,
    end_time: shift.endTime ?? null,
    hourly_rate: shift.hourlyRate ?? null,
    notes: shift.notes ?? '',
    breaks: shift.breaks,
  });
}

export async function syncDeleteShift(id: string): Promise<void> {
  if (!isSyncEnabled || !supabase) return;
  const userKey = getUserKey();
  if (!userKey) return;
  await supabase.from('shifts').delete().eq('id', id).eq('user_key', userKey);
}

export async function syncPullShifts(): Promise<Shift[] | null> {
  if (!isSyncEnabled || !supabase) return null;
  const userKey = getUserKey();
  if (!userKey) return null;

  const { data, error } = await supabase
    .from('shifts')
    .select('*')
    .eq('user_key', userKey)
    .order('start_time', { ascending: false });

  if (error || !data) return null;

  return data.map((r) => ({
    id: r.id,
    jobId: r.job_id,
    startTime: Number(r.start_time),
    endTime: r.end_time ? Number(r.end_time) : null,
    hourlyRate: r.hourly_rate ? Number(r.hourly_rate) : 0,
    notes: r.notes ?? '',
    breaks: r.breaks ?? [],
  }));
}

// ─── Jobs ─────────────────────────────────────────────────────────────────────

export async function syncPushJob(job: Job): Promise<void> {
  if (!isSyncEnabled || !supabase) return;
  const userKey = getUserKey();
  if (!userKey) return;

  await supabase.from('jobs').upsert({
    id: job.id,
    user_key: userKey,
    data: job,
    updated_at: new Date().toISOString(),
  });
}

export async function syncDeleteJob(id: string): Promise<void> {
  if (!isSyncEnabled || !supabase) return;
  const userKey = getUserKey();
  if (!userKey) return;
  await supabase.from('jobs').delete().eq('id', id).eq('user_key', userKey);
}

export async function syncPullJobs(): Promise<Job[] | null> {
  if (!isSyncEnabled || !supabase) return null;
  const userKey = getUserKey();
  if (!userKey) return null;

  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('user_key', userKey)
    .order('updated_at', { ascending: true });

  if (error || !data) return null;
  return data.map((r) => r.data as Job);
}

// ─── Full pull (on app load / new device) ────────────────────────────────────

export async function syncPullAll(): Promise<{
  shifts: Shift[] | null;
  jobs: Job[] | null;
}> {
  const [shifts, jobs] = await Promise.all([syncPullShifts(), syncPullJobs()]);
  return { shifts, jobs };
}

// ─── Connection test ─────────────────────────────────────────────────────────

export async function testConnection(): Promise<boolean> {
  if (!isSyncEnabled || !supabase) return false;
  try {
    const { error } = await supabase.from('shifts').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}
