'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Layout } from '@/components/Layout';
import api from '@/lib/api';
import Papa from 'papaparse';
import {
  Users, Search, Calendar, Download,
  Loader2, Filter, Mail, Clock, ShieldCheck,
  UserX, XCircle, Building, Globe, RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';

const POLL_INTERVAL_MS = 15_000; // re-fetch every 15 seconds

interface GlobalAttendee {
  id:          string;
  name:        string;
  email:       string;
  created_at:  string;
  event_title: string;
  event_id:    string;
}

interface EventSummary {
  id:    string;
  title: string;
}

export default function GlobalAttendeesPage() {
  const [attendees,  setAttendees]  = useState<GlobalAttendee[]>([]);
  const [events,     setEvents]     = useState<EventSummary[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const [searchTerm,      setSearchTerm]      = useState('');
  const [selectedEventId, setSelectedEventId] = useState<string>('all');

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Data fetch ─────────────────────────────────────────────────────────

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else         setRefreshing(true);

    try {
      const [attendeesRes, eventsRes] = await Promise.all([
        api.get('/api/attendees'),
        api.get('/api/events'),
      ]);

      setAttendees(Array.isArray(attendeesRes.data) ? attendeesRes.data : []);

      const eventsData = Array.isArray(eventsRes.data) ? eventsRes.data : [];
      setEvents(eventsData.map((e: any) => ({ id: e.id, title: e.title || e.name || 'Unknown Event' })));
      setLastRefreshed(new Date());
    } catch (err: any) {
      if (!silent) toast.error(err.response?.data?.error || 'Failed to load directory data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  // Auto-poll every 15 seconds (silent — no loading spinner)
  useEffect(() => {
    pollRef.current = setInterval(() => fetchData(true), POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchData]);

  // ── Filtering ──────────────────────────────────────────────────────────

  const filteredAttendees = attendees.filter(a => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q);
    const matchesEvent  = selectedEventId === 'all' || a.event_id === selectedEventId;
    return matchesSearch && matchesEvent;
  });

  // ── CSV export ─────────────────────────────────────────────────────────

  const handleExportCSV = () => {
    if (filteredAttendees.length === 0) { toast.error('No attendees to export'); return; }

    const csv  = Papa.unparse(filteredAttendees.map(a => ({
      Name:                a.name,
      Email:               a.email,
      'Event Registered':  a.event_title,
      'Registration Date': new Date(a.created_at).toLocaleDateString(),
    })));

    const eventName = selectedEventId === 'all'
      ? 'Global_Audience'
      : events.find(e => e.id === selectedEventId)?.title.replace(/\s+/g, '_');

    const link = document.createElement('a');
    link.href     = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    link.download = `ReminderFlow_${eventName}_${new Date().toISOString().split('T')[0]}.csv`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Audience list exported!');
  };

  const clearSearch = () => setSearchTerm('');

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <Layout>
      <div className="max-w-7xl w-full mx-auto space-y-6 animate-in fade-in duration-500 pb-12 px-4 sm:px-6 md:px-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-3">
            {/* 🟢 Soft Blue Icon Restored */}
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-100/50 dark:border-blue-800/50 shadow-sm">
              <Users size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-medium text-slate-900 dark:text-white tracking-tight">
                Audience Directory
              </h1>
              <p className="text-sm text-slate-500 font-normal mt-1">
                Manage, filter, and export your global event attendees.
              </p>
            </div>
          </div>

          {/* Manual refresh + last-refreshed timestamp */}
          <div className="flex items-center gap-3">
            {lastRefreshed && (
              <span className="text-xs text-slate-400 hidden sm:block font-medium">
                Updated {lastRefreshed.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50 shadow-sm"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin text-blue-500' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Summary cards - 🟢 Soft Color Icons Restored */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              icon:    <ShieldCheck size={22} className="text-blue-600 dark:text-blue-400" />,
              bg:      'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/50',
              label:   'Total Verified Contacts',
              value:   attendees.length,
            },
            {
              icon:    <Building size={22} className="text-emerald-600 dark:text-emerald-400" />,
              bg:      'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/50',
              label:   'Active Events',
              value:   events.length,
            },
            {
              icon:    <Filter size={22} className="text-amber-600 dark:text-amber-400" />,
              bg:      'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/50',
              label:   'Filtered Results',
              value:   filteredAttendees.length,
            },
          ].map(card => (
            <div
              key={card.label}
              className="bg-white dark:bg-slate-900 p-6 rounded-[20px] border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-all hover:shadow-md"
            >
              <div className={`h-12 w-12 rounded-full flex items-center justify-center border ${card.bg}`}>
                {card.icon}
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">{card.label}</p>
                <p className="text-2xl font-medium text-slate-900 dark:text-white tracking-tight">
                  {refreshing ? (
                    <span className="inline-block w-8 h-7 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                  ) : card.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-[20px] border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto flex-1">

            <div className="relative w-full sm:w-80 flex items-center">
              <Search className="absolute left-3 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-normal text-slate-900 dark:text-white outline-none focus:border-slate-400 transition-all placeholder:text-slate-400"
              />
              {searchTerm && (
                <button onClick={clearSearch} className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                  <XCircle size={16} />
                </button>
              )}
            </div>

            <div className="relative w-full sm:w-64 flex items-center">
              <Globe className="absolute left-3 text-slate-400 pointer-events-none" size={16} />
              <select
                value={selectedEventId}
                onChange={e => setSelectedEventId(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-slate-400 transition-all cursor-pointer appearance-none"
              >
                <option value="all">All Events</option>
                {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
              </select>
            </div>
          </div>

          <button
            onClick={handleExportCSV}
            disabled={filteredAttendees.length === 0}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 shadow-sm"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden min-h-[400px]">
          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="animate-spin mb-4 text-blue-500" size={32} />
              <p className="text-sm font-medium">Querying global directory...</p>
            </div>
          ) : filteredAttendees.length === 0 ? (
            <div className="p-20 text-center animate-in fade-in zoom-in-95 duration-300">
              <UserX size={48} className="mx-auto text-slate-200 dark:text-slate-800 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white">No matches found</h3>
              <p className="text-sm text-slate-500 mt-1 font-normal">
                Try clearing your search or selecting a different event.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800/50">
                  <tr>
                    <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Attendee</th>
                    <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Event</th>
                    <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Registered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {filteredAttendees.map(attendee => (
                    <tr
                      key={attendee.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900 dark:text-slate-100 tracking-tight">{attendee.name}</p>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 font-normal">
                          {/* 🟢 Mail icon glows blue on hover */}
                          <Mail size={12} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                          {attendee.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 text-xs font-medium text-slate-700 dark:text-slate-300">
                          {/* 🟢 Calendar icon gets subtle primary color */}
                          <Calendar size={12} className="text-indigo-500" />
                          {attendee.event_title}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-normal text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Clock size={14} className="text-slate-400" />
                          {new Date(attendee.created_at).toLocaleDateString(undefined, {
                            year: 'numeric', month: 'short', day: 'numeric',
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
}