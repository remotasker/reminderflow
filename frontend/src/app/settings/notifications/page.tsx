'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { Save, CheckCircle2, Bell } from 'lucide-react';

const SectionCard: React.FC<{ title: string; description: string; children: React.ReactNode }> = ({ title, description, children }) => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
    <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800">
      <h3 className="font-black text-slate-900 dark:text-white text-base">{title}</h3>
      <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-0.5">{description}</p>
    </div>
    <div className="px-8 py-6">{children}</div>
  </div>
);

export default function NotificationsSettingsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [prefs, setPrefs] = useState({
    confirmationEmail: true,
    reminder24h: true,
    reminder1h: true,
    reminder10m: false,
    failureAlerts: true,
    weeklySummary: false,
  });

  useEffect(() => {
    setMounted(true);
    if (!localStorage.getItem('token')) router.push('/login');
  }, [router]);

  const toggle = (key: keyof typeof prefs) => setPrefs(p => ({ ...p, [key]: !p[key] }));

  const items = [
    { key: 'confirmationEmail', label: 'Confirmation email',  desc: 'Send immediately when an attendee registers' },
    { key: 'reminder24h',       label: '24-hour reminder',    desc: 'Send 24 hours before the event' },
    { key: 'reminder1h',        label: '1-hour reminder',     desc: 'Send 1 hour before the event' },
    { key: 'reminder10m',       label: '10-minute reminder',  desc: 'Send 10 minutes before the event' },
    { key: 'failureAlerts',     label: 'Failure alerts',      desc: 'Notify when an email fails to send' },
    { key: 'weeklySummary',     label: 'Weekly summary',      desc: 'Receive a weekly digest of activity' },
  ] as const;

  if (!mounted) return null;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <Bell size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Notifications</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium ml-1">Choose which automated emails are sent to attendees.</p>
        </div>

        <SectionCard title="Email reminder schedule" description="Toggle each reminder type on or off for all events.">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {items.map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{label}</p>
                  <p className="text-xs text-slate-400 font-medium">{desc}</p>
                </div>
                <button
                  onClick={() => toggle(key)}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${prefs[key] ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${prefs[key] ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center gap-3">
            <button
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-blue-500/20"
              onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2500); }}
            >
              <Save size={14} /> Save preferences
            </button>
            {saved && <span className="flex items-center gap-1.5 text-green-600 text-xs font-bold"><CheckCircle2 size={14} /> Saved!</span>}
          </div>
        </SectionCard>
      </div>
    </Layout>
  );
}