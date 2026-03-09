import { useState, useEffect } from 'react';
import { PlayCircle, StopCircle, Coffee, Clock } from 'lucide-react';
import { format, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import type { Shift, Job } from '../types';
import {
  getActiveShift,
  clockIn,
  clockOut,
  startBreak,
  endBreak,
  getShifts,
} from '../store';
import { calcWeeklyPay, formatCurrency, formatDuration, formatHours } from '../utils/pay';
import { useClock } from '../hooks/useClock';

interface Props {
  job: Job;
  onRefresh: () => void;
}

export function HomeView({ job, onRefresh }: Props) {
  const now = useClock();
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [weeklyShifts, setWeeklyShifts] = useState<Shift[]>([]);

  const refresh = () => {
    const active = getActiveShift();
    setActiveShift(active);
    const all = getShifts().filter((s) => s.jobId === job.id);
    const weekStart = startOfWeek(Date.now(), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(Date.now(), { weekStartsOn: 1 });
    setWeeklyShifts(all.filter((s) => isWithinInterval(s.startTime, { start: weekStart, end: weekEnd })));
  };

  useEffect(() => {
    refresh();
  }, [job.id]);

  const isOnBreak = activeShift?.breaks.some((b) => b.endTime === null) ?? false;

  const handleClockIn = () => {
    clockIn(job.id, job.hourlyRate);
    refresh();
    onRefresh();
  };

  const handleClockOut = () => {
    if (!activeShift) return;
    clockOut(activeShift.id);
    refresh();
    onRefresh();
  };

  const handleBreakToggle = () => {
    if (!activeShift) return;
    if (isOnBreak) endBreak(activeShift.id);
    else startBreak(activeShift.id);
    refresh();
  };

  // Live duration
  const elapsedMs = activeShift
    ? Math.max(
        0,
        now -
          activeShift.startTime -
          activeShift.breaks.reduce((acc, b) => {
            const e = b.endTime ?? now;
            return acc + (e - b.startTime);
          }, 0),
      )
    : 0;

  const livePay = activeShift
    ? (elapsedMs / 3_600_000) * activeShift.hourlyRate
    : 0;

  const weekly = calcWeeklyPay(weeklyShifts, job);

  return (
    <div className="flex flex-col gap-5 px-4 py-6">
      {/* Current job header */}
      <div className="flex items-center gap-3">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: job.color }}
        />
        <span className="text-lg font-semibold">{job.name}</span>
        <span className="ml-auto text-sm text-gray-400">
          {format(now, 'EEE, MMM d')}
        </span>
      </div>

      {/* Live timer card */}
      <div className="rounded-2xl bg-gray-900 border border-gray-800 p-6 flex flex-col items-center gap-3">
        {activeShift ? (
          <>
            <div className="flex items-center gap-2 text-sm text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {isOnBreak ? 'On Break' : 'Clocked In'}
            </div>
            <div className="text-5xl font-mono font-bold tracking-tight">
              {formatDuration(isOnBreak ? (now - (activeShift.breaks.find((b) => !b.endTime)?.startTime ?? now)) : elapsedMs)}
            </div>
            <div className="text-2xl font-semibold text-indigo-400">
              {formatCurrency(livePay, job.currency)}
            </div>
            <div className="text-xs text-gray-500">
              Started at {format(activeShift.startTime, 'h:mm a')}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 mt-2 w-full">
              <button
                onClick={handleBreakToggle}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-800 text-gray-300 text-sm font-medium active:scale-95 transition-transform"
              >
                <Coffee size={16} />
                {isOnBreak ? 'End Break' : 'Start Break'}
              </button>
              <button
                onClick={handleClockOut}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/20 text-red-400 text-sm font-medium active:scale-95 transition-transform"
              >
                <StopCircle size={16} />
                Clock Out
              </button>
            </div>
          </>
        ) : (
          <>
            <Clock size={48} className="text-gray-600" />
            <div className="text-gray-400 text-sm">Not clocked in</div>
            <button
              onClick={handleClockIn}
              className="mt-2 w-full flex items-center justify-center gap-2 py-4 rounded-xl text-white font-semibold text-lg active:scale-95 transition-transform"
              style={{ backgroundColor: job.color }}
            >
              <PlayCircle size={22} />
              Clock In
            </button>
          </>
        )}
      </div>

      {/* This week summary */}
      <div className="rounded-2xl bg-gray-900 border border-gray-800 p-5">
        <div className="text-sm text-gray-400 mb-4 font-medium">This Week</div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-2xl font-bold">{formatHours(weekly.totalHours)}</div>
            <div className="text-xs text-gray-500 mt-0.5">Total Hours</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-400">
              {formatCurrency(weekly.grossPay, job.currency)}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">Gross Earned</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-yellow-400">
              {formatHours(weekly.overtimeHours)}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">Overtime</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-blue-400">
              {formatCurrency(weekly.netPay, job.currency)}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">Est. Net Pay</div>
          </div>
        </div>
      </div>

      {/* Rate info */}
      <div className="rounded-2xl bg-gray-900 border border-gray-800 p-5 flex justify-between items-center">
        <div>
          <div className="text-sm text-gray-400">Hourly Rate</div>
          <div className="text-xl font-bold mt-0.5">
            {formatCurrency(job.hourlyRate, job.currency)}/hr
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400">Tax</div>
          <div className="text-xl font-bold mt-0.5">{job.taxPercent}%</div>
        </div>
      </div>
    </div>
  );
}
