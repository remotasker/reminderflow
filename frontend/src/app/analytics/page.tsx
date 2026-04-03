'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Bar, Doughnut } from 'react-chartjs-2';
import { 
  Mail, MailOpen, MousePointerClick, Percent, BarChart3, CalendarDays, ArrowRight, Search, 
  Loader2, CheckCircle2, Clock, XCircle, Send, LayoutDashboard, ClipboardList
} from 'lucide-react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  BarElement, LineElement, Title, Tooltip, Legend, ArcElement, Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, BarElement,
  LineElement, Title, Tooltip, Legend, ArcElement, Filler
);

interface EmailStats {
  totalEmails: number;
  openedEmails: number;
  clickedEmails: number;
  openRate: string;
  clickRate: string;
}

interface EventStat {
  id: string;
  title: string;
  eventDate: string;
  attendeeCount: number;
}

interface EmailLog {
  id: string;
  attendee_email: string;
  template_type: string;
  status: 'pending' | 'sent' | 'failed';
  send_at: string;
}

export default function AnalyticsPage() {
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'performance' | 'delivery'>('performance');

  const [emailStats, setEmailStats] = useState<EmailStats | null>(null);
  const [eventStats, setEventStats] = useState<EventStat[]>([]);
  const [loadingPerformance, setLoadingPerformance] = useState(true);
  const [perfError, setPerfError] = useState('');

  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const fetchPerformanceAnalytics = async () => {
      try {
        setLoadingPerformance(true);
        const [emailRes, eventsRes] = await Promise.all([
          api.get('/api/analytics/email-stats'),
          api.get('/api/analytics/events-stats'),
        ]);
        setEmailStats(emailRes.data);
        setEventStats(eventsRes.data);
        setPerfError('');
      } catch (err: any) {
        setPerfError('Failed to load real analytics data. Check your backend connection.');
      } finally {
        setLoadingPerformance(false);
      }
    };

    fetchPerformanceAnalytics();
    const interval = setInterval(fetchPerformanceAnalytics, 30000); 

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchPerformanceAnalytics();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'delivery' && events.length === 0) {
      const fetchEvents = async () => {
        try {
          const res = await api.get('/api/events');
          setEvents(res.data || []);
          if (res.data?.length > 0) setSelectedEventId(res.data[0].id);
        } catch (err) {}
      };
      fetchEvents();
    }
  }, [activeTab, events.length]);

  useEffect(() => {
    if (activeTab === 'delivery' && selectedEventId) {
      const fetchEmails = async () => {
        setLoadingEmails(true);
        try {
          const res = await api.get(`/api/events/${selectedEventId}/emails`);
          console.log('Email logs response:', res.data);
          setEmails(res.data || []);
        } catch (err: any) {
          console.error('Error loading email logs:', err);
          toast.error('Failed to load email logs');
        } finally {
          setLoadingEmails(false);
        }
      };
      fetchEmails();
    }
  }, [selectedEventId, activeTab]);

  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const appFontFamily = typeof document !== 'undefined' ? getComputedStyle(document.body).fontFamily : 'ui-sans-serif, system-ui, sans-serif';

  const doughnutData = {
    labels: ['Clicked', 'Opened (No Click)', 'Unopened'],
    datasets: [{
      data: [
        emailStats?.clickedEmails || 0,
        emailStats ? emailStats.openedEmails - emailStats.clickedEmails : 0,
        emailStats ? emailStats.totalEmails - emailStats.openedEmails : 0,
      ],
      backgroundColor: [
        isDark ? '#f8fafc' : '#0f172a', 
        isDark ? '#64748b' : '#94a3b8', 
        isDark ? '#1e293b' : '#f1f5f9', 
      ],
      borderWidth: 0,
      hoverOffset: 4
    }],
  };

  const doughnutOptions = {
    maintainAspectRatio: false,
    cutout: '75%',
    plugins: {
      legend: { position: 'bottom' as const, labels: { padding: 20, usePointStyle: true, pointStyle: 'circle', font: { family: appFontFamily, size: 11 }, color: isDark ? '#94a3b8' : '#64748b' } },
      tooltip: { backgroundColor: isDark ? '#1e293b' : '#ffffff', titleColor: isDark ? '#f8fafc' : '#0f172a', bodyColor: isDark ? '#cbd5e1' : '#475569', borderColor: isDark ? '#334155' : '#e2e8f0', borderWidth: 1, padding: 12, cornerRadius: 8, }
    }
  };

  const barData = {
    labels: eventStats.map(e => e.title.length > 15 ? e.title.substring(0, 15) + '...' : e.title),
    datasets: [{
      data: eventStats.map(e => e.attendeeCount),
      backgroundColor: isDark ? '#f8fafc' : '#0f172a',
      borderRadius: 4,
      borderSkipped: false,
      barThickness: Math.min(32, 600 / Math.max(eventStats.length, 1)),
    }],
  };

  const barOptions = {
    maintainAspectRatio: false,
    plugins: { 
      legend: { display: false },
      tooltip: { backgroundColor: isDark ? '#1e293b' : '#ffffff', titleColor: isDark ? '#f8fafc' : '#0f172a', bodyColor: isDark ? '#cbd5e1' : '#475569', borderColor: isDark ? '#334155' : '#e2e8f0', borderWidth: 1, padding: 12, cornerRadius: 8, displayColors: false, }
    },
    scales: {
      y: { grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', drawBorder: false }, border: { display: false }, ticks: { color: isDark ? '#64748b' : '#94a3b8', font: { size: 11, family: appFontFamily }, padding: 10 } },
      x: { grid: { display: false }, border: { display: false }, ticks: { color: isDark ? '#64748b' : '#94a3b8', font: { size: 10, family: appFontFamily }, padding: 8 } }
    }
  };

  const filteredEmails = emails.filter(e => e.attendee_email.toLowerCase().includes(searchTerm.toLowerCase()));

  if (!mounted) return null;

  return (
    <Layout>
      <div className="max-w-7xl w-full mx-auto space-y-8 animate-in fade-in duration-500 pb-12 px-4 sm:px-6 md:px-8">
        
        {/* --- HEADER & TAB SWITCHER --- */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-3">
              {/* 🟢 Soft Tinted Header Icon */}
              <div className="p-2.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl border border-purple-100/50 dark:border-purple-800/50 shadow-sm">
                <BarChart3 size={20} />
              </div>
              <h1 className="text-2xl font-medium text-slate-900 dark:text-white tracking-tight">Insights</h1>
              {activeTab === 'performance' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 rounded-full text-xs font-medium uppercase tracking-widest ml-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Live Sync
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-2 font-normal">Measure your email engagement and track deliverability.</p>
          </div>
          
          <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
            <button onClick={() => setActiveTab('performance')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'performance' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'}`}>
              <LayoutDashboard size={16} /> Performance
            </button>
            <button onClick={() => setActiveTab('delivery')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'delivery' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'}`}>
              <ClipboardList size={16} /> Delivery Logs
            </button>
          </div>
        </div>

        {/* ========================================== */}
        {/* TAB 1: REAL PERFORMANCE STATS              */}
        {/* ========================================== */}
        {activeTab === 'performance' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {perfError && <div className="bg-red-50 text-red-600 px-5 py-4 rounded-[16px] text-sm font-medium border border-red-100">{perfError}</div>}

            {loadingPerformance ? (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 opacity-50">
                {[...Array(5)].map((_, i) => <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-[20px] animate-pulse" />)}
              </div>
            ) : emailStats && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {/* 🟢 Upgraded Stat Cards with Tinted Colors */}
                <StatCard title="Total Sent" value={emailStats.totalEmails} icon={<Mail size={18}/>} colorClass="text-blue-600 dark:text-blue-400" bgClass="bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/50" />
                <StatCard title="Total Opens" value={emailStats.openedEmails} icon={<MailOpen size={18}/>} colorClass="text-emerald-600 dark:text-emerald-400" bgClass="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/50" />
                <StatCard title="Total Clicks" value={emailStats.clickedEmails} icon={<MousePointerClick size={18}/>} colorClass="text-amber-600 dark:text-amber-400" bgClass="bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/50" />
                <StatCard title="Open Rate" value={`${emailStats.openRate}%`} icon={<Percent size={18}/>} colorClass="text-indigo-600 dark:text-indigo-400" bgClass="bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800/50" />
                <StatCard title="Click Rate" value={`${emailStats.clickRate}%`} icon={<BarChart3 size={18}/>} colorClass="text-purple-600 dark:text-purple-400" bgClass="bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800/50" />
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[20px] border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col">
                <div className="mb-6">
                  <h2 className="text-lg font-medium text-slate-900 dark:text-white">Engagement Funnel</h2>
                  <p className="text-sm text-slate-500 font-normal mt-1">Overall email interaction</p>
                </div>
                <div className="flex-1 min-h-[250px] flex justify-center items-center relative">
                  <Doughnut data={doughnutData} options={doughnutOptions} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                    <span className="text-2xl font-medium text-slate-900 dark:text-white">{emailStats?.clickRate}%</span>
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1">Avg Click</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[20px] border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col">
                <div className="mb-6">
                  <h2 className="text-lg font-medium text-slate-900 dark:text-white">Audience Growth</h2>
                  <p className="text-sm text-slate-500 font-normal mt-1">Total attendees registered per event</p>
                </div>
                <div className="flex-1 min-h-[250px] w-full"><Bar data={barData} options={barOptions} /></div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800/50">
                <h2 className="text-lg font-medium text-slate-900 dark:text-white">Event Performance History</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800/50">
                      <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Event Name</th>
                      <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider text-center">Scheduled Date</th>
                      <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider text-right">Total Attendees</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {eventStats.length === 0 ? (
                      <tr><td colSpan={3} className="px-6 py-12 text-center text-sm text-slate-400 font-normal">No event data available yet.</td></tr>
                    ) : (
                      eventStats.map((event) => (
                        <tr key={event.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer" onClick={() => router.push(`/attendees`)}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-purple-500 group-hover:bg-purple-50 dark:group-hover:bg-purple-900/30 transition-colors"><CalendarDays size={14} /></div>
                              <span className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">{event.title}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center"><span className="text-sm font-normal text-slate-500">{new Date(event.eventDate).toLocaleDateString()}</span></td>
                          <td className="px-6 py-4 text-right">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-full">
                              {event.attendeeCount} <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 -ml-1 transition-all group-hover:translate-x-1" />
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 2: DELIVERY LOGS                       */}
        {/* ========================================== */}
        {activeTab === 'delivery' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-[20px] border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="flex flex-col sm:flex-row gap-4 w-full flex-1">
                <select value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)} className="w-full sm:w-72 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-slate-400 cursor-pointer transition-all">
                  {events.map(event => <option key={event.id} value={event.id}>{event.title}</option>)}
                </select>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input type="text" placeholder="Search email address..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-normal text-slate-900 dark:text-white outline-none focus:border-slate-400 transition-all placeholder:text-slate-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden min-h-[400px]">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800/50 flex justify-between items-center">
                <h2 className="text-lg font-medium text-slate-900 dark:text-white">Individual Delivery Logs</h2>
              </div>
              {loadingEmails ? (
                <div className="p-20 flex flex-col items-center text-slate-400"><Loader2 className="animate-spin mb-4 text-slate-300 dark:text-slate-600" size={32} /><p className="text-sm font-medium">Loading email logs...</p></div>
              ) : filteredEmails.length === 0 ? (
                <div className="p-20 text-center"><Send size={48} className="mx-auto text-slate-200 dark:text-slate-800 mb-4" /><h3 className="text-lg font-medium text-slate-900 dark:text-white">No emails found</h3><p className="text-sm text-slate-500 mt-1 font-normal">When attendees register, their emails will appear here.</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800/50">
                        <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Recipient Email</th>
                        <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Email Type</th>
                        <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                      {filteredEmails.map(email => (
                        <tr key={email.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4 font-medium text-sm text-slate-900 dark:text-slate-100">{email.attendee_email}</td>
                          <td className="px-6 py-4"><span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-[11px] font-medium uppercase tracking-wider">{email.template_type === 'confirmation' ? 'Confirmation' : `${email.template_type} Reminder`}</span></td>
                          <td className="px-6 py-4">
                            {/* Semantic Status Colors */}
                            {email.status === 'sent' && <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-medium"><CheckCircle2 size={14}/> Sent</span>}
                            {email.status === 'pending' && <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs font-medium"><Clock size={14}/> Pending</span>}
                            {email.status === 'failed' && <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400 text-xs font-medium"><XCircle size={14}/> Failed</span>}
                          </td>
                          <td className="px-6 py-4 text-sm font-normal text-slate-500">{new Date(email.send_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}

// 🟢 Upgraded StatCard Component
function StatCard({ 
  title, value, icon, colorClass, bgClass 
}: { 
  title: string, value: string | number, icon: React.ReactNode, colorClass: string, bgClass: string 
}) {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-[20px] border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${bgClass} ${colorClass}`}>
          {icon}
        </div>
        <span className="text-xs font-medium uppercase tracking-widest text-slate-500 dark:text-slate-400">{title}</span>
      </div>
      <p className="text-3xl font-medium text-slate-900 dark:text-white tracking-tight">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
    </div>
  );
}