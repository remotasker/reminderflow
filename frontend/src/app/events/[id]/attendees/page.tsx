'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Layout, notify } from '@/components/Layout';
import api from '@/lib/api';
import Papa from 'papaparse';
import {
  ArrowLeft, Users, Search, Mail, CalendarDays,
  Loader2, UserPlus, FileUp, Trash2, X, FileText,
  AlertCircle, CheckCircle2,
} from 'lucide-react';

interface Attendee {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

interface Event {
  id: string;
  title: string;
}

type UploadMode = 'none' | 'single' | 'csv';

const inputCls = "w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-normal text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-all";

export default function AttendeesPage() {
  const params  = useParams();
  const router  = useRouter();
  const eventId = (params.id ?? params.eventId) as string;

  const [attendees, setAttendees]   = useState<Attendee[]>([]);
  const [event, setEvent]           = useState<Event | null>(null);
  const [loading, setLoading]       = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadMode, setUploadMode] = useState<UploadMode>('none');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');
  const [csvFile, setCsvFile]       = useState<File | null>(null);
  const fileInputRef                = useRef<HTMLInputElement>(null);

  const [singleForm, setSingleForm] = useState({ name: '', email: '' });

  useEffect(() => {
    if (eventId) {
      fetchAttendees();
      fetchEvent();
    }
  }, [eventId]);

  const fetchAttendees = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/attendees/${eventId}`);
      setAttendees(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load attendees');
    } finally {
      setLoading(false);
    }
  };

  const fetchEvent = async () => {
    try {
      const res = await api.get(`/api/events/${eventId}`);
      setEvent(res.data);
    } catch (err: any) {
      console.error('Failed to fetch event:', err);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3500);
  };

  // ── Single attendee add ──────────────────────────────────────────────────
  const handleAddSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/api/attendees/${eventId}`, singleForm);
      setSingleForm({ name: '', email: '' });
      setUploadMode('none');
      showSuccess('Attendee added — confirmation email sent');
      fetchAttendees();
      notify({
        type: 'attendee_added',
        message: `${singleForm.name} has registered`,
        eventTitle: event?.title || 'Event'
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add attendee');
    } finally {
      setSubmitting(false);
    }
  };

  // ── CSV upload ───────────────────────────────────────────────────────────
  const handleCSVUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) { setError('Please select a CSV file'); return; }
    setSubmitting(true);
    setError('');

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const attendeesData = (results.data as any[])
            .filter(row => row.name && row.email)
            .map(row => ({ name: row.name.trim(), email: row.email.trim() }));

          if (attendeesData.length === 0) {
            setError('No valid rows found. CSV must have "name" and "email" columns.');
            setSubmitting(false);
            return;
          }

          const res = await api.post(`/api/attendees/${eventId}/bulk-upload`, {
            attendees: attendeesData,
          });

          setCsvFile(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
          setUploadMode('none');

          const { addedCount, errors } = res.data;
          const msg = errors?.length
            ? `${addedCount} added — ${errors.length} skipped (duplicates or invalid)`
            : `${addedCount} attendees imported successfully`;
          showSuccess(msg);
          fetchAttendees();
          notify({
            type: 'attendee_added',
            message: `${addedCount} attendees imported`,
            eventTitle: event?.title || 'Event'
          });
        } catch (err: any) {
          setError(err.response?.data?.error || 'Failed to upload CSV');
        } finally {
          setSubmitting(false);
        }
      },
      error: (err: any) => {
        setError(`CSV parse error: ${err.message}`);
        setSubmitting(false);
      },
    });
  };

  // ── Delete attendee ──────────────────────────────────────────────────────
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove ${name}?`)) return;
    try {
      await api.delete(`/api/attendees/remove/${id}`);
      setAttendees(prev => prev.filter(a => a.id !== id));
      notify({
        type: 'attendee_removed',
        message: `${name} has been removed`,
        eventTitle: event?.title || 'Event'
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to remove attendee');
    }
  };

  const filtered = attendees.filter(a =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const closeMode = () => {
    setUploadMode('none');
    setError('');
    setCsvFile(null);
    setSingleForm({ name: '', email: '' });
  };

  return (
    <Layout>
      <div className="max-w-7xl w-full mx-auto space-y-6 animate-in fade-in duration-500 pb-12 px-4 sm:px-6 md:px-8">

        {/* --- Header --- */}
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => router.push('/events')}
            className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors shadow-sm">
            <ArrowLeft size={18} />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-100/50 dark:border-blue-800/50 shadow-sm">
              <Users size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-medium text-slate-900 dark:text-white tracking-tight">
                Event Attendees
              </h1>
              <p className="text-sm text-slate-500 font-normal mt-1">
                {event ? `Manage guests registered for ${event.title}` : 'Manage and view registered guests for this event.'}
              </p>
            </div>
          </div>
        </div>

        {/* --- Feedback Banners --- */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-xl flex items-center justify-between text-red-600 dark:text-red-400 text-sm font-medium shadow-sm">
            <div className="flex items-center gap-3">
              <AlertCircle size={16} />{error}
            </div>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-600"><X size={16} /></button>
          </div>
        )}
        {success && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-500 p-4 rounded-r-xl flex items-center gap-3 text-emerald-700 dark:text-emerald-400 text-sm font-medium shadow-sm">
            <CheckCircle2 size={16} />{success}
          </div>
        )}

        {/* --- Toolbar --- */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-[20px] border border-slate-200/80 dark:border-slate-800 shadow-sm">
          
          <div className="relative w-full sm:w-80 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" placeholder="Search by name or email..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm font-normal text-slate-900 dark:text-slate-200 focus:border-slate-400 transition-all placeholder:text-slate-400" />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
            <span className="text-xs font-medium text-slate-500 bg-slate-50 dark:bg-slate-800/50 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 whitespace-nowrap">
              Total: <span className="text-slate-900 dark:text-slate-100 font-bold ml-1">{attendees.length}</span>
            </span>
            
            <button
              onClick={() => setUploadMode(uploadMode === 'csv' ? 'none' : 'csv')}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm whitespace-nowrap ${
                uploadMode === 'csv'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}>
              <FileUp size={16} className={uploadMode === 'csv' ? 'text-white' : 'text-emerald-500'} /> 
              Import CSV
            </button>
            
            <button
              onClick={() => setUploadMode(uploadMode === 'single' ? 'none' : 'single')}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm whitespace-nowrap ${
                uploadMode === 'single'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100'
              }`}>
              <UserPlus size={16} /> 
              Add Single
            </button>
          </div>
        </div>

        {/* --- Single Attendee Form --- */}
        {uploadMode === 'single' && (
          <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden animate-in slide-in-from-top-2 duration-300">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                  <UserPlus size={16} />
                </div>
                <span className="text-sm font-medium text-slate-900 dark:text-white">Add single attendee</span>
              </div>
              <button onClick={closeMode} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"><X size={18} /></button>
            </div>
            <form onSubmit={handleAddSingle} className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-6 items-end">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-widest">Full name</label>
                <input className={inputCls} placeholder="Jane Doe"
                  value={singleForm.name} onChange={e => setSingleForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-widest">Email address</label>
                <input className={inputCls} type="email" placeholder="jane@example.com"
                  value={singleForm.email} onChange={e => setSingleForm(p => ({ ...p, email: e.target.value }))} required />
              </div>
              <div>
                <button type="submit" disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-all shadow-sm disabled:opacity-50">
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                  Add Attendee
                </button>
              </div>
            </form>
          </div>
        )}

        {/* --- CSV Upload Form --- */}
        {uploadMode === 'csv' && (
          <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden animate-in slide-in-from-top-2 duration-300">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
                  <FileUp size={16} />
                </div>
                <span className="text-sm font-medium text-slate-900 dark:text-white">Import from CSV</span>
              </div>
              <button onClick={closeMode} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"><X size={18} /></button>
            </div>
            <form onSubmit={handleCSVUpload} className="p-6 space-y-6">
              <p className="text-sm text-slate-500 font-normal">
                Your CSV file must include <code className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded font-mono text-xs">name</code> and{' '}
                <code className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded font-mono text-xs">email</code> columns.
                Any duplicate emails will be automatically skipped.
              </p>
              
              <div className="relative group">
                <input ref={fileInputRef} type="file" accept=".csv"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={e => setCsvFile(e.target.files?.[0] || null)} />
                <div className={`border-2 border-dashed rounded-[16px] p-10 text-center transition-colors ${
                  csvFile
                    ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/10'
                    : 'border-slate-200 dark:border-slate-700 group-hover:border-slate-400 bg-slate-50 dark:bg-slate-800/30'
                }`}>
                  <FileText className={`mx-auto mb-3 transition-colors ${csvFile ? 'text-emerald-500' : 'text-slate-400'}`} size={32} />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {csvFile ? csvFile.name : 'Click or drag a CSV file here'}
                  </p>
                  {csvFile && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-2">
                      Ready to import
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button type="submit" disabled={!csvFile || submitting}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-all shadow-sm disabled:opacity-50">
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <FileUp size={16} />}
                  {submitting ? 'Importing...' : 'Import Attendees'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* --- Attendees Table --- */}
        <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden min-h-[400px]">
          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="animate-spin mb-4 text-slate-300 dark:text-slate-600" size={32} />
              <p className="text-sm font-medium">Loading attendees...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-20 text-center animate-in fade-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-full flex items-center justify-center mx-auto mb-4">
                 <Users size={32} />
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-1">No attendees found</h3>
              <p className="text-sm font-normal text-slate-500 max-w-sm mx-auto">
                {searchTerm
                  ? 'No results match your search criteria.'
                  : 'Your guest list is currently empty. Import a CSV or add attendees manually to get started.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800/50">
                  <tr>
                    <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Attendee Name</th>
                    <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Email Address</th>
                    <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Registration Date</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {filtered.map(attendee => (
                    <tr key={attendee.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                        {attendee.name}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-2 font-normal">
                          <Mail size={14} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                          {attendee.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 font-normal">
                        <div className="flex items-center gap-2">
                          <CalendarDays size={14} className="text-slate-400" />
                          {new Date(attendee.created_at || Date.now()).toLocaleDateString(undefined, {
                            year: 'numeric', month: 'short', day: 'numeric',
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(attendee.id, attendee.name)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          title="Remove Attendee"
                        >
                          <Trash2 size={16} />
                        </button>
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