'use client';

import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthUser } from '@/hooks/useAuthUser';
import {
  Building2,
  Globe,
  Palette,
  CreditCard,
  UploadCloud,
  Save,
  Loader2,
  Mail,
  AlertTriangle
} from 'lucide-react';

interface OrganizationFormData {
  orgName: string;
  slug: string;
  timezone: string;
  fromName: string;
  replyToEmail: string;
  brandColor: string;
  secondaryBrandColor: string;
  billingEmail: string;
  taxId: string;
}

function readProfileSetting(settings: unknown, key: keyof Pick<OrganizationFormData, 'timezone' | 'fromName' | 'replyToEmail' | 'billingEmail' | 'taxId'>, fallback: string): string {
  if (!settings || typeof settings !== 'object') return fallback;
  const profile = (settings as Record<string, unknown>).profile;
  if (!profile || typeof profile !== 'object') return fallback;

  const value = (profile as Record<string, unknown>)[key];
  return typeof value === 'string' ? value : fallback;
}

const inputCls = "w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-700/50 rounded-xl text-sm font-normal text-slate-900 dark:text-white outline-none focus:border-slate-400 dark:focus:border-slate-500 transition-all disabled:cursor-not-allowed disabled:opacity-70 placeholder:text-slate-400";

export default function OrganizationSettingsPage() {
  const { user, loading: userLoading } = useAuthUser();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<OrganizationFormData>({
    orgName: '',
    slug: '',
    timezone: 'Africa/Nairobi',
    fromName: 'Events Team',
    replyToEmail: '',
    brandColor: '#2563eb',
    secondaryBrandColor: '#0ea5e9',
    billingEmail: '',
    taxId: '',
  });

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    let cancelled = false;

    api.get('/api/org')
      .then(({ data }) => {
        if (cancelled) return;

        setFormData({
          orgName: data.name || '',
          slug: data.slug || '',
          timezone: readProfileSetting(data.settings, 'timezone', 'Africa/Nairobi'),
          fromName: readProfileSetting(data.settings, 'fromName', 'Events Team'),
          replyToEmail: readProfileSetting(data.settings, 'replyToEmail', ''),
          brandColor: data.primaryColor || '#2563eb',
          secondaryBrandColor: data.secondaryColor || '#0ea5e9',
          billingEmail: readProfileSetting(data.settings, 'billingEmail', ''),
          taxId: readProfileSetting(data.settings, 'taxId', ''),
        });
      })
      .catch((err: any) => {
        if (!cancelled) toast.error(err.response?.data?.error || 'Failed to load organization settings');
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
    if (!isAdmin) return;

    setIsSaving(true);

    try {
      await Promise.all([
        api.put('/api/org', {
          name: formData.orgName,
          slug: formData.slug,
        }),
        api.post('/api/org/settings', {
          profile: {
            timezone: formData.timezone,
            fromName: formData.fromName,
            replyToEmail: formData.replyToEmail,
            billingEmail: formData.billingEmail,
            taxId: formData.taxId,
          },
        }),
        api.put('/api/templates/branding', {
          primary_color: formData.brandColor,
          secondary_color: formData.secondaryBrandColor || formData.brandColor,
        }),
      ]);

      toast.success('Organization details updated successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update organization settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || userLoading) {
    return (
      <Layout>
        <div className="flex flex-col h-[60vh] items-center justify-center text-slate-400">
          <Loader2 className="animate-spin mb-4 text-slate-300 dark:text-slate-600" size={32} />
          <p className="text-sm font-medium">Loading organization settings...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <form onSubmit={handleSave} className="max-w-4xl mx-auto animate-in fade-in duration-500 pb-12 px-4 sm:px-6 md:px-8 mt-2">
        
        {/* --- Header (Static, no longer floating) --- */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-100/50 dark:border-blue-800/50 shadow-sm">
              <Building2 size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-medium text-slate-900 dark:text-white tracking-tight">Organization</h1>
              <p className="text-sm text-slate-500 mt-1 font-normal">Manage your workspace identity, branding, and billing details.</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving || !isAdmin}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium rounded-xl transition-all shadow-sm disabled:opacity-50 active:scale-95 disabled:active:scale-100"
          >
            {isSaving ? (
              <><Loader2 size={16} className="animate-spin" /> Saving...</>
            ) : (
              <><Save size={16} /> {isAdmin ? 'Save Changes' : 'Admin required'}</>
            )}
          </button>
        </div>

        {/* --- Admin Warning --- */}
        {!isAdmin && (
          <div className="mb-8 rounded-[20px] border border-amber-200 bg-amber-50 p-6 flex items-start gap-3 shadow-sm dark:border-amber-900/50 dark:bg-amber-900/10">
            <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-amber-800 dark:text-amber-300">Read-Only Access</h3>
              <p className="text-sm text-amber-700/80 dark:text-amber-400/80 mt-1">You can view organization settings, but only admins can edit them.</p>
            </div>
          </div>
        )}

        <div className="space-y-8">
          
          {/* --- General Information --- */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[20px] border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-800/50 pb-4">
              <div className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg">
                <Globe size={18} />
              </div>
              <h2 className="text-lg font-medium text-slate-900 dark:text-white">General Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              <div className="md:col-span-4 flex flex-col gap-2">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-widest ml-1">Company Logo</label>
                <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700/50 rounded-[16px] bg-slate-50 dark:bg-slate-800/30 min-h-[160px] transition-colors">
                  <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700 mb-3">
                    <UploadCloud size={18} className="text-slate-400" />
                  </div>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Logo uploads coming soon</p>
                  <p className="text-[10px] text-slate-400 mt-1">SVG, PNG, or JPG (max. 2MB)</p>
                </div>
              </div>

              <div className="md:col-span-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-widest ml-1">Organization Name</label>
                  <input
                    type="text"
                    required
                    disabled={!isAdmin}
                    className={inputCls}
                    value={formData.orgName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, orgName: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-widest ml-1">Workspace URL</label>
                  <div className="flex rounded-xl overflow-hidden border border-slate-200/80 dark:border-slate-700/50 focus-within:border-slate-400 dark:focus-within:border-slate-500 transition-all bg-slate-50 dark:bg-slate-800/30">
                    <span className="px-4 py-2.5 text-slate-500 text-sm font-normal border-r border-slate-200/80 dark:border-slate-700/50">
                      reminderflow.com/r/
                    </span>
                    <input
                      type="text"
                      disabled={!isAdmin}
                      className="flex-1 px-4 py-2.5 bg-transparent text-sm font-normal text-slate-900 dark:text-white outline-none disabled:cursor-not-allowed disabled:opacity-70"
                      value={formData.slug}
                      onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-widest ml-1">Default Timezone</label>
                  <select
                    disabled={!isAdmin}
                    className={`${inputCls} appearance-none cursor-pointer`}
                    value={formData.timezone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, timezone: e.target.value }))}
                  >
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="Europe/London">London (GMT)</option>
                    <option value="Africa/Nairobi">Nairobi (EAT)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* --- Brand & Communication --- */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[20px] border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-100/50 dark:border-emerald-800/50">
                <Palette size={18} />
              </div>
              <h2 className="text-lg font-medium text-slate-900 dark:text-white">Brand & Communication</h2>
            </div>

            <p className="text-sm text-slate-500 mb-6 font-normal border-b border-slate-100 dark:border-slate-800/50 pb-4">
              These settings dictate how your automated emails and public registration pages look to attendees.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-widest ml-1">Sender Name (From)</label>
                <div className="relative group">
                  <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-600 dark:group-focus-within:text-slate-300 transition-colors" />
                  <input
                    type="text"
                    disabled={!isAdmin}
                    className={`${inputCls} pl-11`}
                    value={formData.fromName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, fromName: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-widest ml-1">Reply-To Email</label>
                <div className="relative group">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-600 dark:group-focus-within:text-slate-300 transition-colors" />
                  <input
                    type="email"
                    disabled={!isAdmin}
                    className={`${inputCls} pl-11`}
                    value={formData.replyToEmail}
                    onChange={(e) => setFormData((prev) => ({ ...prev, replyToEmail: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-widest ml-1">Primary Brand Color</label>
                <div className="flex items-center gap-3 p-1.5 bg-slate-50 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-700/50 rounded-xl transition-colors focus-within:border-slate-400 dark:focus-within:border-slate-500">
                  <input
                    type="color"
                    disabled={!isAdmin}
                    className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent p-0 disabled:cursor-not-allowed ml-1"
                    value={formData.brandColor}
                    onChange={(e) => setFormData((prev) => ({ ...prev, brandColor: e.target.value }))}
                  />
                  <input
                    type="text"
                    disabled={!isAdmin}
                    className="flex-1 px-2 py-1 bg-transparent text-sm font-medium text-slate-900 dark:text-white outline-none uppercase disabled:cursor-not-allowed disabled:opacity-70"
                    value={formData.brandColor}
                    onChange={(e) => setFormData((prev) => ({ ...prev, brandColor: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-widest ml-1">Accent Color</label>
                <div className="flex items-center gap-3 p-1.5 bg-slate-50 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-700/50 rounded-xl transition-colors focus-within:border-slate-400 dark:focus-within:border-slate-500">
                  <input
                    type="color"
                    disabled={!isAdmin}
                    className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent p-0 disabled:cursor-not-allowed ml-1"
                    value={formData.secondaryBrandColor}
                    onChange={(e) => setFormData((prev) => ({ ...prev, secondaryBrandColor: e.target.value }))}
                  />
                  <input
                    type="text"
                    disabled={!isAdmin}
                    className="flex-1 px-2 py-1 bg-transparent text-sm font-medium text-slate-900 dark:text-white outline-none uppercase disabled:cursor-not-allowed disabled:opacity-70"
                    value={formData.secondaryBrandColor}
                    onChange={(e) => setFormData((prev) => ({ ...prev, secondaryBrandColor: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* --- Billing Details --- */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[20px] border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-800/50 pb-4">
              <div className="p-1.5 bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 rounded-lg border border-sky-100/50 dark:border-sky-800/50">
                <CreditCard size={18} />
              </div>
              <h2 className="text-lg font-medium text-slate-900 dark:text-white">Billing Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-widest ml-1">Billing Email Address</label>
                <input
                  type="email"
                  disabled={!isAdmin}
                  className={inputCls}
                  value={formData.billingEmail}
                  onChange={(e) => setFormData((prev) => ({ ...prev, billingEmail: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-widest ml-1">Tax ID / VAT (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. GB123456789"
                  disabled={!isAdmin}
                  className={inputCls}
                  value={formData.taxId}
                  onChange={(e) => setFormData((prev) => ({ ...prev, taxId: e.target.value }))}
                />
              </div>
            </div>
          </div>
          
        </div>
      </form>
    </Layout>
  );
}