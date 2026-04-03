'use client';

import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { storeAuthUser, type AuthUser } from '@/lib/auth';
import { ensureAuthUser } from '@/lib/session';
import {
  User,
  Lock,
  ShieldCheck,
  Bell,
  Smartphone,
  Laptop,
  Save,
  Loader2,
  Camera,
} from 'lucide-react';

interface ProfileFormData {
  name: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  notifyOnRegistration: boolean;
  weeklySummary: boolean;
}

function readPreference(user: AuthUser | null, key: 'notifyOnRegistration' | 'weeklySummary', fallback: boolean): boolean {
  const rawSettings = user?.settings;
  if (!rawSettings || typeof rawSettings !== 'object') return fallback;

  const preferences = (rawSettings as Record<string, unknown>).preferences;
  if (!preferences || typeof preferences !== 'object') return fallback;

  const value = (preferences as Record<string, unknown>)[key];
  return typeof value === 'boolean' ? value : fallback;
}

const inputCls = "w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-700/50 rounded-[16px] text-sm font-normal text-slate-900 dark:text-white outline-none focus:border-slate-400 dark:focus:border-slate-500 transition-all placeholder:text-slate-400";

export default function ProfileSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    notifyOnRegistration: true,
    weeklySummary: false,
  });

  useEffect(() => {
    let cancelled = false;

    ensureAuthUser()
      .then((user) => {
        if (cancelled) return;

        setFormData((prev) => ({
          ...prev,
          name: user.fullName ?? user.name ?? '',
          email: user.email ?? '',
          notifyOnRegistration: readPreference(user, 'notifyOnRegistration', true),
          weeklySummary: readPreference(user, 'weeklySummary', false),
        }));
      })
      .catch(() => {
        if (!cancelled) toast.error('Failed to load your profile');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const { data } = await api.put('/api/auth/me', {
        fullName: formData.name,
        email: formData.email,
        currentPassword: formData.currentPassword || undefined,
        newPassword: formData.newPassword || undefined,
        preferences: {
          notifyOnRegistration: formData.notifyOnRegistration,
          weeklySummary: formData.weeklySummary,
        },
      });

      storeAuthUser(data.user);
      setFormData((prev) => ({
        ...prev,
        name: data.user.fullName ?? prev.name,
        email: data.user.email ?? prev.email,
        currentPassword: '',
        newPassword: '',
      }));
      toast.success('Personal profile updated successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update your profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col h-[60vh] items-center justify-center text-slate-400">
          <Loader2 className="animate-spin mb-4 text-slate-300 dark:text-slate-600" size={32} />
          <p className="text-sm font-medium">Loading profile...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <form onSubmit={handleSave} className="max-w-4xl mx-auto animate-in fade-in duration-500 pb-12 px-4 sm:px-6 md:px-8 mt-2">
        
        {/* --- Header --- */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-100/50 dark:border-blue-800/50 shadow-sm">
                <User size={20} />
              </div>
              <h1 className="text-2xl font-medium text-slate-900 dark:text-white tracking-tight">My Profile</h1>
            </div>
            <p className="text-sm text-slate-500 mt-2 font-normal">Manage your personal identity, security, and preferences.</p>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium rounded-xl transition-all shadow-sm disabled:opacity-50 active:scale-95 disabled:active:scale-100 w-full sm:w-auto"
          >
            {isSaving ? (
              <><Loader2 size={16} className="animate-spin" /> Saving...</>
            ) : (
              <><Save size={16} /> Save Profile</>
            )}
          </button>
        </div>

        <div className="space-y-8">
          
          {/* --- Personal Information --- */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[20px] border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-800/50 pb-4">
              <h2 className="text-lg font-medium text-slate-900 dark:text-white">Personal Information</h2>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="flex flex-col items-center gap-3">
                <div className="relative w-24 h-24 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex items-center justify-center group cursor-not-allowed">
                  <span className="text-3xl font-medium text-slate-400 dark:text-slate-500">
                    {formData.name ? formData.name.charAt(0).toUpperCase() : '?'}
                  </span>
                  <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={24} className="text-white" />
                  </div>
                </div>
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest text-center">
                  Photo uploads<br />coming soon
                </p>
              </div>

              <div className="flex-1 w-full space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                    <input
                      type="text"
                      required
                      className={inputCls}
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                    <input
                      type="email"
                      required
                      className={inputCls}
                      value={formData.email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* --- Security --- */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[20px] border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-800/50 pb-4">
              <div className="p-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg border border-amber-100/50 dark:border-amber-800/50">
                <Lock size={18} />
              </div>
              <h2 className="text-lg font-medium text-slate-900 dark:text-white">Security</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
              
              <div className="space-y-6">
                <h3 className="text-sm font-medium text-slate-900 dark:text-white">Change Password</h3>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-widest ml-1">Current Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className={inputCls}
                    value={formData.currentPassword}
                    onChange={(e) => setFormData((prev) => ({ ...prev, currentPassword: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-widest ml-1">New Password</label>
                  <input
                    type="password"
                    placeholder="At least 10 chars"
                    className={inputCls}
                    value={formData.newPassword}
                    onChange={(e) => setFormData((prev) => ({ ...prev, newPassword: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-4">Two-Factor Authentication</h3>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-slate-50 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-700/50 rounded-[16px]">
                    <div className="flex items-center gap-3">
                      <ShieldCheck size={20} className="text-slate-400" />
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">Authenticator App</p>
                        <p className="text-xs text-slate-500 font-normal">Coming soon</p>
                      </div>
                    </div>
                    <button type="button" disabled className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-400 shadow-sm cursor-not-allowed">
                      Coming soon
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-4">Active Sessions</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2">
                      <div className="flex items-start gap-3">
                        <Laptop size={18} className="text-emerald-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-2">
                            Current browser session 
                            <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 px-1.5 py-0.5 rounded-md uppercase tracking-widest">Current</span>
                          </p>
                          <p className="text-xs text-slate-500 font-normal mt-0.5">Session controls coming soon</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-2 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                      <div className="flex items-start gap-3">
                        <Smartphone size={18} className="text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">Additional session management</p>
                          <p className="text-xs text-slate-500 font-normal mt-0.5">We'll expose revoke controls here next.</p>
                        </div>
                      </div>
                      <button type="button" disabled className="text-xs font-medium text-slate-400 cursor-not-allowed hidden sm:block">
                        Coming soon
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* --- Notifications --- */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[20px] border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-800/50 pb-4">
              <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-100/50 dark:border-emerald-800/50">
                <Bell size={18} />
              </div>
              <h2 className="text-lg font-medium text-slate-900 dark:text-white">Email Preferences</h2>
            </div>

            <div className="space-y-4 max-w-3xl">
              <label className="flex items-start gap-4 p-5 bg-slate-50 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-700/50 rounded-[16px] cursor-pointer hover:border-slate-400 dark:hover:border-slate-500 transition-colors">
                <input
                  type="checkbox"
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 accent-slate-900 dark:accent-white cursor-pointer"
                  checked={formData.notifyOnRegistration}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notifyOnRegistration: e.target.checked }))}
                />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">New Attendee Alerts</p>
                  <p className="text-xs text-slate-500 font-normal mt-1 leading-relaxed">Receive an email every time someone registers for your active events.</p>
                </div>
              </label>

              <label className="flex items-start gap-4 p-5 bg-slate-50 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-700/50 rounded-[16px] cursor-pointer hover:border-slate-400 dark:hover:border-slate-500 transition-colors">
                <input
                  type="checkbox"
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 accent-slate-900 dark:accent-white cursor-pointer"
                  checked={formData.weeklySummary}
                  onChange={(e) => setFormData((prev) => ({ ...prev, weeklySummary: e.target.checked }))}
                />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Weekly Performance Summary</p>
                  <p className="text-xs text-slate-500 font-normal mt-1 leading-relaxed">Get a weekly digest of your email open rates, click rates, and total audience growth.</p>
                </div>
              </label>
            </div>
          </div>
        </div>

      </form>
    </Layout>
  );
}