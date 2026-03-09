import type { AppSettings } from '../types';
import { saveSettings } from '../store';
import { Palette, Trash2, Info } from 'lucide-react';

interface Props {
  settings: AppSettings;
  onSettingsChanged: () => void;
}

const THEMES = [
  { id: 'midnight' as const, label: 'Midnight', bg: '#0a0a0f', accent: '#6366f1', preview: 'bg-[#0a0a0f]' },
  { id: 'forest' as const, label: 'Forest', bg: '#0a1a0f', accent: '#10b981', preview: 'bg-[#0a1a0f]' },
  { id: 'velvet' as const, label: 'Velvet Rose', bg: '#1a0a0f', accent: '#ec4899', preview: 'bg-[#1a0a0f]' },
];

export function SettingsView({ settings, onSettingsChanged }: Props) {
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

  return (
    <div className="px-4 py-6 space-y-5">
      {/* Theme */}
      <div className="rounded-2xl bg-gray-900 border border-gray-800 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Palette size={16} className="text-gray-400" />
          <span className="font-medium text-sm">Theme</span>
        </div>
        <div className="flex gap-3">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`flex-1 rounded-xl border-2 p-3 flex flex-col items-center gap-2 transition-colors ${
                settings.theme === t.id ? 'border-indigo-500' : 'border-gray-700'
              }`}
              style={{ backgroundColor: t.bg }}
            >
              <div className="w-6 h-6 rounded-full" style={{ backgroundColor: t.accent }} />
              <span className="text-xs font-medium">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* App info */}
      <div className="rounded-2xl bg-gray-900 border border-gray-800 p-4">
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
            <span className="text-white">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span>Storage</span>
            <span className="text-white">Local (on-device)</span>
          </div>
          <div className="flex justify-between">
            <span>Privacy</span>
            <span className="text-emerald-400">100% Offline</span>
          </div>
        </div>
      </div>

      {/* Privacy note */}
      <div className="rounded-2xl bg-indigo-950/40 border border-indigo-900 p-4 text-sm text-indigo-300">
        All your data is stored locally in your browser. Nothing is sent to any server. Your hours and earnings are private.
      </div>

      {/* Danger zone */}
      <div className="rounded-2xl bg-gray-900 border border-red-900/50 p-4">
        <div className="text-sm font-medium text-red-400 mb-3">Danger Zone</div>
        <button
          onClick={clearAllData}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 text-red-400 text-sm font-medium w-full justify-center active:scale-95 transition-transform"
        >
          <Trash2 size={15} /> Clear All Data
        </button>
      </div>
    </div>
  );
}
