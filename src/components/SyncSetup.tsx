import { useState } from 'react';
import { getUserKey, setUserKey } from '../lib/sync';
import { isSyncEnabled } from '../lib/supabase';
import { restoreShifts, restoreJobs } from '../store';
import { syncPullAll } from '../lib/sync';

interface Props {
  onDone: () => void;
}

export function SyncSetup({ onDone }: Props) {
  const [step, setStep] = useState<'choose' | 'enter' | 'loading' | 'done'>('choose');
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [isNew, setIsNew] = useState(false);

  if (!isSyncEnabled) {
    return null;
  }

  const existing = getUserKey();
  if (existing) return null;

  async function handleSubmit() {
    if (key.trim().length < 4) {
      setError('Sync key must be at least 4 characters.');
      return;
    }
    setError('');
    setStep('loading');
    setUserKey(key.trim());

    if (!isNew) {
      // Existing device: pull data from cloud
      const { shifts, jobs } = await syncPullAll();
      if (shifts && shifts.length > 0) restoreShifts(shifts);
      if (jobs && jobs.length > 0) restoreJobs(jobs);
    }

    setStep('done');
    setTimeout(onDone, 1200);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 space-y-5"
        style={{ backgroundColor: '#161623', border: '1px solid #1e1e2e' }}
      >
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="text-3xl">☁️</div>
          <h2 className="text-white text-lg font-bold">Set Up Sync</h2>
          <p className="text-gray-400 text-sm">
            Sync your shifts across all your devices
          </p>
        </div>

        {step === 'choose' && (
          <div className="space-y-3">
            <button
              onClick={() => { setIsNew(true); setStep('enter'); }}
              className="w-full py-3 rounded-xl font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#7C6FF7' }}
            >
              This is my first device
            </button>
            <button
              onClick={() => { setIsNew(false); setStep('enter'); }}
              className="w-full py-3 rounded-xl font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#1e1e2e', border: '1px solid #2e2e3e' }}
            >
              I already use this app on another device
            </button>
            <button
              onClick={onDone}
              className="w-full py-2 text-sm text-gray-500 hover:text-gray-400 transition-colors"
            >
              Skip for now (local only)
            </button>
          </div>
        )}

        {step === 'enter' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-400">
                {isNew
                  ? 'Create a sync key — you\'ll enter this on your other devices'
                  : 'Enter the sync key from your other device'}
              </label>
              <input
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder={isNew ? 'e.g. myname2026' : 'Enter your sync key'}
                autoFocus
                className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-600 outline-none"
                style={{
                  backgroundColor: '#0d0d14',
                  border: '1px solid #2e2e3e',
                  fontSize: '1rem',
                }}
              />
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <p className="text-xs text-gray-600">
                {isNew
                  ? 'This key is your password — write it down. Anyone with it can access your data.'
                  : 'Use the same key you created on your first device.'}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep('choose')}
                className="flex-1 py-3 rounded-xl text-gray-400 font-medium"
                style={{ backgroundColor: '#1e1e2e' }}
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 py-3 rounded-xl text-white font-semibold"
                style={{ backgroundColor: '#7C6FF7' }}
              >
                {isNew ? 'Start Syncing' : 'Restore & Sync'}
              </button>
            </div>
          </div>
        )}

        {step === 'loading' && (
          <div className="text-center py-6 space-y-3">
            <div
              className="w-10 h-10 rounded-full border-4 border-t-transparent mx-auto animate-spin"
              style={{ borderColor: '#7C6FF7', borderTopColor: 'transparent' }}
            />
            <p className="text-gray-400 text-sm">
              {isNew ? 'Setting up sync…' : 'Pulling your data from cloud…'}
            </p>
          </div>
        )}

        {step === 'done' && (
          <div className="text-center py-4 space-y-2">
            <div className="text-4xl">✅</div>
            <p className="text-white font-semibold">Sync enabled!</p>
            <p className="text-gray-400 text-sm">Your data will stay in sync across all devices.</p>
          </div>
        )}
      </div>
    </div>
  );
}
