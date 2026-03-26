'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { Trash2, AlertTriangle } from 'lucide-react';
import api from '@/lib/api';

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{label}</label>
    {children}
  </div>
);

const inputCls = "w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/40 transition-all";

export default function DangerSettingsPage() {
  const router = useRouter();
  const [mounted, setMounted]       = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting]     = useState(false);
  const [error, setError]           = useState('');

  useEffect(() => {
    setMounted(true);
    if (!localStorage.getItem('token')) router.push('/login');
  }, [router]);

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') return;
    setDeleting(true);
    setError('');
    try {
      await api.delete('/api/organization');
      localStorage.clear();
      router.push('/signup');
    } catch {
      setError('Failed to delete organization. Please try again.');
      setDeleting(false);
    }
  };

  if (!mounted) return null;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-xl">
              <AlertTriangle size={18} className="text-red-500" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Danger zone</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium ml-1">Irreversible actions. Proceed with caution.</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900/50 overflow-hidden">
          <div className="px-8 py-6 border-b border-red-100 dark:border-red-900/50 flex items-center gap-3">
            <div className="p-2 bg-red-50 dark:bg-red-900/30 rounded-xl">
              <AlertTriangle size={18} className="text-red-500" />
            </div>
            <div>
              <h3 className="font-black text-red-600 dark:text-red-400 text-base">Delete organization</h3>
              <p className="text-red-400 dark:text-red-500 text-xs font-medium mt-0.5">This action is permanent and cannot be undone.</p>
            </div>
          </div>

          <div className="px-8 py-6 space-y-5">
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
              Permanently deletes your organization and all associated data — events, attendees,
              email history, templates, and settings. This cannot be reversed.
            </p>

            <div className="p-5 rounded-xl border border-red-100 dark:border-red-900/40 bg-red-50/50 dark:bg-red-900/10 space-y-4">
              <Field label="Type DELETE to confirm">
                <input
                  className={inputCls}
                  placeholder="DELETE"
                  value={confirmText}
                  onChange={e => setConfirmText(e.target.value)}
                />
              </Field>
              {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
              <button
                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={confirmText !== 'DELETE' || deleting}
                onClick={handleDelete}
              >
                <Trash2 size={14} />
                {deleting ? 'Deleting…' : 'Delete my organization'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}