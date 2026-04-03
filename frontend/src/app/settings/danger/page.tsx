'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { clearAuthState } from '@/lib/auth';
import { useAuthUser } from '@/hooks/useAuthUser';

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-2">
    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    {children}
  </div>
);

const inputCls = 'w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-normal text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-red-400 dark:focus:border-red-500 transition-all';

export default function DangerSettingsPage() {
  const router = useRouter();
  const { user, loading } = useAuthUser();
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = user?.role === 'admin';

  const handleDelete = async () => {
    if (confirmText !== 'DELETE' || !password) return;
    setDeleting(true);
    setError('');

    try {
      // Pass the password in the payload so the backend can verify it
      await api.delete('/api/org', { data: { password } });
      clearAuthState();
      router.push('/signup');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete organization. Please check your password and try again.');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col h-[60vh] items-center justify-center text-slate-400">
          <Loader2 className="animate-spin mb-4 text-slate-300 dark:text-slate-600" size={32} />
          <p className="text-sm font-medium">Loading danger zone...</p>
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
              <p className="text-sm text-amber-700/80 dark:text-amber-400/80 mt-1">Admin access is required to perform destructive organization actions.</p>
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
          <div className="p-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-100/50 dark:border-red-800/50 shadow-sm">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-medium text-slate-900 dark:text-white tracking-tight">Danger Zone</h1>
            <p className="text-sm text-slate-500 font-normal mt-1">Irreversible actions. Proceed with caution.</p>
          </div>
        </div>

        {/* --- Warning Card --- */}
        <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-red-200/80 dark:border-red-900/50 shadow-sm overflow-hidden">
          
          <div className="px-6 py-5 border-b border-red-100 dark:border-red-900/30 bg-red-50/30 dark:bg-red-900/10 flex items-center gap-3">
            <AlertTriangle size={18} className="text-red-500" />
            <div>
              <h3 className="font-medium text-red-600 dark:text-red-400 text-base tracking-tight">Delete organization</h3>
              <p className="text-red-500/80 dark:text-red-400/80 text-sm font-normal mt-0.5">This action is permanent and cannot be undone.</p>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <p className="text-sm text-slate-600 dark:text-slate-400 font-normal leading-relaxed">
              Permanently deletes your organization and all associated data including events, attendees, email history, templates, and team accounts.
            </p>

            <div className="p-5 sm:p-6 rounded-[16px] border border-red-100 dark:border-red-900/40 bg-slate-50 dark:bg-slate-800/30 space-y-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Type DELETE to confirm">
                  <input
                    className={inputCls}
                    placeholder="DELETE"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                  />
                </Field>

                <Field label="Verify your password">
                  <input
                    type="password"
                    className={inputCls}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </Field>
              </div>
              
              {error && (
                <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium rounded-xl border border-red-100 dark:border-red-800/30">
                  {error}
                </div>
              )}
              
              <div className="pt-2">
                <button
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:active:scale-100 active:scale-95 w-full sm:w-auto"
                  disabled={confirmText !== 'DELETE' || !password || deleting}
                  onClick={handleDelete}
                >
                  {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  {deleting ? 'Deleting...' : 'Delete my organization'}
                </button>
              </div>

            </div>
          </div>
          
        </div>
      </div>
    </Layout>
  );
}