import { useState, useEffect } from 'react';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { Trash2, ChevronDown, ChevronUp, Edit2, Check, X } from 'lucide-react';
import type { Shift, Job } from '../types';
import { getShifts, deleteShift, updateShift } from '../store';
import { calcShiftPay, formatCurrency, formatHours } from '../utils/pay';

interface Props {
  job: Job;
  refreshKey: number;
}

function dateLabel(ts: number): string {
  if (isToday(ts)) return 'Today';
  if (isYesterday(ts)) return 'Yesterday';
  if (isThisWeek(ts)) return format(ts, 'EEEE');
  return format(ts, 'MMM d, yyyy');
}

interface ShiftEditState {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  rate: string;
  notes: string;
}

function ShiftCard({ shift, job, onDelete, onUpdate }: { shift: Shift; job: Job; onDelete: () => void; onUpdate: (s: Shift) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editState, setEditState] = useState<ShiftEditState>({
    startDate: format(shift.startTime, 'yyyy-MM-dd'),
    startTime: format(shift.startTime, 'HH:mm'),
    endDate: shift.endTime ? format(shift.endTime, 'yyyy-MM-dd') : format(shift.startTime, 'yyyy-MM-dd'),
    endTime: shift.endTime ? format(shift.endTime, 'HH:mm') : '',
    rate: String(shift.hourlyRate),
    notes: shift.notes,
  });

  const pay = shift.endTime ? calcShiftPay(shift, job) : null;
  const isActive = shift.endTime === null;

  const saveEdit = () => {
    const startMs = new Date(`${editState.startDate}T${editState.startTime}`).getTime();
    const endMs = editState.endTime
      ? new Date(`${editState.endDate}T${editState.endTime}`).getTime()
      : null;
    const updated: Shift = {
      ...shift,
      startTime: startMs,
      endTime: endMs,
      hourlyRate: parseFloat(editState.rate) || job.hourlyRate,
      notes: editState.notes,
    };
    onUpdate(updated);
    setEditing(false);
  };

  return (
    <div className="rounded-xl bg-gray-900 border border-gray-800 overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-4 py-4 text-left active:bg-gray-800 transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{dateLabel(shift.startTime)}</span>
            {isActive && (
              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                Active
              </span>
            )}
          </div>
          <div className="text-sm text-gray-400 mt-0.5">
            {format(shift.startTime, 'h:mm a')}
            {shift.endTime ? ` – ${format(shift.endTime, 'h:mm a')}` : ' – now'}
          </div>
        </div>
        <div className="text-right">
          {pay && (
            <>
              <div className="font-bold text-emerald-400">{formatCurrency(pay.grossPay, job.currency)}</div>
              <div className="text-xs text-gray-400">{formatHours(pay.totalHours)}</div>
            </>
          )}
        </div>
        {expanded ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
      </button>

      {expanded && (
        <div className="border-t border-gray-800 px-4 py-4 space-y-3">
          {editing ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-400">Start Date</label>
                  <input
                    type="date"
                    value={editState.startDate}
                    onChange={(e) => setEditState({ ...editState, startDate: e.target.value })}
                    className="w-full mt-1 bg-gray-800 rounded-lg px-3 py-2 text-sm text-white border border-gray-700"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Start Time</label>
                  <input
                    type="time"
                    value={editState.startTime}
                    onChange={(e) => setEditState({ ...editState, startTime: e.target.value })}
                    className="w-full mt-1 bg-gray-800 rounded-lg px-3 py-2 text-sm text-white border border-gray-700"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400">End Date</label>
                  <input
                    type="date"
                    value={editState.endDate}
                    onChange={(e) => setEditState({ ...editState, endDate: e.target.value })}
                    className="w-full mt-1 bg-gray-800 rounded-lg px-3 py-2 text-sm text-white border border-gray-700"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400">End Time</label>
                  <input
                    type="time"
                    value={editState.endTime}
                    onChange={(e) => setEditState({ ...editState, endTime: e.target.value })}
                    className="w-full mt-1 bg-gray-800 rounded-lg px-3 py-2 text-sm text-white border border-gray-700"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400">Hourly Rate ($)</label>
                <input
                  type="number"
                  value={editState.rate}
                  onChange={(e) => setEditState({ ...editState, rate: e.target.value })}
                  className="w-full mt-1 bg-gray-800 rounded-lg px-3 py-2 text-sm text-white border border-gray-700"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">Notes</label>
                <textarea
                  value={editState.notes}
                  onChange={(e) => setEditState({ ...editState, notes: e.target.value })}
                  rows={2}
                  className="w-full mt-1 bg-gray-800 rounded-lg px-3 py-2 text-sm text-white border border-gray-700 resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={saveEdit} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium">
                  <Check size={14} /> Save
                </button>
                <button onClick={() => setEditing(false)} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-gray-800 text-gray-300 text-sm">
                  <X size={14} /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {pay && (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-gray-400">Regular</div>
                    <div className="font-medium">{formatHours(pay.regularHours)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Overtime</div>
                    <div className="font-medium text-yellow-400">{formatHours(pay.overtimeHours)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Break</div>
                    <div className="font-medium">{Math.round(pay.totalBreakMinutes)}m</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Est. Net</div>
                    <div className="font-medium text-blue-400">{formatCurrency(pay.netPay, job.currency)}</div>
                  </div>
                </div>
              )}
              {shift.notes && (
                <div className="text-sm text-gray-400 italic">"{shift.notes}"</div>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 text-xs"
                >
                  <Edit2 size={12} /> Edit
                </button>
                <button
                  onClick={onDelete}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs"
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function ShiftsView({ job, refreshKey }: Props) {
  const [shifts, setShifts] = useState<Shift[]>([]);

  useEffect(() => {
    const all = getShifts()
      .filter((s) => s.jobId === job.id)
      .sort((a, b) => b.startTime - a.startTime);
    setShifts(all);
  }, [job.id, refreshKey]);

  const handleDelete = (id: string) => {
    deleteShift(id);
    setShifts((prev) => prev.filter((s) => s.id !== id));
  };

  const handleUpdate = (updated: Shift) => {
    updateShift(updated);
    setShifts((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  if (shifts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 gap-2">
        <div className="text-4xl">⏱</div>
        <div className="text-sm">No shifts yet. Clock in to start!</div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-3">
      <div className="text-sm text-gray-400 font-medium">{shifts.length} shifts</div>
      {shifts.map((s) => (
        <ShiftCard
          key={s.id}
          shift={s}
          job={job}
          onDelete={() => handleDelete(s.id)}
          onUpdate={handleUpdate}
        />
      ))}
    </div>
  );
}
