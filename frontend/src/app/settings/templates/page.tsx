'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { Save, CheckCircle2, FileCode2, Mail } from 'lucide-react';

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

const DEFAULT_TEMPLATES: Record<string, { subject: string; body: string }> = {
  confirmation: {
    subject: "You're registered for {{event_title}}",
    body: `Hi {{name}},\n\nThanks for registering for {{event_title}}.\n\nDate: {{event_date}}\nTime: {{event_time}}\nLink: {{meeting_link}}\n\nSee you there!`,
  },
  '24h': {
    subject: 'Reminder: {{event_title}} is tomorrow',
    body: `Hi {{name}},\n\nJust a reminder that {{event_title}} is tomorrow.\n\nDate: {{event_date}}\nTime: {{event_time}}\nLink: {{meeting_link}}`,
  },
  '1h': {
    subject: '{{event_title}} starts in 1 hour',
    body: `Hi {{name}},\n\n{{event_title}} starts in 1 hour. Get ready!\n\nLink: {{meeting_link}}`,
  },
  '10m': {
    subject: '{{event_title}} starts in 10 minutes!',
    body: `Hi {{name}},\n\n{{event_title}} is starting in just 10 minutes.\n\nJoin now: {{meeting_link}}`,
  },
};

export default function TemplatesSettingsPage() {
  const router = useRouter();
  const [mounted, setMounted]       = useState(false);
  const [active, setActive]         = useState('confirmation');
  const [templates, setTemplates]   = useState(DEFAULT_TEMPLATES);
  const [saved, setSaved]           = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!localStorage.getItem('token')) router.push('/login');
  }, [router]);

  const update = (field: 'subject' | 'body', val: string) =>
    setTemplates(p => ({ ...p, [active]: { ...p[active], [field]: val } }));

  const tabs = [
    { key: 'confirmation', label: 'Confirmation' },
    { key: '24h',          label: '24h reminder' },
    { key: '1h',           label: '1h reminder'  },
    { key: '10m',          label: '10m reminder' },
  ];

  const variables = ['{{name}}', '{{event_title}}', '{{event_date}}', '{{event_time}}', '{{meeting_link}}'];

  if (!mounted) return null;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <Mail size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Email templates</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium ml-1">Customise the subject and body for each reminder type.</p>
        </div>

        <SectionCard title="Template editor" description="Edit each reminder template. Use the variable pills to insert dynamic content.">
          {/* Type tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setActive(t.key)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  active === t.key
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Variable pills */}
          <div className="flex flex-wrap gap-2 mb-5">
            {variables.map(v => (
              <span key={v} className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[11px] font-black rounded-lg font-mono">
                {v}
              </span>
            ))}
          </div>

          <div className="space-y-4">
            <Field label="Subject line">
              <input className={inputCls} value={templates[active].subject}
                onChange={e => update('subject', e.target.value)} />
            </Field>
            <Field label="Email body">
              <textarea rows={10}
                className={`${inputCls} resize-none font-mono text-xs leading-relaxed`}
                value={templates[active].body}
                onChange={e => update('body', e.target.value)} />
            </Field>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-blue-500/20"
              onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2500); }}
            >
              <Save size={14} /> Save template
            </button>
            <button
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-black rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              onClick={() => setTemplates(p => ({ ...p, [active]: DEFAULT_TEMPLATES[active] }))}
            >
              <FileCode2 size={14} /> Reset to default
            </button>
            {saved && <span className="flex items-center gap-1.5 text-green-600 text-xs font-bold"><CheckCircle2 size={14} /> Saved!</span>}
          </div>
        </SectionCard>
      </div>
    </Layout>
  );
}