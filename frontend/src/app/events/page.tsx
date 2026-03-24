'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Layout } from '@/components/Layout';
import api from '@/lib/api';
import { 
  Plus, 
  X, 
  Calendar, 
  Clock, 
  Globe, 
  Link as LinkIcon, 
  Users, 
  Trash2, 
  ChevronRight,
  AlertCircle
} from 'lucide-react';

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  timezone: string;
  meeting_link: string;
  created_at: string;
}

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventDate: '',
    eventTime: '14:00',
    timezone: 'America/New_York',
    meetingLink: '',
    reminderSchedule: ['confirmation', '24h', '1h'],
  });

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchEvents();
  }, [router]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/events');
      setEvents(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleReminderToggle = (reminder: string) => {
    setFormData(prev => ({
      ...prev,
      reminderSchedule: prev.reminderSchedule.includes(reminder)
        ? prev.reminderSchedule.filter(r => r !== reminder)
        : [...prev.reminderSchedule, reminder],
    }));
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/events', formData);
      setFormData({
        title: '',
        description: '',
        eventDate: '',
        eventTime: '14:00',
        timezone: 'America/New_York',
        meetingLink: '',
        reminderSchedule: ['confirmation', '24h', '1h'],
      });
      setShowForm(false);
      setError('');
      fetchEvents();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create event');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      await api.delete(`/api/events/${eventId}`);
      fetchEvents();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete event');
    }
  };

  if (!mounted) return null;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Events</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Schedule and manage your attendee notifications</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg ${
              showForm 
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300' 
                : 'bg-blue-600 text-white shadow-blue-500/20 hover:bg-blue-700'
            }`}
          >
            {showForm ? <X size={20} /> : <Plus size={20} />}
            {showForm ? 'Cancel' : 'New Event'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 flex items-center gap-3 text-red-700 dark:text-red-400 rounded-r-xl">
            <AlertCircle size={20} />
            <p className="font-medium text-sm">{error}</p>
          </div>
        )}

        {/* Create Event Form Card */}
        {showForm && (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl animate-in slide-in-from-top-4 duration-300">
            <h2 className="text-xl font-black text-slate-800 dark:text-white mb-8">Event Details</h2>
            <form onSubmit={handleCreateEvent} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Title *</label>
                  <input
                    name="title"
                    type="text"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white transition-all"
                    placeholder="E.g. Monthly Strategy Review"
                    value={formData.title}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Meeting Link</label>
                  <input
                    name="meetingLink"
                    type="url"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white transition-all"
                    placeholder="https://zoom.us/..."
                    value={formData.meetingLink}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Date</label>
                  <input
                    name="eventDate"
                    type="date"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                    value={formData.eventDate}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Time</label>
                    <input
                      name="eventTime"
                      type="time"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                      value={formData.eventTime}
                      onChange={handleFormChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Timezone</label>
                    <select
                      name="timezone"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                      value={formData.timezone}
                      onChange={handleFormChange}
                    >
                      <option>America/New_York</option>
                      <option>Europe/London</option>
                      <option>Asia/Tokyo</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                  placeholder="What is this event about?"
                  value={formData.description}
                  onChange={handleFormChange}
                />
              </div>

              <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 block">Reminder Automation</label>
                <div className="flex flex-wrap gap-6">
                  {['confirmation', '24h', '1h'].map((reminder) => (
                    <label key={reminder} className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={formData.reminderSchedule.includes(reminder)}
                          onChange={() => handleReminderToggle(reminder)}
                          className="peer h-5 w-5 opacity-0 absolute cursor-pointer"
                        />
                        <div className="h-5 w-5 border-2 border-slate-300 dark:border-slate-700 rounded-md peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all"></div>
                      </div>
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-300 group-hover:text-blue-500 transition-colors capitalize">
                        {reminder === 'confirmation' ? 'Immediate Confirmation' : `${reminder} before`}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <button type="submit" className="w-full md:w-auto px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-lg shadow-blue-500/30 transition-all">
                Create Event
              </button>
            </form>
          </div>
        )}

        {/* Events Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-20 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
            <Calendar size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">No events found</h3>
            <p className="text-slate-500 mt-1">Ready to start scheduling? Create your first event above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {events.map((event) => (
              <div key={event.id} className="group bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-blue-200 dark:hover:border-blue-900/50 transition-all">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="space-y-4 flex-1">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                        {event.title}
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 line-clamp-2">{event.description || 'No description provided.'}</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-y-2 gap-x-6 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-blue-500" />
                        {new Date(event.event_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-emerald-500" />
                        {event.event_time}
                      </div>
                      <div className="flex items-center gap-2">
                        <Globe size={14} className="text-purple-500" />
                        {event.timezone}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {event.meeting_link && (
                      <a 
                        href={event.meeting_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 transition-all"
                        title="Open Meeting"
                      >
                        <LinkIcon size={18} />
                      </a>
                    )}
                    <Link
                      href={`/events/${event.id}/attendees`}
                      className="flex items-center gap-2 px-5 py-3 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                    >
                      <Users size={18} />
                      <span className="hidden sm:inline">Attendees</span>
                    </Link>
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="p-3 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}