'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Layout } from '@/components/Layout';
import api from '@/lib/api';
import Papa from 'papaparse';
import { 
  UserPlus, 
  FileUp, 
  Trash2, 
  Users, 
  Mail, 
  X, 
  Calendar,
  AlertCircle,
  FileText
} from 'lucide-react';

interface Attendee {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export default function AttendeesPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [csvFile, setCsvFile] = useState<File | null>(null);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchAttendees();
  }, [eventId, router]);

  const fetchAttendees = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/attendees/${eventId}`);
      setAttendees(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load attendees');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddAttendee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/api/attendees/${eventId}`, formData);
      setFormData({ name: '', email: '' });
      setShowForm(false);
      fetchAttendees();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add attendee');
    }
  };

  const handleCSVUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) {
      setError('Please select a CSV file');
      return;
    }

    Papa.parse(csvFile, {
      header: true,
      complete: async (results: any) => {
        try {
          const attendeesData = results.data
            .filter((row: any) => row.name && row.email)
            .map((row: any) => ({
              name: row.name.trim(),
              email: row.email.trim(),
            }));

          if (attendeesData.length === 0) {
            setError('No valid attendee records found in CSV');
            return;
          }

          await api.post(`/api/attendees/${eventId}/bulk-upload`, {
            attendees: attendeesData,
          });

          setCsvFile(null);
          setShowForm(false);
          fetchAttendees();
          setError('');
        } catch (err: any) {
          setError(err.response?.data?.error || 'Failed to upload CSV');
        }
      },
      error: (error: any) => {
        setError(`CSV parsing error: ${error.message}`);
      },
    });
  };

  const handleDeleteAttendee = async (attendeeId: string) => {
    if (!confirm('Are you sure you want to remove this attendee?')) return;
    try {
      await api.delete(`/api/attendees/${attendeeId}`);
      fetchAttendees();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete attendee');
    }
  };

  if (!mounted) return null;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Attendees</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Manage your guest list and registrations</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg ${
              showForm 
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {showForm ? <X size={20} /> : <UserPlus size={20} />}
            {showForm ? 'Cancel' : 'Add Attendees'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 flex items-center gap-3 text-red-700 dark:text-red-400 rounded-r-xl">
            <AlertCircle size={20} />
            <p className="font-medium text-sm">{error}</p>
          </div>
        )}

        {/* Add Attendees Forms */}
        {showForm && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-top-4 duration-300">
            {/* Manual Form */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl">
              <div className="flex items-center gap-2 mb-6">
                <UserPlus className="text-blue-500" size={20} />
                <h2 className="text-xl font-black text-slate-800 dark:text-white">Single Entry</h2>
              </div>
              <form onSubmit={handleAddAttendee} className="space-y-4">
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                  value={formData.name}
                  onChange={handleFormChange}
                  required
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                  value={formData.email}
                  onChange={handleFormChange}
                  required
                />
                <button type="submit" className="w-full py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition-all">
                  Add Attendee
                </button>
              </form>
            </div>

            {/* CSV Upload */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl">
              <div className="flex items-center gap-2 mb-6">
                <FileUp className="text-emerald-500" size={20} />
                <h2 className="text-xl font-black text-slate-800 dark:text-white">Bulk Import</h2>
              </div>
              <form onSubmit={handleCSVUpload} className="space-y-4">
                <div className="relative group">
                  <input
                    type="file"
                    accept=".csv"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                    required
                  />
                  <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center group-hover:border-blue-500 transition-all">
                    <FileText className="mx-auto text-slate-400 mb-2" size={32} />
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                      {csvFile ? csvFile.name : 'Click or drag CSV file'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Columns: name, email</p>
                  </div>
                </div>
                <button type="submit" className="w-full py-3 bg-emerald-600 text-white font-black rounded-xl hover:bg-emerald-700 transition-all">
                  Upload CSV
                </button>
              </form>
            </div>
          </div>
        )}

        {/* List Section */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-blue-500" />
                <h2 className="font-black text-slate-800 dark:text-white">Attendee List</h2>
              </div>
              <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-black rounded-full">
                {attendees.length} Total
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] bg-slate-50/50 dark:bg-slate-800/50">
                    <th className="py-4 px-6">Attendee Name</th>
                    <th className="py-4 px-6">Email Address</th>
                    <th className="py-4 px-6">Date Added</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {attendees.map((attendee) => (
                    <tr key={attendee.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-700 dark:text-slate-200">{attendee.name}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                          <Mail size={14} />
                          {attendee.email}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                          <Calendar size={14} />
                          {new Date(attendee.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleDeleteAttendee(attendee.id)}
                          className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {attendees.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-20 text-center">
                        <Users size={40} className="mx-auto text-slate-200 dark:text-slate-700 mb-3" />
                        <p className="text-slate-400 font-medium">No attendees registered for this event yet.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}