'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Calendar, Clock, ShieldCheck,
  CheckCircle2, Loader2, MonitorSmartphone,
  MapPin, Sparkles, MessageCircle
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'checkbox' | 'checkbox_group';
  required: boolean;
  locked?: boolean;
  options?: string[];
}

interface PublicEvent {
  id: string;
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  timezone: string;
  meeting_link?: string;
  form_schema: FormField[] | null;
  whatsapp_enabled: boolean;
}

const inputCls = "w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-700/50 rounded-[16px] text-base md:text-sm font-normal text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-800/80 focus:border-slate-400 dark:focus:border-slate-500 transition-all placeholder:text-slate-400";

export default function PublicRegistrationPage() {
  const params  = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [pageError, setPageError] = useState('');
  const [hasRegisteredOnDevice, setHasRegisteredOnDevice] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  
  // NEW: WhatsApp State
  const [wantsWhatsapp, setWantsWhatsapp] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  
  const [customAnswers, setCustomAnswers] = useState<Record<string, any>>({});

  useEffect(() => {
    if (eventId && localStorage.getItem(`registered_${eventId}`) === 'true') {
      setHasRegisteredOnDevice(true);
    }
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;
    const fetchEvent = async () => {
      try {
        const res = await fetch(`${API_URL}/api/public/events/${eventId}`);
        if (!res.ok) throw new Error('Event not found or is no longer active.');
        const data = await res.json();
        
        let parsedSchema = data.form_schema;
        if (typeof parsedSchema === 'string') {
          try { parsedSchema = JSON.parse(parsedSchema); } catch (e) { parsedSchema = []; }
        }
        if (!Array.isArray(parsedSchema)) parsedSchema = [];

        setEvent({ ...data, form_schema: parsedSchema });

        if (parsedSchema.length > 0) {
          const init: Record<string, any> = {};
          for (const field of parsedSchema) {
            if (field.locked) continue; 
            if (field.type === 'checkbox') init[field.id] = false;
            else if (field.type === 'checkbox_group') init[field.id] = [];
            else init[field.id] = '';
          }
          setCustomAnswers(init);
        }
      } catch (err: any) {
        setPageError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [eventId]);

  const toggleCheckboxGroup = (fieldId: string, option: string, isChecked: boolean) => {
    setCustomAnswers(prev => {
      const currentList = (prev[fieldId] as string[]) || [];
      if (isChecked) {
        return { ...prev, [fieldId]: [...currentList, option] };
      } else {
        return { ...prev, [fieldId]: currentList.filter(item => item !== option) };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (event?.form_schema) {
      for (const field of event.form_schema) {
        if (field.required && field.type === 'checkbox_group') {
          const answerArray = customAnswers[field.id] as string[];
          if (!answerArray || answerArray.length === 0) {
            toast.error(`Please select at least one option for "${field.label}"`);
            return;
          }
        }
      }
    }

    if (wantsWhatsapp && !whatsappNumber) {
      toast.error('Please provide your WhatsApp number.');
      return;
    }

    setSubmitting(true);

    try {
      // CHANGED: Added whatsappNumber conditionally
      const payload = { 
        name, 
        email, 
        custom_responses: customAnswers,
        whatsappNumber: wantsWhatsapp ? whatsappNumber : null
      };

      const res = await fetch(`${API_URL}/api/public/events/${eventId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload), 
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to register');

      setSuccess(true);
      toast.success("You're successfully registered!");
      localStorage.setItem(`registered_${eventId}`, 'true');
      window.scrollTo(0, 0);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  let customFields: FormField[] = [];
  if (Array.isArray(event?.form_schema)) {
    customFields = event.form_schema.filter(f => !f.locked);
  }

  if (loading) return <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-slate-400 dark:text-slate-600" size={32} /></div>;
  
  if (pageError && !event) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 text-center font-sans">
      <div className="bg-white dark:bg-slate-900 rounded-[24px] shadow-sm border border-slate-200/80 dark:border-slate-800 p-8 sm:p-10 max-w-md w-full">
        <ShieldCheck size={48} className="text-slate-300 dark:text-slate-700 mx-auto mb-4" />
        <h1 className="text-xl font-medium text-slate-900 dark:text-white mb-2">Event Unavailable</h1>
        <p className="text-sm text-slate-500 font-normal">{pageError}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950 font-sans">
      
      <div className="lg:w-5/12 xl:w-1/3 bg-slate-950 text-white p-8 lg:p-12 lg:fixed lg:inset-y-0 lg:left-0 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800 relative overflow-hidden">
        
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-slate-800/40 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-slate-800/30 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-10 lg:mb-12">
            <div className="bg-white/5 backdrop-blur-md p-2 rounded-lg border border-white/10 shadow-sm flex items-center justify-center">
              <Sparkles size={16} className="text-slate-300" />
            </div>
            <span className="font-medium tracking-tight text-sm text-slate-300">ReminderFlow</span>
          </div>

          <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-700">
            <div className="inline-flex px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700/50 text-slate-300 text-[10px] font-medium uppercase tracking-widest">
              Registration Open
            </div>
            
            <div className="space-y-4">
              <h1 className="text-3xl lg:text-4xl font-medium leading-tight tracking-tight text-white">
                {event?.title}
              </h1>
              
              {event?.description && (
                <p className="text-sm text-slate-400 font-normal leading-relaxed">
                  {event.description}
                </p>
              )}
            </div>

            <div className="space-y-5 pt-6 border-t border-slate-800/50 mt-6">
              {event?.event_date && (
                <div className="flex items-center gap-4 text-slate-300">
                  <div className="w-10 h-10 shrink-0 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800 shadow-sm">
                    <Calendar size={16} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest mb-0.5">Date</p>
                    <p className="text-sm font-medium">{new Date(event.event_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>
              )}
              
              {event?.event_time && (
                <div className="flex items-center gap-4 text-slate-300">
                  <div className="w-10 h-10 shrink-0 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800 shadow-sm">
                    <Clock size={16} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest mb-0.5">Time</p>
                    <p className="text-sm font-medium">{event.event_time} {event.timezone && <span className="text-slate-500">({event.timezone.replace('_', ' ')})</span>}</p>
                  </div>
                </div>
              )}

              {event?.meeting_link && (
                <div className="flex items-center gap-4 text-slate-300">
                  <div className="w-10 h-10 shrink-0 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800 shadow-sm">
                    <MapPin size={16} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest mb-0.5">Location</p>
                    <p className="text-sm font-medium">Virtual Event</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="hidden lg:block relative z-10 pt-12">
          <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5 uppercase tracking-widest">
            <ShieldCheck size={14} /> Secure registration
          </p>
        </div>
      </div>

      <div className="flex-1 w-full lg:ml-[41.666667%] xl:ml-[33.333333%] flex flex-col items-center justify-center p-4 sm:p-8 lg:p-12 relative">
        
        <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-[24px] shadow-sm border border-slate-200/80 dark:border-slate-800 p-6 sm:p-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          {success || hasRegisteredOnDevice ? (
            <div className="text-center py-8 sm:py-10">
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
                {success ? <CheckCircle2 size={32} className="text-emerald-500" /> : <MonitorSmartphone size={32} className="text-slate-400" />}
              </div>
              <h2 className="text-2xl font-medium text-slate-900 dark:text-white mb-3 tracking-tight">
                {success ? "You're all set!" : "Device Recognized"}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-normal leading-relaxed max-w-sm mx-auto">
                {success 
                  ? `Your spot is secured. We've sent a calendar invite and confirmation details to ${email}.` 
                  : "It looks like you have already registered for this event from this device. Check your email for details."}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="mb-6 sm:mb-8">
                <h2 className="text-xl font-medium text-slate-900 dark:text-white mb-1.5 tracking-tight">Complete Registration</h2>
                <p className="text-sm text-slate-500 font-normal">Please provide your details below to secure your spot.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-widest ml-1">Full Name <span className="text-slate-400">*</span></label>
                <input type="text" required placeholder="Jane Doe" className={inputCls} value={name} onChange={e => setName(e.target.value)} />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-widest ml-1">Email Address <span className="text-slate-400">*</span></label>
                <input type="email" required placeholder="jane@example.com" className={inputCls} value={email} onChange={e => setEmail(e.target.value)} />
              </div>

              {/* WhatsApp Opt-in — Pro orgs only */}
              {event?.whatsapp_enabled && (
              <div className="pt-2">
                <label className={`flex items-center justify-between cursor-pointer p-4 bg-slate-50 dark:bg-slate-800/30 border rounded-[16px] transition-all ${wantsWhatsapp ? 'border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/20' : 'border-slate-200/80 dark:border-slate-700/50 hover:border-slate-400 dark:hover:border-slate-500'}`}>
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox"
                      className="w-5 h-5 accent-emerald-600 rounded cursor-pointer shrink-0"
                      checked={wantsWhatsapp}
                      onChange={e => setWantsWhatsapp(e.target.checked)}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-200 flex items-center gap-2">
                        <MessageCircle size={16} className="text-emerald-500" /> Get reminders via WhatsApp
                      </span>
                    </div>
                  </div>
                </label>

                {wantsWhatsapp && (
                  <div className="mt-4 space-y-2 animate-in slide-in-from-top-2 fade-in duration-300">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-widest ml-1">WhatsApp Number <span className="text-slate-400">*</span></label>
                    <input 
                      type="tel" 
                      required={wantsWhatsapp} 
                      placeholder="+1234567890" 
                      className={inputCls} 
                      value={whatsappNumber} 
                      onChange={e => setWhatsappNumber(e.target.value)} 
                    />
                    <p className="text-[11px] text-slate-400 ml-1">Please include your country code (e.g., +254)</p>
                  </div>
                )}
              </div>
              )}

              {customFields.length > 0 && (
                <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800/50 space-y-6">
                  {customFields.map(field => (
                    <div key={field.id} className="space-y-2">
                      
                      {field.type !== 'checkbox' && (
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-widest ml-1">
                          {field.label} {field.required && <span className="text-slate-400">*</span>}
                        </label>
                      )}

                      {field.type === 'textarea' ? (
                        <textarea rows={3} required={field.required} className={`${inputCls} resize-none`} placeholder="Type your answer here..." value={customAnswers[field.id] as string ?? ''} onChange={e => setCustomAnswers(p => ({ ...p, [field.id]: e.target.value }))} />
                      
                      ) : field.type === 'checkbox' ? (
                        <label className="flex items-center justify-between cursor-pointer p-4 bg-slate-50 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-700/50 rounded-[16px] hover:border-slate-400 dark:hover:border-slate-500 transition-all">
                          <div className="flex items-center gap-3">
                            <input 
                              type="checkbox"
                              className="w-5 h-5 accent-slate-900 dark:accent-white rounded cursor-pointer shrink-0"
                              checked={customAnswers[field.id] as boolean ?? false}
                              onChange={e => setCustomAnswers(p => ({ ...p, [field.id]: e.target.checked }))}
                              required={field.required && !(customAnswers[field.id])} 
                            />
                            <span className="text-sm font-medium text-slate-900 dark:text-slate-200">
                              {field.label} {field.required && <span className="text-slate-400 ml-1">*</span>}
                            </span>
                          </div>
                          <div className={`text-[10px] font-medium uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all shrink-0 ${customAnswers[field.id] ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                            {customAnswers[field.id] ? 'Yes' : 'No'}
                          </div>
                        </label>

                      ) : field.type === 'checkbox_group' ? (
                        <div className="space-y-3 pt-1">
                          {field.options?.map((opt, idx) => {
                            const isChecked = (customAnswers[field.id] as string[] || []).includes(opt);
                            return (
                              <label key={idx} className={`flex items-center gap-3 cursor-pointer p-3.5 rounded-[12px] border transition-all ${isChecked ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600' : 'bg-transparent border-slate-200/80 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600'}`}>
                                <input 
                                  type="checkbox" 
                                  className="w-4 h-4 accent-slate-900 dark:accent-white rounded cursor-pointer shrink-0" 
                                  checked={isChecked} 
                                  onChange={e => toggleCheckboxGroup(field.id, opt, e.target.checked)} 
                                />
                                <span className="text-sm font-normal text-slate-800 dark:text-slate-200">{opt}</span>
                              </label>
                            );
                          })}
                        </div>

                      ) : (
                        <input type="text" required={field.required} className={inputCls} placeholder="Type your answer here..." value={customAnswers[field.id] as string ?? ''} onChange={e => setCustomAnswers(p => ({ ...p, [field.id]: e.target.value }))} />
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800/50">
                <p className="text-center text-xs text-slate-500 dark:text-slate-400 mb-4 px-2">
                  By registering, you agree to our{' '}
                  <a href="/terms" className="font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 transition-colors" target="_blank" rel="noopener noreferrer">Terms</a>
                  {' '}and{' '}
                  <a href="/privacy" className="font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 transition-colors" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
                </p>
                <button type="submit" disabled={submitting} className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm md:text-base font-medium rounded-[16px] hover:bg-slate-800 dark:hover:bg-slate-100 active:scale-[0.98] transition-all shadow-sm disabled:opacity-70 disabled:active:scale-100">
                  {submitting ? <Loader2 size={18} className="animate-spin" /> : 'Confirm Registration'}
                </button>
              </div>

            </form>
          )}
        </div>
        
        <div className="lg:hidden w-full text-center pt-8 pb-4">
          <p className="text-[11px] font-medium uppercase tracking-widest text-slate-500 flex items-center justify-center gap-1.5">
            <ShieldCheck size={14} /> Powered by ReminderFlow
          </p>
        </div>

      </div>
    </div>
  );
}