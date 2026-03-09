import { useState, useEffect } from 'react';
import {
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  eachDayOfInterval,
  isToday,
  isSameDay,
} from 'date-fns';
import type { Shift, Job } from '../types';
import {
  getActiveShift,
  clockIn,
  clockOut,
  startBreak,
  endBreak,
  getShifts,
} from '../store';
import { calcShiftPay, calcWeeklyPay, formatCurrency, formatHours } from '../utils/pay';
import { useClock } from '../hooks/useClock';

interface Props {
  job: Job;
  onRefresh: () => void;
  refreshKey: number;
}

function msToHMS(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function TimelineBar({ shift, now }: { shift: Shift; now: number }) {
  const dayStart = new Date(shift.startTime);
  dayStart.setHours(0, 0, 0, 0);
  const totalDayMs = 24 * 3600 * 1000;

  const shiftStartPct = ((shift.startTime - dayStart.getTime()) / totalDayMs) * 100;
  const shiftEndMs = shift.endTime ?? now;
  const shiftEndPct = ((shiftEndMs - dayStart.getTime()) / totalDayMs) * 100;
  const widthPct = Math.max(shiftEndPct - shiftStartPct, 0.5);

  const breakBlocks = shift.breaks.map((b) => ({
    left: ((b.startTime - dayStart.getTime()) / totalDayMs) * 100,
    width: (((b.endTime ?? now) - b.startTime) / totalDayMs) * 100,
  }));

  const nowPct = Math.min(((now - dayStart.getTime()) / totalDayMs) * 100, 99);

  return (
    <div className="w-full">
      <div className="flex justify-between mb-1.5" style={{ color: '#3a3a5a' }}>
        {['12a', '3a', '6a', '9a', '12p', '3p', '6p', '9p', '12a'].map((t) => (
          <span key={t} className="text-[8px]">{t}</span>
        ))}
      </div>
      <div
        className="relative w-full rounded-full overflow-visible"
        style={{ height: 8, backgroundColor: '#1e1e2e' }}
      >
        <div
          className="absolute top-0 h-full rounded-full"
          style={{ left: `${shiftStartPct}%`, width: `${widthPct}%`, backgroundColor: '#7C6FF7' }}
        />
        {breakBlocks.map((b, i) => (
          <div
            key={i}
            className="absolute top-0 h-full"
            style={{ left: `${b.left}%`, width: `${Math.max(b.width, 0.3)}%`, backgroundColor: '#f59e0b' }}
          />
        ))}
        <div
          className="absolute rounded-full border-2 border-white"
          style={{
            width: 14, height: 14,
            top: '50%', transform: 'translateY(-50%)',
            left: `calc(${nowPct}% - 7px)`,
            backgroundColor: '#7C6FF7',
            zIndex: 10,
            boxShadow: '0 0 6px #7C6FF7',
          }}
        />
      </div>
    </div>
  );
}

interface DayRowProps {
  day: Date;
  shifts: Shift[];
  job: Job;
  isCurrentDay: boolean;
  now: number;
}

function DayRow({ day, shifts, job, isCurrentDay, now }: DayRowProps) {
  const activeShift = shifts.find((s) => s.endTime === null);

  const totalMs = shifts.reduce((acc, s) => {
    const bMs = s.breaks.reduce((ba, b) => ba + ((b.endTime ?? now) - b.startTime), 0);
    return acc + Math.max(0, (s.endTime ?? now) - s.startTime - bMs);
  }, 0);

  const totalHrs = totalMs / 3_600_000;
  const totalGross = shifts.reduce((acc, s) => acc + calcShiftPay(s, job).grossPay, 0);
  const hasShifts = shifts.length > 0;

  const dayName = isCurrentDay ? 'Today' : format(day, 'EEE');
  const dateStr = format(day, 'M/d');

  return (
    <div
      className="flex items-center px-3 py-3 rounded-2xl mx-3 mb-0.5"
      style={{
        backgroundColor: isCurrentDay ? '#1a1a2e' : 'transparent',
        border: isCurrentDay ? '1px solid #2a2a4a' : '1px solid transparent',
      }}
    >
      {/* Day */}
      <div className="w-14 flex-shrink-0">
        <div className="text-sm font-semibold" style={{ color: isCurrentDay ? '#7C6FF7' : '#9ca3af' }}>
          {dayName}
        </div>
        <div className="text-[11px]" style={{ color: '#4a4a6a' }}>{dateStr}</div>
      </div>

      {/* Shift bars visualization */}
      <div className="flex-1 mx-3 flex items-center gap-1">
        {hasShifts ? (
          shifts.map((s) => {
            const sMs = (() => {
              const bMs = s.breaks.reduce((acc, b) => acc + ((b.endTime ?? now) - b.startTime), 0);
              return Math.max(0, (s.endTime ?? now) - s.startTime - bMs);
            })();
            const hrs = sMs / 3_600_000;
            const barW = Math.min(Math.max(hrs * 12, 6), 120);
            return (
              <div
                key={s.id}
                className="h-2 rounded-full"
                style={{ width: barW, backgroundColor: s.endTime === null ? '#7C6FF7' : '#3a3a5a' }}
              />
            );
          })
        ) : (
          <div className="h-1.5 rounded-full w-8" style={{ backgroundColor: '#2a2a3a' }} />
        )}
        {activeShift && (
          <span
            className="text-[9px] px-1.5 py-0.5 rounded-full font-bold ml-1"
            style={{ backgroundColor: '#7C6FF720', color: '#7C6FF7' }}
          >
            LIVE
          </span>
        )}
      </div>

      {/* Earnings */}
      <div className="text-right flex-shrink-0">
        {hasShifts ? (
          <>
            <div className="text-sm font-bold" style={{ color: isCurrentDay ? '#fff' : '#d1d5db' }}>
              {formatCurrency(totalGross, job.currency)}
            </div>
            <div className="text-[11px]" style={{ color: '#6b7280' }}>{formatHours(totalHrs)}</div>
          </>
        ) : (
          <div className="text-sm" style={{ color: '#2a2a4a' }}>—</div>
        )}
      </div>
    </div>
  );
}

export function HomeView({ job, onRefresh, refreshKey }: Props) {
  const now = useClock();
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [allShifts, setAllShifts] = useState<Shift[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);

  const refresh = () => {
    setActiveShift(getActiveShift());
    setAllShifts(getShifts().filter((s) => s.jobId === job.id));
  };

  useEffect(() => { refresh(); }, [job.id, refreshKey]);

  const baseDate = addWeeks(new Date(), weekOffset);
  const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(baseDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const weekShifts = allShifts.filter(
    (s) => s.startTime >= weekStart.getTime() && s.startTime <= weekEnd.getTime(),
  );

  const isOnBreak = activeShift?.breaks.some((b) => !b.endTime) ?? false;
  const activeBreak = activeShift?.breaks.find((b) => !b.endTime);

  const elapsedMs = activeShift
    ? Math.max(
        0,
        now - activeShift.startTime -
        activeShift.breaks.reduce((acc, b) => acc + ((b.endTime ?? now) - b.startTime), 0),
      )
    : 0;

  const breakElapsedMs = activeBreak ? now - activeBreak.startTime : 0;

  const liveGross = (elapsedMs / 3_600_000) * (activeShift?.hourlyRate ?? job.hourlyRate);
  const liveNet = liveGross > 0 ? calcShiftPay({ ...activeShift!, endTime: Date.now() }, job).netPay : 0;

  const weekly = calcWeeklyPay(weekShifts, job);

  const handleClockIn = () => { clockIn(job.id, job.hourlyRate); refresh(); onRefresh(); };
  const handleClockOut = () => { if (activeShift) { clockOut(activeShift.id); refresh(); onRefresh(); } };
  const handleBreakToggle = () => {
    if (!activeShift) return;
    if (isOnBreak) endBreak(activeShift.id);
    else startBreak(activeShift.id);
    refresh();
  };

  const weekLabel = `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d')}`;

  return (
    <div className="pb-6">
      {/* Week navigator bar */}
      <div className="flex items-center justify-between px-4 pt-2 pb-3">
        <button
          onClick={() => setWeekOffset((o) => o - 1)}
          className="w-9 h-9 rounded-full flex items-center justify-center active:opacity-60"
          style={{ backgroundColor: '#1e1e2e' }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <div className="text-center">
          <div className="text-sm font-bold text-white">{weekLabel}</div>
          {weekOffset === 0 && <div className="text-[11px]" style={{ color: '#6b7280' }}>This Week</div>}
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-sm font-bold text-white">
              {formatCurrency(weekly.grossPay, job.currency)}
            </div>
            <div className="text-[11px]" style={{ color: '#6b7280' }}>{formatHours(weekly.totalHours)}</div>
          </div>
          <button
            onClick={() => setWeekOffset((o) => o + 1)}
            className="w-9 h-9 rounded-full flex items-center justify-center active:opacity-60"
            style={{ backgroundColor: '#1e1e2e' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 4l4 4-4 4" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* TODAY Active Shift Card */}
      <div
        className="mx-3 rounded-3xl p-5 mb-2"
        style={{ backgroundColor: '#161623', border: '1px solid #252538' }}
      >
        {/* Card header */}
        <div className="flex items-center justify-between mb-5">
          <span className="text-base font-bold text-white">Today</span>
          {activeShift ? (
            <span
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
              style={{ backgroundColor: '#7C6FF720', color: '#7C6FF7' }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#7C6FF7' }} />
              {isOnBreak ? 'On Break' : 'Running'}
            </span>
          ) : (
            <span className="text-xs text-gray-600">
              {format(now, 'h:mm a')}
            </span>
          )}
        </div>

        {/* Timer display */}
        <div className="mb-5">
          <div
            className="font-bold tracking-tight tabular-nums leading-none"
            style={{ fontSize: 52, color: '#fff', fontVariantNumeric: 'tabular-nums' }}
          >
            {msToHMS(activeShift ? (isOnBreak ? breakElapsedMs : elapsedMs) : 0)}
          </div>
          {activeShift && (
            <div className="text-[11px] mt-1.5" style={{ color: '#6b7280' }}>
              Started {format(activeShift.startTime, 'h:mm a')}
              {isOnBreak && <span className="text-amber-500 ml-2">• Break running</span>}
            </div>
          )}
        </div>

        {/* Gross / Net */}
        <div className="flex gap-8 mb-5">
          <div>
            <div className="text-[11px] font-medium mb-1" style={{ color: '#6b7280' }}>Gross</div>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(activeShift ? liveGross : 0, job.currency)}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-medium mb-1" style={{ color: '#6b7280' }}>Net</div>
            <div className="text-2xl font-bold" style={{ color: '#7C6FF7' }}>
              {formatCurrency(activeShift ? liveNet : 0, job.currency)}
            </div>
          </div>
        </div>

        {/* 24h Timeline */}
        {activeShift && (
          <div className="mb-5">
            <TimelineBar shift={activeShift} now={now} />
          </div>
        )}

        {/* Clock In / Out buttons */}
        {activeShift ? (
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={handleClockOut}
              className="py-4 rounded-2xl text-sm font-bold active:scale-95 transition-transform"
              style={{ backgroundColor: '#ef444418', color: '#ef4444', border: '1px solid #ef444430' }}
            >
              Clock Out
            </button>
            <button
              onClick={handleBreakToggle}
              className="py-4 rounded-2xl text-sm font-bold active:scale-95 transition-transform"
              style={{
                backgroundColor: isOnBreak ? '#f59e0b18' : '#1e1e2e',
                color: isOnBreak ? '#f59e0b' : '#9ca3af',
                border: `1px solid ${isOnBreak ? '#f59e0b30' : '#2a2a3a'}`,
              }}
            >
              {isOnBreak ? 'End Break' : 'Start Break'}
            </button>
          </div>
        ) : (
          <button
            onClick={handleClockIn}
            className="w-full py-4 rounded-2xl font-bold text-white text-base active:scale-95 transition-transform"
            style={{ backgroundColor: '#7C6FF7', boxShadow: '0 4px 20px #7C6FF740' }}
          >
            Clock In
          </button>
        )}
      </div>

      {/* Weekly day rows */}
      <div className="mt-1">
        {weekDays.map((day) => {
          const dayShifts = allShifts.filter((s) => isSameDay(s.startTime, day));
          return (
            <DayRow
              key={day.toISOString()}
              day={day}
              shifts={dayShifts}
              job={job}
              isCurrentDay={isToday(day) && weekOffset === 0}
              now={now}
            />
          );
        })}
      </div>

      {/* Week summary */}
      <div
        className="mx-3 mt-3 rounded-2xl p-4 grid grid-cols-3 gap-3"
        style={{ backgroundColor: '#161623', border: '1px solid #252538' }}
      >
        <div>
          <div className="text-[10px] font-medium mb-1" style={{ color: '#6b7280' }}>HOURS</div>
          <div className="text-base font-bold text-white">{formatHours(weekly.totalHours)}</div>
        </div>
        <div>
          <div className="text-[10px] font-medium mb-1" style={{ color: '#6b7280' }}>OVERTIME</div>
          <div className="text-base font-bold" style={{ color: '#f59e0b' }}>
            {formatHours(weekly.overtimeHours)}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-medium mb-1" style={{ color: '#6b7280' }}>EST. NET</div>
          <div className="text-base font-bold" style={{ color: '#7C6FF7' }}>
            {formatCurrency(weekly.netPay, job.currency)}
          </div>
        </div>
      </div>
    </div>
  );
}
