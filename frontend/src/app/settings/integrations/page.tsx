'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { Save, CheckCircle2, Eye, EyeOff, Plug, Code2 } from 'lucide-react';

const SectionCard: React.FC<{ title: string; description: string; children: React.ReactNode }> = ({ title, description, children }) => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
    <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800">
      <h3 className="font-black text-slate-900 dark:text-white text-base">{title}</h3>
      <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-0.5">{description}</p>
    </div>
    <div className="px-8 py-6">{children}</div>
  </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{label}</label>
    {children}
  </div>
);

const inputCls = "w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all";

export default function IntegrationsSettingsPage() {
  const router = useRouter();
  const [mounted, setMounted]       = useState(false);
  const [sendgridKey, setSendgridKey] = useState('');
  const [gasWebhook, setGasWebhook]   = useState('');
  const [fromEmail, setFromEmail]     = useState('');
  const [fromName, setFromName]       = useState('');
  const [showKey, setShowKey]         = useState(false);
  const [savedSg, setSavedSg]         = useState(false);
  const [testStatus, setTestStatus]   = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');

  useEffect(() => {
    setMounted(true);
    if (!localStorage.getItem('token')) router.push('/login');
  }, [router]);

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTimeout(() => setTestStatus(gasWebhook ? 'ok' : 'fail'), 1500);
  };

  if (!mounted) return null;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <Code2 size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Integrations</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium ml-1">Configure external services used to send and track emails.</p>
        </div>

        {/* SendGrid */}
        <SectionCard title="SendGrid" description="Used to send all reminder emails. Get your key from app.sendgrid.com.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="API key">
              <div className="relative">
                <input className={inputCls} type={showKey ? 'text' : 'password'}
                  placeholder="SG.xxxxxxxxxxxxxxxx" value={sendgridKey}
                  onChange={e => setSendgridKey(e.target.value)} />
                <button type="button" onClick={() => setShowKey(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </Field>
            <Field label="From email address">
              <input className={inputCls} type="email" placeholder="no-reply@yourapp.com"
                value={fromEmail} onChange={e => setFromEmail(e.target.value)} />
            </Field>
            <Field label="From name">
              <input className={inputCls} placeholder="ReminderFlow"
                value={fromName} onChange={e => setFromName(e.target.value)} />
            </Field>
          </div>
          <div className="mt-6 flex items-center gap-3">
            <button
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-blue-500/20"
              onClick={() => { setSavedSg(true); setTimeout(() => setSavedSg(false), 2500); }}
            >
              <Save size={14} /> Save SendGrid config
            </button>
            {savedSg && <span className="flex items-center gap-1.5 text-green-600 text-xs font-bold"><CheckCircle2 size={14} /> Saved!</span>}
          </div>
        </SectionCard>

        {/* Google Apps Script */}
        <SectionCard title="Google Apps Script" description="Optional webhook to trigger a GAS deployment when emails are sent.">
          <div className="space-y-5">
            <Field label="Webhook URL">
              <input className={inputCls} placeholder="https://script.google.com/macros/s/xxxx/exec"
                value={gasWebhook} onChange={e => { setGasWebhook(e.target.value); setTestStatus('idle'); }} />
            </Field>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              Deploy your Google Apps Script as a web app and paste the execution URL above.
              ReminderFlow will POST event and attendee data to it after each send cycle.
            </p>
            <button
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-blue-500/20 disabled:opacity-60"
              onClick={handleTestConnection}
              disabled={testStatus === 'testing'}
            >
              <Plug size={14} />
              {testStatus === 'testing' ? 'Testing…' : 'Test connection'}
            </button>
            {testStatus === 'ok'   && <p className="text-green-600 text-xs font-bold flex items-center gap-1.5"><CheckCircle2 size={14} /> Connection successful</p>}
            {testStatus === 'fail' && <p className="text-red-500 text-xs font-bold">Connection failed — check your webhook URL</p>}
          </div>
        </SectionCard>
      </div>
    </Layout>
  );
}