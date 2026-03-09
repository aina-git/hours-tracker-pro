import { useState } from 'react';
import type { AppSettings } from '../types';
import { saveSettings } from '../store';
import { Palette, Trash2, Info, Cloud, CloudOff, RefreshCw, LogOut } from 'lucide-react';
import { isSyncEnabled } from '../lib/supabase';
import { getUserKey, clearUserKey, syncPullAll } from '../lib/sync';
import { restoreShifts, restoreJobs } from '../store';

interface Props {
  settings: AppSettings;
  onSettingsChanged: () => void;
}

const THEMES = [
  { id: 'midnight' as const, label: 'Midnight', bg: '#0a0a0f', accent: '#6366f1' },
  { id: 'forest' as const, label: 'Forest', bg: '#0a1a0f', accent: '#10b981' },
  { id: 'velvet' as const, label: 'Velvet Rose', bg: '#1a0a0f', accent: '#ec4899' },
];

export function SettingsView({ settings, onSettingsChanged }: Props) {
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');
  const userKey = getUserKey();

  const setTheme = (theme: AppSettings['theme']) => {
    const updated = { ...settings, theme };
    saveSettings(updated);
    onSettingsChanged();
  };

  const clearAllData = () => {
    if (!confirm('This will permanently delete ALL shifts, jobs, and settings. Are you sure?')) return;
    localStorage.clear();
    window.location.reload();
  };

  const handleManualSync = async () => {
    if (!userKey) return;
    setSyncing(true);
    setSyncMsg('');
    const { shifts, jobs } = await syncPullAll();
    if (shifts && shifts.length > 0) restoreShifts(shifts);
    if (jobs && jobs.length > 0) restoreJobs(jobs);
    setSyncing(false);
    setSyncMsg(`Synced ${shifts?.length ?? 0} shifts, ${jobs?.length ?? 0} jobs`);
    onSettingsChanged();
    setTimeout(() => setSyncMsg(''), 3000);
  };

  const handleDisconnectSync = () => {
    if (!confirm('Disconnect cloud sync? Your local data is kept.')) return;
    clearUserKey();
    onSettingsChanged();
    window.location.reload();
  };

  return (
    <div className="px-4 py-6 space-y-5">

      {/* Cloud Sync */}
      {isSyncEnabled && (
        <div className="rounded-2xl border p-4 space-y-3"
          style={{ backgroundColor: '#161623', borderColor: '#1e1e2e' }}>
          <div className="flex items-center gap-2">
            {userKey
              ? <Cloud size={16} style={{ color: '#7C6FF7' }} />
              : <CloudOff size={16} className="text-gray-500" />}
            <span className="font-medium text-sm">Cloud Sync</span>
            {userKey && (
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: '#7C6FF720', color: '#7C6FF7' }}>
                Active
              </span>
            )}
          </div>

          {userKey ? (
            <div className="space-y-3">
              <div className="text-sm text-gray-400 flex justify-between">
                <span>Sync key</span>
                <span className="text-white font-mono">{userKey}</span>
              </div>
              <div className="text-xs text-gray-600">
                Use this key on your other devices to access the same data.
              </div>
              <button
                onClick={handleManualSync}
                disabled={syncing}
                className="w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{ backgroundColor: '#7C6FF720', color: '#7C6FF7' }}
              >
                <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
                {syncing ? 'Syncing…' : 'Pull Latest from Cloud'}
              </button>
              {syncMsg && (
                <p className="text-xs text-emerald-400 text-center">{syncMsg}</p>
              )}
              <button
                onClick={handleDisconnectSync}
                className="w-full py-2 text-xs text-gray-600 hover:text-gray-400 flex items-center justify-center gap-1"
              >
                <LogOut size={12} /> Disconnect sync
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-400">Not connected. Restart the app to set up sync.</p>
              <button
                onClick={() => window.location.reload()}
                className="w-full py-2.5 rounded-xl text-sm font-medium"
                style={{ backgroundColor: '#7C6FF7', color: '#fff' }}
              >
                Set Up Sync
              </button>
            </div>
          )}
        </div>
      )}

      {/* Theme */}
      <div className="rounded-2xl border p-4"
        style={{ backgroundColor: '#161623', borderColor: '#1e1e2e' }}>
        <div className="flex items-center gap-2 mb-3">
          <Palette size={16} className="text-gray-400" />
          <span className="font-medium text-sm">Theme</span>
        </div>
        <div className="flex gap-3">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className="flex-1 rounded-xl border-2 p-3 flex flex-col items-center gap-2 transition-colors"
              style={{
                backgroundColor: t.bg,
                borderColor: settings.theme === t.id ? '#7C6FF7' : '#1e1e2e',
              }}
            >
              <div className="w-6 h-6 rounded-full" style={{ backgroundColor: t.accent }} />
              <span className="text-xs font-medium">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* About */}
      <div className="rounded-2xl border p-4"
        style={{ backgroundColor: '#161623', borderColor: '#1e1e2e' }}>
        <div className="flex items-center gap-2 mb-3">
          <Info size={16} className="text-gray-400" />
          <span className="font-medium text-sm">About</span>
        </div>
        <div className="space-y-2 text-sm text-gray-400">
          <div className="flex justify-between">
            <span>App</span>
            <span className="text-white">Hours Tracker Pro</span>
          </div>
          <div className="flex justify-between">
            <span>Version</span>
            <span className="text-white">2.0.0</span>
          </div>
          <div className="flex justify-between">
            <span>Tax Engine</span>
            <span className="text-white">IRS 2025</span>
          </div>
          <div className="flex justify-between">
            <span>Sync</span>
            <span style={{ color: isSyncEnabled && userKey ? '#7C6FF7' : '#6b7280' }}>
              {isSyncEnabled && userKey ? '☁️ Cloud' : '📱 Local only'}
            </span>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="rounded-2xl border p-4"
        style={{ backgroundColor: '#161623', borderColor: '#7f1d1d50' }}>
        <div className="text-sm font-medium text-red-400 mb-3">Danger Zone</div>
        <button
          onClick={clearAllData}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-red-400 text-sm font-medium w-full justify-center"
          style={{ backgroundColor: '#7f1d1d20' }}
        >
          <Trash2 size={15} /> Clear All Data
        </button>
      </div>
    </div>
  );
}
