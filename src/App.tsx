import { useState, useEffect, useCallback } from 'react';
import { Home, List, Briefcase, BarChart2, Settings } from 'lucide-react';
import type { Job, AppSettings } from './types';
import { getJobs, getSettings, saveSettings } from './store';
import { HomeView } from './components/HomeView';
import { ShiftsView } from './components/ShiftsView';
import { JobsView } from './components/JobsView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';

type Tab = 'home' | 'shifts' | 'jobs' | 'reports' | 'settings';

const THEME_VARS: Record<AppSettings['theme'], { bg: string; accent: string; nav: string }> = {
  midnight: { bg: '#0a0a0f', accent: '#6366f1', nav: '#0f0f1a' },
  forest:   { bg: '#0a1a0f', accent: '#10b981', nav: '#0a1a10' },
  velvet:   { bg: '#1a0a0f', accent: '#ec4899', nav: '#1a0a10' },
};

export default function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setJobs(getJobs());
    setSettings(getSettings());
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    refresh();
  }, []);

  const activeJob = jobs.find((j) => j.id === settings.activeJobId) ?? jobs[0];

  const selectJob = (id: string) => {
    const updated = { ...settings, activeJobId: id };
    saveSettings(updated);
    setSettings(updated);
    setRefreshKey((k) => k + 1);
  };

  const theme = THEME_VARS[settings.theme];

  const navItems: { id: Tab; icon: React.ReactNode; label: string }[] = [
    { id: 'home',     icon: <Home size={22} />,       label: 'Home' },
    { id: 'shifts',   icon: <List size={22} />,       label: 'Shifts' },
    { id: 'jobs',     icon: <Briefcase size={22} />,  label: 'Jobs' },
    { id: 'reports',  icon: <BarChart2 size={22} />,  label: 'Reports' },
    { id: 'settings', icon: <Settings size={22} />,   label: 'Settings' },
  ];

  if (!activeJob) return null;

  return (
    <div
      className="flex flex-col min-h-dvh max-w-md mx-auto"
      style={{ backgroundColor: theme.bg }}
    >
      {/* Status bar spacer */}
      <div style={{ paddingTop: 'env(safe-area-inset-top)' }} />

      {/* Header */}
      <header
        className="px-4 py-3 flex items-center justify-between border-b border-white/5"
        style={{ backgroundColor: theme.nav }}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: theme.accent }}>
            <span className="text-white text-xs font-bold">HT</span>
          </div>
          <span className="font-semibold text-base">Hours Tracker Pro</span>
        </div>
        {tab !== 'jobs' && tab !== 'settings' && (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: activeJob.color }} />
            <span className="text-sm text-gray-400 truncate max-w-[120px]">{activeJob.name}</span>
          </div>
        )}
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        {tab === 'home' && (
          <HomeView job={activeJob} onRefresh={refresh} />
        )}
        {tab === 'shifts' && (
          <ShiftsView job={activeJob} refreshKey={refreshKey} />
        )}
        {tab === 'jobs' && (
          <JobsView
            jobs={jobs}
            activeJobId={settings.activeJobId}
            onSelectJob={selectJob}
            onJobsChanged={refresh}
          />
        )}
        {tab === 'reports' && (
          <ReportsView job={activeJob} refreshKey={refreshKey} />
        )}
        {tab === 'settings' && (
          <SettingsView settings={settings} onSettingsChanged={refresh} />
        )}
      </main>

      {/* Bottom nav */}
      <nav
        className="border-t border-white/5 flex"
        style={{
          backgroundColor: theme.nav,
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {navItems.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className="flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors active:scale-95"
              style={{ color: active ? theme.accent : '#6b7280' }}
            >
              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
