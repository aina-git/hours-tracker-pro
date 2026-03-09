import { useState, useEffect } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Shift, Job } from '../types';
import { getShifts } from '../store';
import { calcShiftPay, formatCurrency, formatHours } from '../utils/pay';

interface Props {
  job: Job;
  refreshKey: number;
}

export function CalendarView({ job, refreshKey }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);

  useEffect(() => {
    setShifts(getShifts().filter((s) => s.jobId === job.id && s.endTime !== null));
  }, [job.id, refreshKey]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days: Date[] = [];
  let d = calStart;
  while (d <= calEnd) {
    days.push(d);
    d = addDays(d, 1);
  }

  const shiftsOnDay = (day: Date) =>
    shifts.filter((s) => isSameDay(s.startTime, day));

  const earningsOnDay = (day: Date) => {
    const dayShifts = shiftsOnDay(day);
    return dayShifts.reduce((acc, s) => acc + calcShiftPay(s, job).grossPay, 0);
  };

  const selectedShifts = selectedDay ? shiftsOnDay(selectedDay) : [];

  return (
    <div className="px-4 py-6">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 rounded-lg bg-gray-800">
          <ChevronLeft size={18} />
        </button>
        <span className="font-semibold text-lg">{format(currentMonth, 'MMMM yyyy')}</span>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 rounded-lg bg-gray-800">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
          <div key={d} className="text-center text-xs text-gray-500 font-medium py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const inMonth = isSameMonth(day, currentMonth);
          const dayShifts = shiftsOnDay(day);
          const earnings = earningsOnDay(day);
          const selected = selectedDay && isSameDay(day, selectedDay);
          const today = isToday(day);

          return (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDay(isSameDay(day, selectedDay ?? new Date(0)) ? null : day)}
              className={`
                rounded-xl p-1 flex flex-col items-center min-h-[52px] transition-colors
                ${!inMonth ? 'opacity-25' : ''}
                ${selected ? 'bg-indigo-600' : today ? 'bg-gray-800' : dayShifts.length ? 'bg-gray-900' : ''}
                ${inMonth ? 'active:bg-gray-700' : ''}
              `}
            >
              <span className={`text-xs font-medium ${today && !selected ? 'text-indigo-400' : ''}`}>
                {format(day, 'd')}
              </span>
              {earnings > 0 && (
                <span className={`text-[9px] font-semibold mt-0.5 ${selected ? 'text-indigo-200' : 'text-emerald-400'}`}>
                  ${earnings.toFixed(0)}
                </span>
              )}
              {dayShifts.length > 0 && (
                <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${selected ? 'bg-indigo-200' : 'bg-indigo-400'}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day detail */}
      {selectedDay && (
        <div className="mt-5 rounded-2xl bg-gray-900 border border-gray-800 p-4">
          <div className="font-semibold mb-3">{format(selectedDay, 'EEEE, MMMM d')}</div>
          {selectedShifts.length === 0 ? (
            <div className="text-sm text-gray-500">No shifts this day.</div>
          ) : (
            <div className="space-y-3">
              {selectedShifts.map((s) => {
                const pay = calcShiftPay(s, job);
                return (
                  <div key={s.id} className="border-l-2 border-indigo-500 pl-3">
                    <div className="text-sm font-medium">
                      {format(s.startTime, 'h:mm a')} – {s.endTime ? format(s.endTime, 'h:mm a') : 'active'}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {formatHours(pay.totalHours)} · {formatCurrency(pay.grossPay, job.currency)} gross
                    </div>
                    {s.notes && <div className="text-xs text-gray-500 italic mt-0.5">"{s.notes}"</div>}
                  </div>
                );
              })}
              <div className="pt-2 border-t border-gray-800 flex justify-between text-sm">
                <span className="text-gray-400">Daily Total</span>
                <span className="font-semibold text-emerald-400">
                  {formatCurrency(selectedShifts.reduce((acc, s) => acc + calcShiftPay(s, job).grossPay, 0), job.currency)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
