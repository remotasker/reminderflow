'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import api from '@/lib/api';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { 
  Mail, 
  MailOpen, 
  MousePointerClick, 
  Percent, 
  BarChart3, 
  CalendarDays,
  History
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
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

interface TimelineData {
  date: string;
  count: number;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [emailStats, setEmailStats] = useState<EmailStats | null>(null);
  const [eventStats, setEventStats] = useState<EventStat[]>([]);
  const [timelineData, setTimelineData] = useState<TimelineData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchAnalytics();
  }, [router]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [emailRes, eventsRes, timelineRes] = await Promise.all([
        api.get('/api/analytics/email-stats'),
        api.get('/api/analytics/events-stats'),
        api.get('/api/analytics/timeline'),
      ]);
      setEmailStats(emailRes.data);
      setEventStats(eventsRes.data);
      setTimelineData(timelineRes.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          <p className="text-slate-500 font-medium animate-pulse">Analyzing data...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Analytics</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Email performance and engagement metrics</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 text-red-700 dark:text-red-300 rounded-r-xl">
            <p className="font-bold">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Email Stats Cards */}
        {emailStats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard title="Total Emails" value={emailStats.totalEmails} icon={<Mail size={20}/>} color="text-blue-500" />
            <StatCard title="Opened" value={emailStats.openedEmails} icon={<MailOpen size={20}/>} color="text-emerald-500" />
            <StatCard title="Clicked" value={emailStats.clickedEmails} icon={<MousePointerClick size={20}/>} color="text-amber-500" />
            <StatCard title="Open Rate" value={`${emailStats.openRate}%`} icon={<Percent size={20}/>} color="text-purple-500" />
            <StatCard title="Click Rate" value={`${emailStats.clickRate}%`} icon={<BarChart3 size={20}/>} color="text-pink-500" />
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Email Status Distribution */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Email Status</h2>
            <div className="h-[300px] flex justify-center">
              <Doughnut
                data={{
                  labels: ['Unopened', 'Opened', 'Clicked'],
                  datasets: [{
                    data: [
                      emailStats ? emailStats.totalEmails - emailStats.openedEmails : 0,
                      emailStats ? emailStats.openedEmails - emailStats.clickedEmails : 0,
                      emailStats?.clickedEmails || 0,
                    ],
                    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'],
                    borderWidth: 0,
                    hoverOffset: 10
                  }],
                }}
                options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }}
              />
            </div>
          </div>

          {/* Attendees per Event Bar Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Attendees per Event</h2>
            <div className="h-[300px]">
              <Bar
                data={{
                  labels: eventStats.map(e => e.title.length > 15 ? e.title.substring(0, 15) + '...' : e.title),
                  datasets: [{
                    label: 'Attendees',
                    data: eventStats.map(e => e.attendeeCount),
                    backgroundColor: '#3b82f6',
                    borderRadius: 8,
                  }],
                }}
                options={{ 
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: { grid: { color: 'rgba(156, 163, 175, 0.1)' }, ticks: { font: { family: 'Poppins' } } },
                    x: { grid: { display: false }, ticks: { font: { family: 'Poppins' } } }
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Timeline & Table Section */}
        <div className="grid grid-cols-1 gap-8">
          {/* Recent Events Table */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <History className="text-blue-600" size={20} />
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Recent Events History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-400 text-xs font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                    <th className="pb-4 px-2">Event Title</th>
                    <th className="pb-4 px-2">Date</th>
                    <th className="pb-4 px-2 text-right">Attendees</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {eventStats.map((event) => (
                    <tr key={event.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-4 px-2 font-bold text-slate-700 dark:text-slate-200">{event.title}</td>
                      <td className="py-4 px-2 text-slate-500 dark:text-slate-400 flex items-center gap-2 text-sm">
                        <CalendarDays size={14} />
                        {new Date(event.eventDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-4 px-2 text-right">
                        <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-black">
                          {event.attendeeCount}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function StatCard({ title, value, icon, color }: any) {
  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:translate-y-[-2px]">
      <div className={`p-2.5 w-fit rounded-xl bg-slate-50 dark:bg-slate-800 mb-4 ${color}`}>
        {icon}
      </div>
      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{title}</p>
      <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{value}</p>
    </div>
  );
}