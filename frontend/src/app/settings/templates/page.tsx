'use client';

import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthUser } from '@/hooks/useAuthUser';
import { 
  Save, Mail, Palette, RefreshCcw, ChevronRight, 
  LayoutTemplate, AlignLeft, Eye, X, Loader2, AlertTriangle,
  Lock, Zap
} from 'lucide-react';
import { usePlan } from '@/hooks/usePlan';
import Link from 'next/link';

const TEMPLATE_TYPES = [
  { id: 'confirmation', label: 'Confirmation' },
  { id: '24h', label: '24h Reminder' },
  { id: '1h', label: '1h Reminder' },
  { id: '10m', label: '10m Reminder' },
];

const THEMES = [
  { id: 'minimal_light', name: 'Minimal Light', description: 'Clean, professional, and easy to read.', previewBg: 'bg-white', previewHeader: 'bg-slate-100', previewText: 'text-slate-800' },
  { id: 'modern_dark', name: 'Modern Dark', description: 'Sleek dark mode for tech audiences.', previewBg: 'bg-slate-900', previewHeader: 'bg-slate-950', previewText: 'text-slate-300' },
  { id: 'brand_heavy', name: 'Brand Heavy', description: 'Uses your primary color in the header.', previewBg: 'bg-white', previewHeader: 'bg-[var(--brand-primary)]', previewText: 'text-slate-800' }
];

const inputCls = "w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-700/50 rounded-[16px] text-sm font-normal text-slate-900 dark:text-white outline-none focus:border-slate-400 dark:focus:border-slate-500 transition-all placeholder:text-slate-400";

export default function TemplatesPage() {
  const { user, loading: userLoading } = useAuthUser();
  const { isPro } = usePlan();
  const [activeType, setActiveType] = useState('confirmation');
  const [templates, setTemplates] = useState<any[]>([]);
  const [branding, setBranding] = useState({ primary_color: '#2563eb', secondary_color: '#0ea5e9' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // --- PREVIEW STATE ---
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  useEffect(() => {
    if (userLoading) return;
    if (user?.role !== 'admin') {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const res = await api.get('/api/templates');
        const fetchedTemplates = res.data.templates || [];
        const normalizedTemplates = TEMPLATE_TYPES.map(type => {
          const found = fetchedTemplates.find((t: any) => t.type === type.id);
          return found || { type: type.id, subject: `Reminder: {{event_title}}`, themeId: 'minimal_light', customMessage: '' };
        });
        setTemplates(normalizedTemplates);
        if (res.data.branding) setBranding(res.data.branding);
      } catch (err) {
        toast.error('Failed to load templates');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, userLoading]);

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const current = templates.find(t => t.type === activeType);
      await Promise.all([
        api.put(`/api/templates/${activeType}`, {
          subject: current?.subject,
          theme_id: current?.themeId,
          custom_message: current?.customMessage
        }),
        api.put('/api/templates/branding', branding)
      ]);
      toast.success(`${activeType.toUpperCase()} template saved!`);
    } catch (err) {
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async () => {
    setIsPreviewOpen(true);
    setIsPreviewLoading(true);
    try {
      const current = templates.find(t => t.type === activeType) || { themeId: 'minimal_light', customMessage: '' };
      
      const res = await api.post('/api/templates/preview', {
        theme_id: current.themeId,
        custom_message: current.customMessage,
        primary_color: branding.primary_color,
        secondary_color: branding.secondary_color
      });
      
      setPreviewHtml(res.data.html);
    } catch (error) {
      toast.error('Failed to generate preview');
      setIsPreviewOpen(false);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const updateTemplateState = (field: string, value: string) => {
    setTemplates(prev => prev.map(t => t.type === activeType ? { ...t, [field]: value } : t));
  };

  const currentTemplate = templates.find(t => t.type === activeType) || { subject: '', themeId: 'minimal_light', customMessage: '' };

  if (loading || userLoading) {
    return (
      <Layout>
        <div className="flex flex-col h-[60vh] items-center justify-center text-slate-400">
          <Loader2 className="animate-spin mb-4 text-slate-300 dark:text-slate-600" size={32} />
          <p className="text-sm font-medium">Loading templates...</p>
        </div>
      </Layout>
    );
  }

  if (user?.role !== 'admin' && user?.role !== 'manager') {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
          <div className="rounded-[20px] border border-amber-200 bg-amber-50 p-6 flex items-start gap-3 shadow-sm dark:border-amber-900/50 dark:bg-amber-900/10">
            <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-amber-800 dark:text-amber-300">Access Restricted</h3>
              <p className="text-sm text-amber-700/80 dark:text-amber-400/80 mt-1">Manager or admin access is required to manage email templates.</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl w-full mx-auto space-y-6 animate-in fade-in duration-500 pb-12 px-4 sm:px-6 md:px-8 mt-2">
        
        {/* --- Header --- */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-100/50 dark:border-blue-800/50 shadow-sm">
              <LayoutTemplate size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-medium text-slate-900 dark:text-white tracking-tight">Email Customization</h1>
              <p className="text-sm text-slate-500 font-normal mt-1">Configure your brand identity and select your automated messaging themes.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <button 
              onClick={handlePreview}
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl shadow-sm transition-all active:scale-95"
            >
              <Eye size={16} /> Live Preview
            </button>
            <button 
              onClick={handleSaveAll} 
              disabled={saving}
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
            >
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-10">
          
          {/* --- LEFT SIDEBAR --- */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Branding Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[20px] p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6 font-medium text-xs uppercase tracking-widest text-slate-500">
                <Palette size={16} /> Brand Colors
              </div>
              <div className="space-y-5">
                <div>
                  <label className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mb-2 block ml-1">Primary (Buttons)</label>
                  <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/30 p-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700/50 transition-colors focus-within:border-slate-400 dark:focus-within:border-slate-500">
                    <input type="color" value={branding.primary_color} onChange={e => setBranding({...branding, primary_color: e.target.value})} className="w-8 h-8 rounded cursor-pointer border-none bg-transparent shrink-0 ml-1" />
                    <input type="text" value={branding.primary_color} onChange={e => setBranding({...branding, primary_color: e.target.value})} className="flex-1 w-full bg-transparent text-sm font-medium text-slate-700 dark:text-slate-300 outline-none uppercase" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mb-2 block ml-1">Secondary (Accents)</label>
                  <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/30 p-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700/50 transition-colors focus-within:border-slate-400 dark:focus-within:border-slate-500">
                    <input type="color" value={branding.secondary_color} onChange={e => setBranding({...branding, secondary_color: e.target.value})} className="w-8 h-8 rounded cursor-pointer border-none bg-transparent shrink-0 ml-1" />
                    <input type="text" value={branding.secondary_color} onChange={e => setBranding({...branding, secondary_color: e.target.value})} className="flex-1 w-full bg-transparent text-sm font-medium text-slate-700 dark:text-slate-300 outline-none uppercase" />
                  </div>
                </div>
              </div>
            </div>

            {/* Message Types Navigation */}
            <div className="space-y-2">
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest px-2 mb-3">Automated Flows</p>
              {TEMPLATE_TYPES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveType(t.id)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-[16px] text-sm font-medium transition-all border ${
                    activeType === t.id 
                      ? 'bg-slate-100 dark:bg-slate-800/80 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white shadow-sm' 
                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3"><Mail size={16} className={activeType === t.id ? "text-slate-900 dark:text-white" : "text-slate-400"} /> {t.label}</div>
                  {activeType === t.id && <ChevronRight size={14} className="text-slate-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* --- RIGHT AREA --- */}
          <div className="lg:col-span-9 space-y-6 relative">

            {/* Pro lock overlay over the whole right column */}
            {!isPro && (
              <div className="absolute inset-0 z-20 rounded-[24px] bg-white/70 dark:bg-slate-900/70 backdrop-blur-[3px] flex flex-col items-center justify-center gap-4 min-h-[320px]">
                <div className="flex flex-col items-center gap-3 text-center px-6">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                    <Lock size={22} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-slate-900 dark:text-white mb-1">Custom Templates — Pro Feature</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">Editing themes, custom messages, and brand colors is available on the Pro plan. Free users use the default Minimal Light template.</p>
                  </div>
                  <Link
                    href="/subscription"
                    className="mt-1 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-all"
                  >
                    <Zap size={14} /> Upgrade to Pro — KSh 1,500/mo
                  </Link>
                  <p className="text-xs text-slate-400">14-day free trial included</p>
                </div>
              </div>
            )}
            
            {/* Subject & Message Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[20px] shadow-sm p-6 sm:p-8 space-y-6">
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-2 block ml-1">Email Subject Line</label>
                <input 
                  type="text" 
                  value={currentTemplate.subject} 
                  onChange={(e) => updateTemplateState('subject', e.target.value)} 
                  className={inputCls} 
                  placeholder="e.g. You're invited to {{event_title}}!" 
                />
              </div>
              <hr className="border-slate-100 dark:border-slate-800/50" />
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2 ml-1">
                  <AlignLeft size={14} /> Optional Custom Message
                </label>
                <textarea 
                  value={currentTemplate.customMessage || ''} 
                  onChange={(e) => updateTemplateState('customMessage', e.target.value)} 
                  rows={4} 
                  className={`${inputCls} resize-y leading-relaxed`} 
                  placeholder="Add a personalized note that will appear near the top of the email..." 
                />
              </div>
            </div>

            {/* Theme Selector Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[20px] shadow-sm p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-6 font-medium text-xs uppercase tracking-widest text-slate-500">
                <LayoutTemplate size={16} /> Select Email Layout
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {THEMES.map((theme) => {
                  const isActive = currentTemplate.themeId === theme.id;
                  return (
                    <button 
                      key={theme.id} 
                      onClick={() => updateTemplateState('themeId', theme.id)} 
                      className={`text-left group transition-all rounded-[20px] p-2 ${
                        isActive 
                          ? 'bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-600 shadow-sm' 
                          : 'border border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/30'
                      }`}
                    >
                      <div className={`w-full aspect-[4/5] rounded-[16px] border flex flex-col overflow-hidden mb-4 shadow-sm ${isActive ? 'border-slate-300 dark:border-slate-600' : 'border-slate-200 dark:border-slate-700/80'} ${theme.previewBg}`}>
                        <div className={`h-12 w-full flex items-center px-4 ${theme.previewHeader}`} style={theme.id === 'brand_heavy' ? { backgroundColor: branding.primary_color } : {}}>
                          <div className={`w-8 h-8 rounded-full ${theme.id === 'brand_heavy' ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                        </div>
                        <div className="p-4 space-y-3 flex-1">
                          <div className={`h-4 w-3/4 rounded-sm ${theme.id === 'modern_dark' ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
                          <div className={`h-2 w-full rounded-sm ${theme.id === 'modern_dark' ? 'bg-slate-800' : 'bg-slate-100'}`}></div>
                          <div className={`h-2 w-5/6 rounded-sm ${theme.id === 'modern_dark' ? 'bg-slate-800' : 'bg-slate-100'}`}></div>
                          <div className="h-8 w-2/3 rounded mt-4" style={{ backgroundColor: branding.primary_color }}></div>
                        </div>
                      </div>
                      <div className="px-2 pb-2">
                        <div className="flex items-center justify-between mb-1.5">
                          <h3 className={`font-medium text-sm tracking-tight ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>{theme.name}</h3>
                          {isActive && <div className="w-2.5 h-2.5 rounded-full bg-slate-900 dark:bg-white shadow-sm"></div>}
                        </div>
                        <p className="text-xs text-slate-500 font-normal leading-relaxed">{theme.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Pro locked: Custom Email Sender ───────────── */}
            <div className={`rounded-[20px] border p-6 shadow-sm relative overflow-hidden ${
              isPro
                ? 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
                : 'bg-slate-50 dark:bg-slate-900/50 border-dashed border-slate-200 dark:border-slate-700/50'
            }`}>
              {!isPro && (
                <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-[1px] rounded-[20px] z-10 flex flex-col items-center justify-center gap-3">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                      <Lock size={18} className="text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Custom Email Sender — Pro Feature</p>
                    <p className="text-xs text-slate-500 text-center max-w-[220px]">Send emails from your own domain address instead of the default ReminderFlow sender.</p>
                    <Link
                      href="/subscription"
                      className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-all"
                    >
                      <Zap size={12} /> Upgrade to Pro
                    </Link>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 mb-4 font-medium text-xs uppercase tracking-widest text-slate-500">
                <Mail size={16} /> Custom Email Sender
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mb-2 block ml-1">Sender Name</label>
                  <input disabled type="text" placeholder="e.g. Acme Events" className={`${inputCls} opacity-50 cursor-not-allowed`} />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mb-2 block ml-1">Sender Email Address</label>
                  <input disabled type="email" placeholder="e.g. noreply@yourdomain.com" className={`${inputCls} opacity-50 cursor-not-allowed`} />
                  <p className="mt-1.5 text-xs text-slate-400 ml-1">Requires domain verification. Available with Pro plan.</p>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>

      {/* --- PREVIEW MODAL --- */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-100 dark:bg-slate-900 w-full max-w-4xl h-[90vh] rounded-[24px] shadow-2xl flex flex-col overflow-hidden border border-slate-200/50 dark:border-slate-800">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white tracking-tight">Live Email Preview</h3>
                <p className="text-sm text-slate-500 font-normal mt-0.5">Subject: {currentTemplate.subject.replace('{{event_title}}', 'Q3 Strategy Summit')}</p>
              </div>
              <button 
                onClick={() => setIsPreviewOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body (Iframe) */}
            <div className="flex-1 bg-slate-100 dark:bg-slate-900 p-6 overflow-auto flex justify-center">
              {isPreviewLoading ? (
                <div className="flex flex-col items-center justify-center text-slate-400 h-full">
                  <Loader2 className="animate-spin mb-4 text-slate-300 dark:text-slate-600" size={32} />
                  <p className="text-sm font-medium">Generating preview...</p>
                </div>
              ) : (
                <div className="w-full max-w-[600px] bg-white rounded-2xl shadow-sm overflow-hidden self-start border border-slate-200 dark:border-slate-800/50">
                  <iframe 
                    title="Live Email Preview"
                    srcDoc={previewHtml}
                    sandbox=""
                    className="w-full h-[700px] border-none"
                  />
                </div>
              )}
            </div>
            
          </div>
        </div>
      )}
      
    </Layout>
  );
}