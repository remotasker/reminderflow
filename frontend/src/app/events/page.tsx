'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import api from '@/lib/api';
import { getSafeExternalUrl } from '@/lib/url';
import { getEventStatusLabel, hasEventPassed } from '@/lib/dateUtils';
import toast from 'react-hot-toast';
import { 
  Calendar, 
  Clock, 
  Globe, 
  ChevronDown, 
  ChevronUp, 
  Link as LinkIcon, 
  Copy, 
  Check,
  Video,
  Users,
  Edit,
  FileUp,
  Trash2,
  Plus,
  CalendarDays
} from 'lucide-react';

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  timezone: string;
  meeting_link: string;
}

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await api.get('/api/events');
      setEvents(res.data);
    } catch (error) {
      console.error('Failed to fetch events', error);
      toast.error('Failed to load events.');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prevId) => (prevId === id ? null : id));
  };

  const copyToClipboard = (eventId: string) => {
    const url = `${window.location.origin}/r/${eventId}`;
    navigator.clipboard.writeText(url);
    
    setCopiedId(eventId);
    toast.success('Registration link copied!');
    setTimeout(() => setCopiedId(null), 2000); 
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;
    try {
      await api.delete(`/api/events/${eventId}`);
      setEvents(events.filter(event => event.id !== eventId));
      toast.success('Event deleted successfully!');
    } catch (error: any) {
      toast.error('Failed to delete event.');
    }
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>, eventId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ''; 
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast.error('Please upload a valid CSV file.');
      return;
    }
    setIsUploading(eventId);
    const loadingToast = toast.loading('Importing attendees...');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post(`/api/events/${eventId}/import`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.dismiss(loadingToast);
      toast.success(response.data.message || 'Attendees imported successfully!');
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(error.response?.data?.error || 'Failed to import CSV.');
    } finally {
      setIsUploading(null);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl w-full mx-auto space-y-8 animate-in fade-in duration-500 pb-12 px-4 sm:px-6 md:px-8">
        
        {/* --- HEADER SECTION --- */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-medium text-slate-900 dark:text-white tracking-tight">Your Events</h1>
            <p className="text-sm text-slate-500 mt-1 font-normal">Manage your schedule and share registration links.</p>
          </div>
          
          <button 
            onClick={() => router.push('/events/new')}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium rounded-full hover:bg-slate-800 dark:hover:bg-slate-100 transition-all active:scale-95 shadow-sm"
          >
            <Plus size={18} />
            Create event
          </button>
        </div>

        {/* --- 1. SKELETON LOADER (Separated Cards) --- */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-200/80 dark:border-slate-800 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
                <div className="space-y-3 w-full max-w-md">
                  <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded-md w-2/3 animate-pulse"></div>
                  <div className="flex gap-4">
                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-md w-24 animate-pulse"></div>
                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-md w-20 animate-pulse"></div>
                  </div>
                </div>
                <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse mt-4 sm:mt-0"></div>
              </div>
            ))}
          </div>

        /* --- 2. BEAUTIFUL EMPTY STATE --- */
        ) : events.length === 0 ? (
          <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200 border-dashed dark:border-slate-800 shadow-sm flex flex-col items-center justify-center">
            <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-full flex items-center justify-center mb-4">
              <CalendarDays size={32} />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No events scheduled</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mb-8 font-normal">
              You haven't created any events yet. Set up your first event to start accepting registrations and sending automated reminders.
            </p>
            <button 
              onClick={() => router.push('/events/new')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium rounded-full hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-sm active:scale-95"
            >
              <Plus size={18} />
              Create Your First Event
            </button>
          </div>

        /* --- 3. EVENT CARDS (Separated Design) --- */
        ) : (
          <div className="space-y-4">
            {events.map((event) => {
              const safeMeetingLink = getSafeExternalUrl(event.meeting_link);

              return (
                <div 
                  key={event.id} 
                  className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300"
                >
                  
                  {/* Main Row */}
                  <div 
                    onClick={() => toggleExpand(event.id)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-6 cursor-pointer group"
                  >
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-slate-900 dark:text-white tracking-tight">{event.title}</h3>
                      
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2 text-sm text-slate-500 font-normal">
                        <span className="flex items-center gap-2">
                          <Calendar size={16} className="text-slate-400" /> 
                          {new Date(event.event_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-2">
                          <Clock size={16} className="text-slate-400" /> 
                          {event.event_time}
                        </span>
                        <span className="flex items-center gap-2">
                          <Globe size={16} className="text-slate-400" /> 
                          {event.timezone.replace('_', ' ')}
                        </span>
                        <span className={`flex items-center gap-1.5 ml-2 px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider ${
                          hasEventPassed(event.event_date)
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                        }`}>
                          {getEventStatusLabel(event.event_date)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4 sm:mt-0 flex items-center justify-end">
                      <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-slate-100 dark:group-hover:bg-slate-700 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                        {expandedId === event.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details Section */}
                  {expandedId === event.id && (
                    <div className="p-6 pt-0 animate-in slide-in-from-top-4 duration-300">
                      <div className="w-full h-px bg-slate-100 dark:bg-slate-800/50 mb-6"></div>
                      
                      {event.description && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed max-w-3xl font-normal">
                          {event.description}
                        </p>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                        
                        {/* Registration Link Box */}
                        <div className="p-5 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-2 mb-2 text-sm font-medium text-slate-900 dark:text-white">
                            <LinkIcon size={16} className="text-slate-700 dark:text-slate-300" />
                            Registration Link
                          </div>
                          <p className="text-xs text-slate-500 mb-4 font-normal">Share this public link to accept signups.</p>
                          <button 
                            onClick={(e) => { e.stopPropagation(); copyToClipboard(event.id); }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-900 dark:text-white text-sm font-medium rounded-xl transition-all shadow-sm"
                          >
                            {copiedId === event.id ? (
                              <><Check size={16} className="text-slate-900 dark:text-white" /> Copied</>
                            ) : (
                              <><Copy size={16} /> Copy URL</>
                            )}
                          </button>
                        </div>

                        {/* Internal Details Box */}
                        <div className="p-5 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col justify-center">
                          <div className="flex items-center gap-2 mb-3 text-sm font-medium text-slate-900 dark:text-white">
                            <Video size={16} className="text-slate-700 dark:text-slate-300" />
                            Meeting Details
                          </div>
                          {safeMeetingLink ? (
                            <a href={safeMeetingLink} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-900 dark:text-white hover:underline break-all font-normal">
                              {safeMeetingLink}
                            </a>
                          ) : (
                            <div className="text-sm text-slate-500 italic font-normal">No virtual meeting link provided.</div>
                          )}
                        </div>
                      </div>

                      {/* Quick Actions Bar */}
                      <div className="flex flex-wrap items-center gap-3">
                        <button 
                          onClick={() => router.push(`/events/${event.id}/attendees`)}
                          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
                        >
                          <Users size={16} className="text-slate-500" />
                          Attendees
                        </button>

                        <label 
                          htmlFor={`csv-upload-${event.id}`} 
                          className={`flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm cursor-pointer ${isUploading === event.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <FileUp size={16} className="text-slate-500" />
                          {isUploading === event.id ? 'Uploading...' : 'Import CSV'}
                        </label>
                        <input 
                          id={`csv-upload-${event.id}`} 
                          type="file" 
                          accept=".csv" 
                          className="hidden" 
                          disabled={isUploading === event.id}
                          onChange={(e) => handleCsvUpload(e, event.id)} 
                        />

                        <button 
                          onClick={() => router.push(`/events/${event.id}/edit`)}
                          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
                        >
                          <Edit size={16} className="text-slate-500" />
                          Edit
                        </button>

                        <button 
                          onClick={() => handleDeleteEvent(event.id)}
                          className="flex items-center gap-2 px-4 py-2 ml-auto text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}