import { useState, useEffect, useCallback } from 'react';
import type { Job, AppSettings } from './types';
import { getJobs, getSettings, saveSettings } from './store';
import { HomeView } from './components/HomeView';
import { ShiftsView } from './components/ShiftsView';
import { JobsView } from './components/JobsView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';

// SVG icons matching the original app's tab bar
const IconHome = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"
      stroke={active ? '#7C6FF7' : '#6b7280'} strokeWidth="1.8"
      fill={active ? '#7C6FF720' : 'none'} strokeLinejoin="round"/>
    <path d="M9 21V12h6v9" stroke={active ? '#7C6FF7' : '#6b7280'} strokeWidth="1.8" strokeLinejoin="round"/>
  </svg>
);
const IconCalendar = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="4" width="18" height="17" rx="2"
      stroke={active ? '#7C6FF7' : '#6b7280'} strokeWidth="1.8"/>
    <path d="M3 9h18M8 2v4M16 2v4" stroke={active ? '#7C6FF7' : '#6b7280'} strokeWidth="1.8" strokeLinecap="round"/>
    <circle cx="8" cy="14" r="1" fill={active ? '#7C6FF7' : '#6b7280'}/>
    <circle cx="12" cy="14" r="1" fill={active ? '#7C6FF7' : '#6b7280'}/>
    <circle cx="16" cy="14" r="1" fill={active ? '#7C6FF7' : '#6b7280'}/>
  </svg>
);
const IconBriefcase = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect x="2" y="8" width="20" height="13" rx="2"
      stroke={active ? '#7C6FF7' : '#6b7280'} strokeWidth="1.8"/>
    <path d="M8 8V6a2 2 0 012-2h4a2 2 0 012 2v2"
      stroke={active ? '#7C6FF7' : '#6b7280'} strokeWidth="1.8"/>
    <path d="M2 14h20" stroke={active ? '#7C6FF7' : '#6b7280'} strokeWidth="1.8"/>
  </svg>
);
const IconChart = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M4 20V14M8 20V10M12 20V4M16 20V12M20 20V8"
      stroke={active ? '#7C6FF7' : '#6b7280'} strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);
const IconSettings = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="3" stroke={active ? '#7C6FF7' : '#6b7280'} strokeWidth="1.8"/>
    <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
      stroke={active ? '#7C6FF7' : '#6b7280'} strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

type Tab = 'home' | 'shifts' | 'jobs' | 'reports' | 'settings';

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

  useEffect(() => { refresh(); }, []);

  const activeJob = jobs.find((j) => j.id === settings.activeJobId) ?? jobs[0];

  const selectJob = (id: string) => {
    const updated = { ...settings, activeJobId: id };
    saveSettings(updated);
    setSettings(updated);
    setRefreshKey((k) => k + 1);
  };

  if (!activeJob) return null;

  const navItems: { id: Tab; icon: (a: boolean) => React.ReactNode; label: string }[] = [
    { id: 'home',     icon: (a) => <IconHome active={a} />,       label: 'Home' },
    { id: 'shifts',   icon: (a) => <IconCalendar active={a} />,   label: 'Shifts' },
    { id: 'jobs',     icon: (a) => <IconBriefcase active={a} />,  label: 'Jobs' },
    { id: 'reports',  icon: (a) => <IconChart active={a} />,      label: 'Reports' },
    { id: 'settings', icon: (a) => <IconSettings active={a} />,   label: 'Settings' },
  ];

  return (
    <div className="flex flex-col min-h-dvh max-w-md mx-auto" style={{ backgroundColor: '#111118' }}>
      <div style={{ paddingTop: 'env(safe-area-inset-top)' }} />

      {/* Job selector bar — top of screen */}
      {(tab === 'home' || tab === 'shifts') && (
        <div className="px-4 pt-3 pb-1 flex items-center gap-2">
          {jobs.map((j) => (
            <button
              key={j.id}
              onClick={() => selectJob(j.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
              style={{
                backgroundColor: j.id === settings.activeJobId ? j.color + '33' : '#1e1e2e',
                color: j.id === settings.activeJobId ? '#fff' : '#9ca3af',
                border: `1px solid ${j.id === settings.activeJobId ? j.color : '#2a2a3a'}`,
              }}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: j.color }}
              />
              {j.name}
            </button>
          ))}
          <button
            onClick={() => setTab('jobs')}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 flex-shrink-0"
            style={{ backgroundColor: '#1e1e2e', border: '1px solid #2a2a3a' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {tab === 'home' && (
          <HomeView job={activeJob} onRefresh={refresh} refreshKey={refreshKey} />
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

      {/* Bottom tab bar */}
      <nav
        className="flex border-t"
        style={{
          backgroundColor: '#0d0d14',
          borderColor: '#1e1e2e',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {navItems.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className="flex-1 flex flex-col items-center py-2.5 gap-0.5 active:opacity-70 transition-opacity"
            >
              {item.icon(active)}
              <span
                className="text-[10px] font-medium"
                style={{ color: active ? '#7C6FF7' : '#6b7280' }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
