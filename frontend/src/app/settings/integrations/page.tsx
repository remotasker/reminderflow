'use client';

import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthUser } from '@/hooks/useAuthUser';
import { Save, CheckCircle2, Eye, EyeOff, Plug, Code2, Loader2, AlertTriangle } from 'lucide-react';

const SectionCard: React.FC<{ title: string; description: string; children: React.ReactNode }> = ({ title, description, children }) => (
  <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
    <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/10">
      <h3 className="font-medium text-slate-900 dark:text-white text-base tracking-tight">{title}</h3>
      <p className="text-slate-500 dark:text-slate-400 text-sm font-normal mt-0.5">{description}</p>
    </div>
    <div className="p-6 sm:p-8">{children}</div>
  </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-2">
    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    {children}
  </div>
);

const inputCls = 'w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm font-normal text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-slate-400 dark:focus:border-slate-500 transition-all';

function readIntegrationSetting(settings: unknown, key: 'sendgridApiKey' | 'sendgridFromEmail' | 'sendgridFromName' | 'googleAppsScriptWebhook'): string {
  if (!settings || typeof settings !== 'object') return '';

  const integrations = (settings as Record<string, unknown>).integrations;
  if (!integrations || typeof integrations !== 'object') return '';

  const value = (integrations as Record<string, unknown>)[key];
  return typeof value === 'string' ? value : '';
}

export default function IntegrationsSettingsPage() {
  const { user, loading: userLoading } = useAuthUser();
  const [loading, setLoading] = useState(true);
  const [sendgridKey, setSendgridKey] = useState('');
  const [gasWebhook, setGasWebhook] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [fromName, setFromName] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSg, setSavedSg] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');
  const [testMessage, setTestMessage] = useState('');

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
        if (cancelled) return;

        setSendgridKey(readIntegrationSetting(data, 'sendgridApiKey'));
        setFromEmail(readIntegrationSetting(data, 'sendgridFromEmail'));
        setFromName(readIntegrationSetting(data, 'sendgridFromName'));
        setGasWebhook(readIntegrationSetting(data, 'googleAppsScriptWebhook'));
      })
      .catch((err: any) => {
        if (!cancelled) toast.error(err.response?.data?.error || 'Failed to load integration settings');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAdmin, userLoading]);

  const handleSave = async () => {
    setSaving(true);

    try {
      await api.post('/api/org/settings', {
        integrations: {
          sendgridApiKey: sendgridKey,
          sendgridFromEmail: fromEmail,
          sendgridFromName: fromName,
          googleAppsScriptWebhook: gasWebhook,
        },
      });

      setSavedSg(true);
      toast.success('Integration settings saved');
      setTimeout(() => setSavedSg(false), 2500);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save integration settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestMessage('');

    try {
      const { data } = await api.post('/api/org/integrations/test-webhook', { url: gasWebhook });
      setTestStatus('ok');
      setTestMessage(`Webhook responded with HTTP ${data.status}`);
    } catch (err: any) {
      setTestStatus('fail');
      setTestMessage(err.response?.data?.error || 'Connection failed');
    }
  };

  if (loading || userLoading) {
    return (
      <Layout>
        <div className="flex flex-col h-[60vh] items-center justify-center text-slate-400">
          <Loader2 className="animate-spin mb-4 text-slate-300 dark:text-slate-600" size={32} />
          <p className="text-sm font-medium">Loading integrations...</p>
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
              <p className="text-sm text-amber-700/80 dark:text-amber-400/80 mt-1">Admin access is required to manage integration credentials and webhooks.</p>
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
            <Code2 size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-medium text-slate-900 dark:text-white tracking-tight">Integrations</h1>
            <p className="text-sm text-slate-500 font-normal mt-1">Configure external services used to send and track emails.</p>
          </div>
        </div>

        {/* --- SendGrid Config --- */}
        <SectionCard title="SendGrid Configuration" description="Used by the worker to send reminder emails for this organization.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="API key">
              <div className="relative">
                <input
                  className={inputCls}
                  type={showKey ? 'text' : 'password'}
                  placeholder="SG.xxxxxxxxxxxxxxxx"
                  value={sendgridKey}
                  onChange={(e) => setSendgridKey(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowKey((current) => !current)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  aria-label={showKey ? 'Hide API key' : 'Show API key'}
                >
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>
            
            <Field label="From email address">
              <input className={inputCls} type="email" placeholder="no-reply@yourapp.com" value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} />
            </Field>
            
            <div className="md:col-span-2">
              <Field label="From name">
                <input className={inputCls} placeholder="ReminderFlow Events" value={fromName} onChange={(e) => setFromName(e.target.value)} />
              </Field>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-4">
            <button
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium rounded-xl transition-all shadow-sm disabled:opacity-60 active:scale-95 disabled:active:scale-100"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? 'Saving...' : 'Save SendGrid config'}
            </button>
            {savedSg && <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-medium"><CheckCircle2 size={16} /> Configuration Saved</span>}
          </div>
        </SectionCard>

        {/* --- Google Apps Script Config --- */}
        <SectionCard title="Google Apps Script (GAS)" description="Optional webhook triggered from ReminderFlow when you want to fan out data to a GAS deployment.">
          <div className="space-y-6">
            <Field label="Webhook URL">
              <input
                className={inputCls}
                placeholder="https://script.google.com/macros/s/xxxx/exec"
                value={gasWebhook}
                onChange={(e) => {
                  setGasWebhook(e.target.value);
                  setTestStatus('idle');
                  setTestMessage('');
                }}
              />
            </Field>
            
            <p className="text-sm text-slate-500 font-normal leading-relaxed bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800/50">
              We send a small JSON test payload to this endpoint when you click "Test connection". Verify your GAS deployment is set to receive <code className="bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600 text-xs font-mono text-slate-700 dark:text-slate-300">POST</code> requests.
            </p>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
              <button
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium rounded-xl transition-all shadow-sm disabled:opacity-60 active:scale-95 disabled:active:scale-100"
                onClick={handleSave}
                disabled={saving}
              >
                <Save size={16} /> Save Webhook
              </button>

              <button
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl transition-all shadow-sm disabled:opacity-60 active:scale-95 disabled:active:scale-100"
                onClick={handleTestConnection}
                disabled={testStatus === 'testing' || !gasWebhook}
              >
                {testStatus === 'testing' ? <Loader2 size={16} className="animate-spin" /> : <Plug size={16} />}
                {testStatus === 'testing' ? 'Testing...' : 'Test connection'}
              </button>
            </div>

            {testStatus === 'ok' && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 rounded-xl flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-sm font-medium">
                <CheckCircle2 size={16} /> {testMessage}
              </div>
            )}
            
            {testStatus === 'fail' && (
              <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30 rounded-xl flex items-center gap-2 text-red-600 dark:text-red-400 text-sm font-medium">
                <AlertTriangle size={16} /> {testMessage}
              </div>
            )}
          </div>
        </SectionCard>
      </div>
    </Layout>
  );
}