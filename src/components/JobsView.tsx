import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import type { Job } from '../types';
import { saveJob, createJob, deleteJob } from '../store';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'MXN', 'INR', 'BRL'];

interface JobFormProps {
  initial?: Partial<Job>;
  onSave: (j: Omit<Job, 'id'> | Job) => void;
  onCancel: () => void;
}

function JobForm({ initial, onSave, onCancel }: JobFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [rate, setRate] = useState(String(initial?.hourlyRate ?? 15));
  const [currency, setCurrency] = useState(initial?.currency ?? 'USD');
  const [tax, setTax] = useState(String(initial?.taxPercent ?? 22));
  const [otEnabled, setOtEnabled] = useState(initial?.overtimeEnabled ?? true);
  const [dailyOt, setDailyOt] = useState(String(initial?.dailyOvertimeAfter ?? 8));
  const [weeklyOt, setWeeklyOt] = useState(String(initial?.weeklyOvertimeAfter ?? 40));
  const [multiplier, setMultiplier] = useState(String(initial?.overtimeMultiplier ?? 1.5));
  const [color, setColor] = useState(initial?.color ?? COLORS[0]);

  const handleSave = () => {
    if (!name.trim()) return;
    const jobData = {
      name: name.trim(),
      hourlyRate: parseFloat(rate) || 15,
      currency,
      taxPercent: parseFloat(tax) || 0,
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

  const field = (label: string, node: React.ReactNode) => (
    <div>
      <label className="text-xs text-gray-400 mb-1 block">{label}</label>
      {node}
    </div>
  );

  const inputCls = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white";

  return (
    <div className="space-y-4">
      {field('Job Name *',
        <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Retail, Freelance" />
      )}
      <div className="grid grid-cols-2 gap-3">
        {field('Hourly Rate',
          <input type="number" className={inputCls} value={rate} onChange={(e) => setRate(e.target.value)} />
        )}
        {field('Currency',
          <select className={inputCls} value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        {field('Tax %',
          <input type="number" className={inputCls} value={tax} onChange={(e) => setTax(e.target.value)} min="0" max="99" />
        )}
      </div>

      {/* Color */}
      <div>
        <label className="text-xs text-gray-400 mb-2 block">Color</label>
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
      <div className="rounded-xl bg-gray-800 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Overtime</span>
          <button
            onClick={() => setOtEnabled((e) => !e)}
            className={`w-12 h-6 rounded-full transition-colors ${otEnabled ? 'bg-indigo-600' : 'bg-gray-700'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full mx-0.5 transition-transform ${otEnabled ? 'translate-x-6' : ''}`} />
          </button>
        </div>
        {otEnabled && (
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-gray-400">Daily After (hrs)</label>
              <input type="number" className={inputCls + ' mt-1'} value={dailyOt} onChange={(e) => setDailyOt(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-400">Weekly After (hrs)</label>
              <input type="number" className={inputCls + ' mt-1'} value={weeklyOt} onChange={(e) => setWeeklyOt(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-400">Multiplier</label>
              <input type="number" step="0.5" className={inputCls + ' mt-1'} value={multiplier} onChange={(e) => setMultiplier(e.target.value)} />
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={handleSave} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 text-white font-semibold">
          <Check size={16} /> Save Job
        </button>
        <button onClick={onCancel} className="px-5 py-3 rounded-xl bg-gray-800 text-gray-300">
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
    if (id === activeJobId && jobs.length > 1) {
      const next = jobs.find((j) => j.id !== id);
      if (next) onSelectJob(next.id);
    }
    onJobsChanged();
  };

  return (
    <div className="px-4 py-6 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-400 font-medium">{jobs.length} job{jobs.length !== 1 ? 's' : ''}</span>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1 text-sm text-indigo-400 font-medium"
        >
          <Plus size={16} /> Add Job
        </button>
      </div>

      {creating && (
        <div className="rounded-2xl bg-gray-900 border border-indigo-500 p-4">
          <div className="text-sm font-semibold mb-3">New Job</div>
          <JobForm onSave={handleCreate} onCancel={() => setCreating(false)} />
        </div>
      )}

      {jobs.map((job) => (
        <div key={job.id} className={`rounded-xl border p-4 ${job.id === activeJobId ? 'border-indigo-500 bg-indigo-950/30' : 'border-gray-800 bg-gray-900'}`}>
          {editingId === job.id ? (
            <>
              <div className="text-sm font-semibold mb-3">Edit Job</div>
              <JobForm initial={job} onSave={handleEdit} onCancel={() => setEditingId(null)} />
            </>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: job.color }} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{job.name}</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {job.currency} ${job.hourlyRate}/hr · {job.taxPercent}% tax
                  {job.overtimeEnabled && ` · OT after ${job.dailyOvertimeAfter}h`}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {job.id !== activeJobId && (
                  <button
                    onClick={() => onSelectJob(job.id)}
                    className="text-xs px-3 py-1 rounded-lg bg-indigo-600 text-white font-medium"
                  >
                    Select
                  </button>
                )}
                {job.id === activeJobId && (
                  <span className="text-xs text-indigo-400 font-medium">Active</span>
                )}
                <button onClick={() => setEditingId(job.id)} className="text-gray-500 p-1">
                  <Pencil size={14} />
                </button>
                {jobs.length > 1 && (
                  <button onClick={() => handleDelete(job.id)} className="text-red-400/70 p-1">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
