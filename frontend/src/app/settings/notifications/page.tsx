'use client';

import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthUser } from '@/hooks/useAuthUser';
import { Save, CheckCircle2, Bell, Loader2, AlertTriangle } from 'lucide-react';

type NotificationPrefs = {
  confirmationEmail: boolean;
  reminder24h: boolean;
  reminder1h: boolean;
  reminder10m: boolean;
  failureAlerts: boolean;
  weeklySummary: boolean;
};

const DEFAULT_PREFS: NotificationPrefs = {
  confirmationEmail: true,
  reminder24h: true,
  reminder1h: true,
  reminder10m: false,
  failureAlerts: true,
  weeklySummary: false,
};

const SectionCard: React.FC<{ title: string; description: string; children: React.ReactNode }> = ({ title, description, children }) => (
  <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
    <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/10">
      <h3 className="font-medium text-slate-900 dark:text-white text-base tracking-tight">{title}</h3>
      <p className="text-slate-500 dark:text-slate-400 text-sm font-normal mt-0.5">{description}</p>
    </div>
    <div className="p-6 sm:p-8">{children}</div>
  </div>
);

function readNotificationPrefs(settings: unknown): NotificationPrefs {
  if (!settings || typeof settings !== 'object') return DEFAULT_PREFS;

  const notifications = (settings as Record<string, unknown>).notifications;
  if (!notifications || typeof notifications !== 'object') return DEFAULT_PREFS;

  return {
    confirmationEmail: typeof (notifications as Record<string, unknown>).confirmationEmail === 'boolean' ? (notifications as Record<string, boolean>).confirmationEmail : DEFAULT_PREFS.confirmationEmail,
    reminder24h: typeof (notifications as Record<string, unknown>).reminder24h === 'boolean' ? (notifications as Record<string, boolean>).reminder24h : DEFAULT_PREFS.reminder24h,
    reminder1h: typeof (notifications as Record<string, unknown>).reminder1h === 'boolean' ? (notifications as Record<string, boolean>).reminder1h : DEFAULT_PREFS.reminder1h,
    reminder10m: typeof (notifications as Record<string, unknown>).reminder10m === 'boolean' ? (notifications as Record<string, boolean>).reminder10m : DEFAULT_PREFS.reminder10m,
    failureAlerts: typeof (notifications as Record<string, unknown>).failureAlerts === 'boolean' ? (notifications as Record<string, boolean>).failureAlerts : DEFAULT_PREFS.failureAlerts,
    weeklySummary: typeof (notifications as Record<string, unknown>).weeklySummary === 'boolean' ? (notifications as Record<string, boolean>).weeklySummary : DEFAULT_PREFS.weeklySummary,
  };
}

export default function NotificationsSettingsPage() {
  const { user, loading: userLoading } = useAuthUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!isAdmin && !userLoading) {
      setLoading(false);
      return;
    }

    if (!isAdmin) return;

    let cancelled = false;

    api.get('/api/org/settings')
      .then(({ data }) => {
        if (!cancelled) setPrefs(readNotificationPrefs(data));
      })
      .catch((err: any) => {
        if (!cancelled) toast.error(err.response?.data?.error || 'Failed to load notification settings');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAdmin, userLoading]);

  const toggle = (key: keyof NotificationPrefs) => setPrefs((current) => ({ ...current, [key]: !current[key] }));

  const handleSave = async () => {
    setSaving(true);

    try {
      await api.post('/api/org/settings', { notifications: prefs });
      setSaved(true);
      toast.success('Notification settings saved');
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save notification settings');
    } finally {
      setSaving(false);
    }
  };

  const items = [
    { key: 'confirmationEmail', label: 'Confirmation email', desc: 'Send immediately when an attendee registers' },
    { key: 'reminder24h', label: '24-hour reminder', desc: 'Send 24 hours before the event' },
    { key: 'reminder1h', label: '1-hour reminder', desc: 'Send 1 hour before the event' },
    { key: 'reminder10m', label: '10-minute reminder', desc: 'Send 10 minutes before the event' },
    { key: 'failureAlerts', label: 'Failure alerts', desc: 'Notify when an email fails to send' },
    { key: 'weeklySummary', label: 'Weekly summary', desc: 'Receive a weekly digest of activity' },
  ] as const;

  if (loading || userLoading) {
    return (
      <Layout>
        <div className="flex flex-col h-[60vh] items-center justify-center text-slate-400">
          <Loader2 className="animate-spin mb-4 text-slate-300 dark:text-slate-600" size={32} />
          <p className="text-sm font-medium">Loading notification settings...</p>
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
          <div className="rounded-[20px] border border-amber-200 bg-amber-50 p-6 flex items-start gap-3 shadow-sm dark:border-amber-900/50 dark:bg-amber-900/10">
            <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-amber-800 dark:text-amber-300">Access Restricted</h3>
              <p className="text-sm text-amber-700/80 dark:text-amber-400/80 mt-1">Admin access is required to change organization-wide notification rules.</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12 px-4 sm:px-6 md:px-8 mt-2">
        
        {/* --- Header --- */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-100/50 dark:border-blue-800/50 shadow-sm">
            <Bell size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-medium text-slate-900 dark:text-white tracking-tight">Notifications</h1>
            <p className="text-sm text-slate-500 font-normal mt-1">Choose which automated emails are sent to attendees.</p>
          </div>
        </div>

        {/* --- Configuration Card --- */}
        <SectionCard title="Email reminder schedule" description="Toggle each reminder type on or off for all events.">
          <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {items.map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between py-4 sm:py-5 first:pt-0 last:pb-0">
                <div className="pr-4">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-200">{label}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-normal mt-0.5">{desc}</p>
                </div>
                <button
                  onClick={() => toggle(key)}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:focus:ring-offset-slate-900 shrink-0 ${
                    prefs[key] ? 'bg-slate-900 dark:bg-white' : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                  aria-label={`Toggle ${label}`}
                >
                  <span 
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow transition-transform duration-200 ${
                      prefs[key] ? 'translate-x-5 bg-white dark:bg-slate-900' : 'translate-x-0 bg-white dark:bg-slate-500'
                    }`} 
                  />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/50 flex items-center gap-4">
            <button
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium rounded-xl transition-all shadow-sm disabled:opacity-60 active:scale-95 disabled:active:scale-100 w-full sm:w-auto"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? 'Saving...' : 'Save preferences'}
            </button>
            {saved && (
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                <CheckCircle2 size={16} /> Configuration Saved
              </span>
            )}
          </div>
        </SectionCard>
      </div>
    </Layout>
  );
}