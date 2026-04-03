'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthUser } from '@/hooks/useAuthUser';
import { 
  CalendarDays, Users, Mail, Plus, AlertCircle, 
  Activity, ArrowRight, Link as LinkIcon, Upload, 
  CheckCircle2, Zap, Loader2
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthUser();
  
  const [events, setEvents] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [globalAttendees, setGlobalAttendees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [eventsRes, metricsRes, attendeesRes] = await Promise.all([
          api.get('/api/events'),
          api.get('/api/analytics/metrics').catch(() => ({ data: { totalEvents: 0, totalAttendees: 0, emailsSent: 0 } })), 
          api.get('/api/attendees').catch(() => ({ data: [] })) 
        ]);
        
        setEvents(eventsRes.data || []);
        setMetrics(metricsRes.data);
        setGlobalAttendees(attendeesRes.data || []);

        const sortedAttendees = (attendeesRes.data || [])
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5);

        const formattedActivity = sortedAttendees.map((attendee: any) => ({
          id: attendee.id,
          type: 'registration',
          text: `New registration: ${attendee.name} joined ${attendee.event_title}`,
          time: getRelativeTime(attendee.created_at),
          icon: <Users size={14} className="text-slate-500 dark:text-slate-400"/>
        }));

        setRecentActivity(formattedActivity);

      } catch (err) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchDashboardData();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `Just now`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  // ---------------------------------------------------------------------------
  // EVENT CLASSIFICATION LOGIC (ACTIVE vs PASSED)
  // ---------------------------------------------------------------------------
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to midnight to include events happening today

  // Filter 1: Active Events (Today + Future)
  const activeEvents = events.filter(e => {
    const eventDate = new Date(e.event_date);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate.getTime() >= today.getTime();
  });

  // Filter 2: Passed Events (Yesterday and older)
  const passedEvents = events.filter(e => {
    const eventDate = new Date(e.event_date);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate.getTime() < today.getTime();
  });

  // Sort Active Events for the Timeline (Closest dates first)
  const upcomingTimeline = [...activeEvents]
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
    .slice(0, 4);

  // --- REAL TRIAGE ENGINE ---
  const generateAlerts = () => {
    const alerts: any[] = [];
    
    const attendeeCounts: Record<string, number> = {};
    globalAttendees.forEach(a => {
      attendeeCounts[a.event_id] = (attendeeCounts[a.event_id] || 0) + 1;
    });

    // Only generate alerts for ACTIVE events
    activeEvents.forEach(event => {
      const daysUntil = Math.ceil((new Date(event.event_date).getTime() - today.getTime()) / (1000 * 3600 * 24));
      const attendees = attendeeCounts[event.id] || 0;
      const daysText = daysUntil === 0 ? 'today' : daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`;

      if (daysUntil <= 3 && !event.meeting_link) {
        alerts.push({
          id: `link-${event.id}`,
          type: 'warning',
          message: `Missing meeting link for "${event.title}" which is happening ${daysText}.`,
          actionText: 'Add link',
          action: () => router.push(`/events/${event.id}/edit`)
        });
      }

      if (daysUntil <= 3 && attendees === 0) {
        alerts.push({
          id: `attendees-${event.id}`,
          type: 'warning',
          message: `"${event.title}" is happening ${daysText} but has 0 registered attendees.`,
          actionText: 'Copy invite link',
          action: () => {
            const link = `${window.location.origin}/r/${event.id}`;
            navigator.clipboard.writeText(link);
            toast.success('Registration link copied! Go share it.');
          }
        });
      }
    });

    if (events.length === 0) {
      alerts.push({
        id: 'no-events',
        type: 'info',
        message: 'Your workspace is empty. Create your first event to get started!',
        actionText: 'Create event',
        action: () => router.push('/events/new')
      });
    }

    return alerts;
  };

  const smartAlerts = generateAlerts();

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin mb-4 text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-medium">Loading your workspace...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl w-full mx-auto space-y-6 pb-12 mt-2">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
          <div>
            <h1 className="text-2xl font-medium text-slate-900 dark:text-white tracking-tight">
              Welcome back, {(user?.fullName ?? user?.name ?? 'Admin').split(' ')[0] || 'Admin'}
            </h1>
            <p className="text-sm text-slate-500 font-normal mt-1">Here is what is happening with your active events today.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button onClick={() => router.push('/attendees')} className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-xl shadow-sm transition-all active:scale-95">
              <Upload size={16} /> Global Directory
            </button>
            <button onClick={() => router.push('/events/new')} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-brand text-brand-foreground text-sm font-medium rounded-xl hover:opacity-90 transition-all shadow-sm active:scale-95">
              <Plus size={16} /> Create Event
            </button>
          </div>
        </div>

        {/* --- METRICS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[20px] border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4 group hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center border border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 shrink-0">
              <CalendarDays size={20} />
            </div>
            <div>
              {/* NOW DISPLAYING STRICTLY ACTIVE EVENTS */}
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Active Events</p>
              <p className="text-3xl font-medium text-slate-900 dark:text-white tracking-tight">{activeEvents.length}</p>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[20px] border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4 group hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center border border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 shrink-0">
              <Users size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Total Attendees</p>
              <p className="text-3xl font-medium text-slate-900 dark:text-white tracking-tight">{metrics?.totalAttendees || 0}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-[20px] border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4 group hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center border border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 shrink-0">
              <Mail size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Emails Sent</p>
              <p className="text-3xl font-medium text-slate-900 dark:text-white tracking-tight">{metrics?.emailsSent || 0}</p>
            </div>
          </div>
        </div>

        {/* --- COMMAND CENTER GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
          
          {/* TIMELINE */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[20px] border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-8 flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-lg font-medium text-slate-900 dark:text-white flex items-center gap-2">
                  <div className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                    <Zap size={16} /> 
                  </div>
                  Active Timeline
                </h2>
                <p className="text-sm text-slate-500 font-normal mt-1.5">Your schedule for upcoming events.</p>
              </div>
              <button onClick={() => router.push('/events')} className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-colors">
                View All <ArrowRight size={14} />
              </button>
            </div>

            <div className="flex-1 relative">
              {upcomingTimeline.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10">
                  <CalendarDays size={48} className="mb-4 opacity-20" />
                  <p className="font-medium text-slate-500">No active events scheduled right now.</p>
                </div>
              ) : (
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-800 before:to-transparent">
                  {upcomingTimeline.map((event, i) => {
                    const eventDate = new Date(event.event_date);
                    const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
                    let dateLabel = daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`;

                    return (
                      <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors group-hover:bg-slate-200 dark:group-hover:bg-slate-700">
                          <CalendarDays size={14} />
                        </div>

                        <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/50 p-5 rounded-[16px] hover:border-slate-300 dark:hover:border-slate-600 shadow-sm transition-all cursor-pointer" onClick={() => router.push(`/events/${event.id}/edit`)}>
                          <div className="flex items-start justify-between mb-3">
                            <span className={`text-[10px] font-medium uppercase tracking-widest px-2.5 py-1 rounded-md ${daysUntil <= 1 ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800/50' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/50'}`}>
                              {dateLabel}
                            </span>
                            <span className="text-xs font-medium text-slate-400">{event.event_time}</span>
                          </div>
                          <h3 className="font-medium text-slate-900 dark:text-white text-lg mb-1 truncate">{event.title}</h3>
                          
                          {/* REGISTRATION LINK COPY BUTTON */}
                          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation(); 
                                const link = `${window.location.origin}/r/${event.id}`;
                                navigator.clipboard.writeText(link);
                                toast.success('Registration link copied!');
                              }}
                              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white text-xs font-medium transition-colors"
                            >
                              <LinkIcon size={14}/> Copy Registration Link
                            </button>
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* TRIAGE & ALERTS */}
          <div className="flex flex-col gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-200/80 dark:border-slate-800 shadow-sm p-6">
              <h2 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <AlertCircle size={14} className="text-rose-500" /> Triage
              </h2>
              
              <div className="space-y-3">
                {smartAlerts.length === 0 ? (
                  <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-[16px] p-4 flex items-start gap-3">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">All systems go! No urgent actions required.</p>
                  </div>
                ) : (
                  smartAlerts.map(alert => (
                    <div key={alert.id} className={`${alert.type === 'info' ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/30 text-blue-900 dark:text-blue-200' : 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/30 text-amber-900 dark:text-amber-200'} border rounded-[16px] p-4 flex items-start gap-3`}>
                      <AlertCircle size={16} className={`${alert.type === 'info' ? 'text-blue-500' : 'text-amber-500'} shrink-0 mt-0.5`} />
                      <div>
                        <p className="text-sm font-medium leading-snug mb-2">{alert.message}</p>
                        <button onClick={alert.action} className={`text-xs font-medium ${alert.type === 'info' ? 'text-blue-700 dark:text-blue-400' : 'text-amber-700 dark:text-amber-400'} hover:underline`}>
                          {alert.actionText} &rarr;
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 flex-1">
              <h2 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Activity size={14} className="text-slate-500 dark:text-slate-400" /> Live Feed
              </h2>
              
              <div className="space-y-6">
                {recentActivity.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm font-medium text-slate-400">No recent registrations.</p>
                  </div>
                ) : (
                  recentActivity.map((item, index) => (
                    <div key={item.id} className="flex gap-4 relative">
                      {index !== recentActivity.length - 1 && (
                        <div className="absolute top-8 left-4 bottom-[-24px] w-px bg-slate-100 dark:bg-slate-800"></div>
                      )}
                      <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 z-10">
                        {item.icon}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-snug">{item.text}</p>
                        <p className="text-xs font-normal text-slate-400 mt-1">{item.time}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <button onClick={() => router.push('/attendees')} className="w-full mt-8 py-2.5 bg-slate-50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800/50 text-sm font-medium text-slate-600 dark:text-slate-300 rounded-xl transition-colors border border-transparent dark:border-slate-700/50">
                View all responses
              </button>
            </div>

          </div>
        </div>

      </div>
    </Layout>
  );
}