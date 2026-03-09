import { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths } from 'date-fns';
import { FileText, Table, AlignLeft, Check } from 'lucide-react';
import type { Shift, Job } from '../types';
import { getShifts } from '../store';
import { calcShiftPay, formatCurrency, formatHours } from '../utils/pay';
import { exportCSV, exportPDF, exportText } from '../utils/export';

interface Props {
  job: Job;
  refreshKey: number;
}

type Range = 'this-week' | 'last-week' | 'this-month' | 'last-month' | 'all';

function getRange(range: Range): { start: number; end: number; label: string } {
  const now = Date.now();
  switch (range) {
    case 'this-week': {
      const s = startOfWeek(now, { weekStartsOn: 1 });
      return { start: s.getTime(), end: now, label: `Week of ${format(s, 'MMM d')}` };
    }
    case 'last-week': {
      const s = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
      const e = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
      return { start: s.getTime(), end: e.getTime(), label: `Week of ${format(s, 'MMM d')}` };
    }
    case 'this-month': {
      const s = startOfMonth(now);
      return { start: s.getTime(), end: now, label: format(now, 'MMMM yyyy') };
    }
    case 'last-month': {
      const s = startOfMonth(subMonths(now, 1));
      const e = endOfMonth(subMonths(now, 1));
      return { start: s.getTime(), end: e.getTime(), label: format(s, 'MMMM yyyy') };
    }
    case 'all':
      return { start: 0, end: now, label: 'All Time' };
  }
}

export function ReportsView({ job, refreshKey }: Props) {
  const [range, setRange] = useState<Range>('this-week');
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setShifts(getShifts().filter((s) => s.jobId === job.id && s.endTime !== null));
  }, [job.id, refreshKey]);

  const { start, end, label } = getRange(range);
  const filtered = shifts.filter((s) => s.startTime >= start && s.startTime <= end);

  const totalHours = filtered.reduce((acc, s) => acc + calcShiftPay(s, job).totalHours, 0);
  const totalOT = filtered.reduce((acc, s) => acc + calcShiftPay(s, job).overtimeHours, 0);
  const totalGross = filtered.reduce((acc, s) => acc + calcShiftPay(s, job).grossPay, 0);
  const totalNet = filtered.reduce((acc, s) => acc + calcShiftPay(s, job).netPay, 0);

  const handleCopyText = () => {
    const text = exportText(filtered, job, label);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const rangeOptions: { key: Range; label: string }[] = [
    { key: 'this-week', label: 'This Week' },
    { key: 'last-week', label: 'Last Week' },
    { key: 'this-month', label: 'This Month' },
    { key: 'last-month', label: 'Last Month' },
    { key: 'all', label: 'All Time' },
  ];

  return (
    <div className="px-4 py-6 space-y-4">
      {/* Range picker */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {rangeOptions.map((o) => (
          <button
            key={o.key}
            onClick={() => setRange(o.key)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              range === o.key ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-gray-900 border border-gray-800 p-4">
          <div className="text-xs text-gray-400 mb-1">Total Hours</div>
          <div className="text-2xl font-bold">{formatHours(totalHours)}</div>
          {totalOT > 0 && <div className="text-xs text-yellow-400 mt-1">{formatHours(totalOT)} OT</div>}
        </div>
        <div className="rounded-2xl bg-gray-900 border border-gray-800 p-4">
          <div className="text-xs text-gray-400 mb-1">Gross Pay</div>
          <div className="text-2xl font-bold text-emerald-400">{formatCurrency(totalGross, job.currency)}</div>
        </div>
        <div className="rounded-2xl bg-gray-900 border border-gray-800 p-4">
          <div className="text-xs text-gray-400 mb-1">Est. Net Pay</div>
          <div className="text-xl font-bold text-blue-400">{formatCurrency(totalNet, job.currency)}</div>
        </div>
        <div className="rounded-2xl bg-gray-900 border border-gray-800 p-4">
          <div className="text-xs text-gray-400 mb-1">Shifts</div>
          <div className="text-2xl font-bold">{filtered.length}</div>
        </div>
      </div>

      {/* Export buttons */}
      <div className="rounded-2xl bg-gray-900 border border-gray-800 p-4">
        <div className="text-sm font-medium mb-3">Export — {label}</div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => exportPDF(filtered, job, label.replace(/\s/g, '-').toLowerCase())}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 text-red-400 text-sm font-medium active:scale-95 transition-transform"
          >
            <FileText size={16} /> PDF
          </button>
          <button
            onClick={() => exportCSV(filtered, job, label.replace(/\s/g, '-').toLowerCase())}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 text-emerald-400 text-sm font-medium active:scale-95 transition-transform"
          >
            <Table size={16} /> CSV
          </button>
          <button
            onClick={handleCopyText}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-800 text-gray-300 text-sm font-medium active:scale-95 transition-transform col-span-2"
          >
            {copied ? <Check size={16} className="text-emerald-400" /> : <AlignLeft size={16} />}
            {copied ? 'Copied!' : 'Copy as Text'}
          </button>
        </div>
      </div>

      {/* Shift breakdown */}
      {filtered.length > 0 && (
        <div className="rounded-2xl bg-gray-900 border border-gray-800 p-4">
          <div className="text-sm font-medium mb-3">Breakdown</div>
          <div className="space-y-2">
            {filtered.map((s) => {
              const pay = calcShiftPay(s, job);
              return (
                <div key={s.id} className="flex justify-between items-center text-sm py-1 border-b border-gray-800 last:border-0">
                  <div>
                    <div className="font-medium">{format(s.startTime, 'MMM d')}</div>
                    <div className="text-xs text-gray-400">{formatHours(pay.totalHours)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-emerald-400 font-medium">{formatCurrency(pay.grossPay, job.currency)}</div>
                    {pay.overtimeHours > 0 && (
                      <div className="text-xs text-yellow-400">{formatHours(pay.overtimeHours)} OT</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center text-gray-500 text-sm py-8">No completed shifts in this period.</div>
      )}
    </div>
  );
}
