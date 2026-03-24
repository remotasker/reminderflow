'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Layout } from '@/components/Layout';
import api from '@/lib/api';
import { Line } from 'react-chartjs-2';
// Professional Icons
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Mail, 
  Bell, 
  ArrowUpRight, 
  BarChart3 
} from 'lucide-react';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface Metrics {
  totalEvents: number;
  totalAttendees: number;
  emailsSent: number;
  upcomingEvents: number;
}

interface ChartData {
  date: string;
  count: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
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
    fetchMetrics();
  }, [router]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const [metricsRes, timelineRes] = await Promise.all([
        api.get('/api/analytics/metrics'),
        api.get('/api/analytics/timeline'),
      ]);
      setMetrics(metricsRes.data);
      setChartData(timelineRes.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  const chartDataFormatted = {
    labels: chartData.map((d) => d.date),
    datasets: [
      {
        fill: true,
        label: 'Emails Sent',
        data: chartData.map((d) => d.count),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
    ],
  };

  if (!mounted || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white transition-colors">Dashboard Overview</h1>
            <p className="text-slate-500 dark:text-slate-400">Welcome back! Here is what's happening today.</p>
          </div>
          <Link href="/events" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all text-center">
            + New Event
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 text-red-700 dark:text-red-400 rounded-r-xl">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard title="Total Events" value={metrics?.totalEvents || 0} icon={<Calendar size={20}/>} color="text-blue-600" />
          <MetricCard title="Total Attendees" value={metrics?.totalAttendees || 0} icon={<Users size={20}/>} color="text-purple-600" />
          <MetricCard title="Emails Sent" value={metrics?.emailsSent || 0} icon={<Mail size={20}/>} color="text-emerald-600" />
          <MetricCard title="Upcoming" value={metrics?.upcomingEvents || 0} icon={<Bell size={20}/>} color="text-orange-600" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Email Activity</h2>
            <div className="h-[300px]">
              <Line data={chartDataFormatted} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Quick Links</h2>
            <div className="space-y-3">
              <Link href="/analytics" className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group">
                <div className="flex items-center gap-3">
                  <BarChart3 size={18} className="text-slate-400 group-hover:text-blue-600" />
                  <span className="font-bold text-sm text-slate-700 dark:text-slate-200">View Reports</span>
                </div>
                <ArrowUpRight size={16} className="text-slate-300" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function MetricCard({ title, value, icon, color }: any) {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{title}</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-2 transition-colors">{value.toLocaleString()}</p>
        </div>
        <div className={`p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl ${color} transition-colors`}>
          {icon}
        </div>
      </div>
    </div>
  );
}