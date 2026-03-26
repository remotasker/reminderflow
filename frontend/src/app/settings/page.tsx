'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { Save, CheckCircle2, Building2 } from 'lucide-react';

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

export default function SettingsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [saved, setSaved]     = useState(false);
  const [form, setForm]       = useState({ name: '', slug: '', website: '' });

  useEffect(() => {
    setMounted(true);
    if (!localStorage.getItem('token')) router.push('/login');
  }, [router]);

  if (!mounted) return null;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <Building2 size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Organization</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium ml-1">Update your organization's profile and public details.</p>
        </div>

        <SectionCard title="Organization profile" description="These details identify your organization across ReminderFlow.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Organization name">
              <input className={inputCls} placeholder="Acme Inc." value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </Field>
            <Field label="Slug">
              <input className={inputCls} placeholder="acme-inc" value={form.slug}
                onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} />
            </Field>
            <Field label="Website">
              <input className={inputCls} placeholder="https://acme.com" value={form.website}
                onChange={e => setForm(p => ({ ...p, website: e.target.value }))} />
            </Field>
          </div>
          <div className="mt-6 flex items-center gap-3">
            <button
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-blue-500/20"
              onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2500); }}
            >
              <Save size={14} /> Save changes
            </button>
            {saved && <span className="flex items-center gap-1.5 text-green-600 text-xs font-bold"><CheckCircle2 size={14} /> Saved!</span>}
          </div>
        </SectionCard>
      </div>
    </Layout>
  );
}