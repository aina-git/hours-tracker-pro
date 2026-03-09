import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import type { Job, FilingStatus } from '../types';
import { saveJob, createJob, deleteJob } from '../store';
import { US_STATES, FILING_STATUS_LABELS, calcNetPay } from '../utils/tax';
import { formatCurrency } from '../utils/pay';

const COLORS = ['#7C6FF7', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'MXN', 'INR', 'BRL'];

const FILING_STATUSES: FilingStatus[] = [
  'single',
  'married_filing_jointly',
  'married_filing_separately',
  'head_of_household',
];

interface JobFormProps {
  initial?: Partial<Job>;
  onSave: (j: Omit<Job, 'id'> | Job) => void;
  onCancel: () => void;
}

function JobForm({ initial, onSave, onCancel }: JobFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [rate, setRate] = useState(String(initial?.hourlyRate ?? 15));
  const [currency, setCurrency] = useState(initial?.currency ?? 'USD');
  const [filing, setFiling] = useState<FilingStatus>(initial?.filingStatus ?? 'single');
  const [state, setState] = useState(initial?.state ?? 'TX');
  const [otEnabled, setOtEnabled] = useState(initial?.overtimeEnabled ?? true);
  const [dailyOt, setDailyOt] = useState(String(initial?.dailyOvertimeAfter ?? 8));
  const [weeklyOt, setWeeklyOt] = useState(String(initial?.weeklyOvertimeAfter ?? 40));
  const [multiplier, setMultiplier] = useState(String(initial?.overtimeMultiplier ?? 1.5));
  const [color, setColor] = useState(initial?.color ?? COLORS[0]);

  // Live tax preview
  const hourlyRate = parseFloat(rate) || 0;
  const annualGross = hourlyRate * 2080;
  const preview = annualGross > 0 ? calcNetPay(annualGross, filing, state) : null;

  const handleSave = () => {
    if (!name.trim()) return;
    const jobData: Omit<Job, 'id'> = {
      name: name.trim(),
      hourlyRate,
      currency,
      filingStatus: filing,
      state,
      overtimeEnabled: otEnabled,
      dailyOvertimeAfter: parseFloat(dailyOt) || 8,
      weeklyOvertimeAfter: parseFloat(weeklyOt) || 40,
      overtimeMultiplier: parseFloat(multiplier) || 1.5,
      color,
      reminderClockIn: null,
      reminderClockOut: null,
    };
    if ((initial as Job)?.id) {
      onSave({ ...jobData, id: (initial as Job).id });
    } else {
      onSave(jobData);
    }
  };

  const inputCls = "w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:ring-1"
    + " focus:ring-[#7C6FF7]";
  const inputStyle = { backgroundColor: '#1e1e2e', border: '1px solid #2a2a3a' };

  return (
    <div className="space-y-4">
      {/* Job name */}
      <div>
        <label className="text-xs font-medium mb-1 block" style={{ color: '#9ca3af' }}>Job Name *</label>
        <input
          className={inputCls}
          style={inputStyle}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Retail, Freelance, Warehouse"
        />
      </div>

      {/* Rate + Currency */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: '#9ca3af' }}>Hourly Rate</label>
          <input
            type="number"
            className={inputCls}
            style={inputStyle}
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            min="0"
            step="0.25"
          />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: '#9ca3af' }}>Currency</label>
          <select
            className={inputCls}
            style={inputStyle}
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* ── Tax Section (real IRS) ── */}
      <div
        className="rounded-2xl p-4 space-y-3"
        style={{ backgroundColor: '#0d0d18', border: '1px solid #2a2a3a' }}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-bold text-white">Tax Settings</span>
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: '#7C6FF720', color: '#7C6FF7' }}
          >
            IRS 2024
          </span>
        </div>

        {/* Filing status */}
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: '#9ca3af' }}>Filing Status</label>
          <select
            className={inputCls}
            style={inputStyle}
            value={filing}
            onChange={(e) => setFiling(e.target.value as FilingStatus)}
          >
            {FILING_STATUSES.map((s) => (
              <option key={s} value={s}>{FILING_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>

        {/* State */}
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: '#9ca3af' }}>State</label>
          <select
            className={inputCls}
            style={inputStyle}
            value={state}
            onChange={(e) => setState(e.target.value)}
          >
            {US_STATES.map((s) => (
              <option key={s.code} value={s.code}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Live tax preview */}
        {preview && (
          <div
            className="rounded-xl p-3 space-y-1.5 text-xs"
            style={{ backgroundColor: '#161620' }}
          >
            <div className="font-semibold mb-2" style={{ color: '#9ca3af' }}>
              Est. Annual Tax Preview ({formatCurrency(annualGross, currency)} gross/yr)
            </div>
            <div className="flex justify-between">
              <span style={{ color: '#6b7280' }}>Federal Income Tax</span>
              <span className="font-medium text-white">{formatCurrency(preview.federalTax, currency)}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: '#6b7280' }}>State Income Tax ({state})</span>
              <span className="font-medium text-white">{formatCurrency(preview.stateTax, currency)}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: '#6b7280' }}>Social Security (6.2%)</span>
              <span className="font-medium text-white">{formatCurrency(preview.socialSecurity, currency)}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: '#6b7280' }}>Medicare (1.45%)</span>
              <span className="font-medium text-white">{formatCurrency(preview.medicare, currency)}</span>
            </div>
            <div
              className="flex justify-between pt-1.5 mt-1 border-t font-semibold"
              style={{ borderColor: '#2a2a3a' }}
            >
              <span style={{ color: '#9ca3af' }}>Effective Tax Rate</span>
              <span style={{ color: '#7C6FF7' }}>{(preview.effectiveRate * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span style={{ color: '#9ca3af' }}>Est. Annual Net</span>
              <span style={{ color: '#10b981' }}>{formatCurrency(preview.netAnnual, currency)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Color */}
      <div>
        <label className="text-xs font-medium mb-2 block" style={{ color: '#9ca3af' }}>Color</label>
        <div className="flex gap-2 flex-wrap">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-transform active:scale-90"
              style={{ backgroundColor: c }}
            >
              {color === c && <Check size={14} className="text-white" />}
            </button>
          ))}
        </div>
      </div>

      {/* Overtime */}
      <div className="rounded-2xl p-4 space-y-3" style={{ backgroundColor: '#0d0d18', border: '1px solid #2a2a3a' }}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-white">Overtime</span>
          <button
            onClick={() => setOtEnabled((e) => !e)}
            className="relative w-12 h-6 rounded-full transition-colors"
            style={{ backgroundColor: otEnabled ? '#7C6FF7' : '#2a2a3a' }}
          >
            <div
              className="absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform"
              style={{ left: otEnabled ? '26px' : '2px' }}
            />
          </button>
        </div>
        {otEnabled && (
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Daily After (h)', val: dailyOt, set: setDailyOt },
              { label: 'Weekly After (h)', val: weeklyOt, set: setWeeklyOt },
              { label: 'Multiplier', val: multiplier, set: setMultiplier },
            ].map(({ label, val, set }) => (
              <div key={label}>
                <label className="text-[10px] mb-1 block" style={{ color: '#6b7280' }}>{label}</label>
                <input
                  type="number"
                  className={inputCls}
                  style={inputStyle}
                  value={val}
                  onChange={(e) => set(e.target.value)}
                  step="0.5"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save / Cancel */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSave}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-white active:scale-95 transition-transform"
          style={{ backgroundColor: '#7C6FF7' }}
        >
          <Check size={16} /> Save Job
        </button>
        <button
          onClick={onCancel}
          className="px-5 py-3.5 rounded-2xl active:scale-95 transition-transform"
          style={{ backgroundColor: '#1e1e2e', color: '#9ca3af' }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

interface Props {
  jobs: Job[];
  activeJobId: string;
  onSelectJob: (id: string) => void;
  onJobsChanged: () => void;
}

export function JobsView({ jobs, activeJobId, onSelectJob, onJobsChanged }: Props) {
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleCreate = (data: Omit<Job, 'id'> | Job) => {
    createJob(data as Omit<Job, 'id'>);
    setCreating(false);
    onJobsChanged();
  };

  const handleEdit = (data: Omit<Job, 'id'> | Job) => {
    saveJob(data as Job);
    setEditingId(null);
    onJobsChanged();
  };

  const handleDelete = (id: string) => {
    if (jobs.length <= 1) return;
    deleteJob(id);
    if (id === activeJobId) {
      const next = jobs.find((j) => j.id !== id);
      if (next) onSelectJob(next.id);
    }
    onJobsChanged();
  };

  return (
    <div className="px-4 py-5 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <span className="font-bold text-white text-base">Jobs</span>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full"
          style={{ backgroundColor: '#7C6FF720', color: '#7C6FF7' }}
        >
          <Plus size={14} /> Add Job
        </button>
      </div>

      {creating && (
        <div
          className="rounded-2xl p-4"
          style={{ backgroundColor: '#161623', border: '1px solid #7C6FF750' }}
        >
          <div className="text-sm font-bold text-white mb-4">New Job</div>
          <JobForm onSave={handleCreate} onCancel={() => setCreating(false)} />
        </div>
      )}

      {jobs.map((job) => {
        const isActive = job.id === activeJobId;
        const preview = calcNetPay(job.hourlyRate * 2080, job.filingStatus, job.state);
        return (
          <div
            key={job.id}
            className="rounded-2xl p-4"
            style={{
              backgroundColor: '#161623',
              border: `1px solid ${isActive ? job.color + '60' : '#252538'}`,
            }}
          >
            {editingId === job.id ? (
              <>
                <div className="text-sm font-bold text-white mb-4">Edit Job</div>
                <JobForm initial={job} onSave={handleEdit} onCancel={() => setEditingId(null)} />
              </>
            ) : (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: job.color + '20' }}>
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: job.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-white truncate">{job.name}</span>
                    {isActive && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                        style={{ backgroundColor: job.color + '25', color: job.color }}>
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-xs space-y-0.5" style={{ color: '#6b7280' }}>
                    <div>${job.hourlyRate}/hr · {job.currency}</div>
                    <div>
                      {FILING_STATUS_LABELS[job.filingStatus]} · {job.state}
                      {' · '}{(preview.effectiveRate * 100).toFixed(1)}% eff. rate
                    </div>
                    {job.overtimeEnabled && (
                      <div>OT after {job.dailyOvertimeAfter}h/day · {job.weeklyOvertimeAfter}h/wk at {job.overtimeMultiplier}x</div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setEditingId(job.id)}
                      className="p-1.5 rounded-lg"
                      style={{ backgroundColor: '#1e1e2e' }}
                    >
                      <Pencil size={13} style={{ color: '#9ca3af' }} />
                    </button>
                    {jobs.length > 1 && (
                      <button
                        onClick={() => handleDelete(job.id)}
                        className="p-1.5 rounded-lg"
                        style={{ backgroundColor: '#ef444415' }}
                      >
                        <Trash2 size={13} style={{ color: '#ef4444' }} />
                      </button>
                    )}
                  </div>
                  {!isActive && (
                    <button
                      onClick={() => onSelectJob(job.id)}
                      className="text-xs px-3 py-1 rounded-lg font-semibold text-white"
                      style={{ backgroundColor: job.color }}
                    >
                      Select
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
