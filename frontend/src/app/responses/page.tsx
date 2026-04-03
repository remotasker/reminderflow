'use client';

import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import api from '@/lib/api';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MessageSquare, Search, Download, Loader2, TableProperties, Inbox, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ResponsesPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [attendees, setAttendees] = useState<any[]>([]);
  const [formSchema, setFormSchema] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get('/api/events');
        setEvents(res.data || []);
        if (res.data?.length > 0) setSelectedEventId(res.data[0].id);
      } catch (err) { toast.error('Failed to load events'); } 
      finally { setLoading(false); }
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    if (!selectedEventId) return;
    const fetchResponses = async () => {
      setLoadingResponses(true);
      try {
        const attRes = await api.get(`/api/attendees/${selectedEventId}`);
        setAttendees(attRes.data || []);
        const event = events.find(e => e.id === selectedEventId);
        let schema = event?.form_schema;
        if (typeof schema === 'string') { try { schema = JSON.parse(schema); } catch (e) { schema = []; } }
        setFormSchema(Array.isArray(schema) ? schema.filter((f: any) => !f.locked) : []);
      } catch (err) { toast.error('Failed to load responses'); } 
      finally { setLoadingResponses(false); }
    };
    fetchResponses();
  }, [selectedEventId, events]);

  const filteredAttendees = attendees.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()) || a.email.toLowerCase().includes(searchTerm.toLowerCase()));

  // Formatter for array answers
  const formatAnswer = (field: any, rawAnswer: any) => {
    if (field.type === 'checkbox') return rawAnswer ? 'Yes' : 'No';
    if (field.type === 'checkbox_group' && Array.isArray(rawAnswer)) return rawAnswer.join(', ');
    return rawAnswer || '-';
  };

  const handleExportCSV = () => {
    if (filteredAttendees.length === 0) {
      toast.error('No data to export');
      return;
    }
    const exportData = filteredAttendees.map(a => {
      const row: any = { Name: a.name, Email: a.email, 'Registration Date': new Date(a.created_at).toLocaleDateString() };
      const parsed = typeof a.responses === 'string' ? JSON.parse(a.responses || '{}') : (a.responses || {});
      formSchema.forEach(f => { row[f.label] = formatAnswer(f, parsed[f.id]); });
      return row;
    });
    const blob = new Blob([Papa.unparse(exportData)], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${(events.find(e => e.id === selectedEventId)?.title || 'Event').replace(/\s+/g, '_')}_Responses.csv`;
    link.click();
    toast.success('CSV Exported Successfully');
  };

  const handleExportPDF = () => {
    if (filteredAttendees.length === 0) {
      toast.error('No data to export');
      return;
    }
    const eventName = events.find(e => e.id === selectedEventId)?.title || 'Event Responses';
    const doc = new jsPDF('landscape');
    
    // Updated PDF Styling to match monochromatic SaaS theme
    doc.setFillColor(15, 23, 42); // Slate 900
    doc.roundedRect(14, 12, 10, 10, 2, 2, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.text("RF", 16, 19);
    doc.setTextColor(15, 23, 42); doc.setFontSize(16); doc.text("ReminderFlow", 28, 19.5);
    doc.setFontSize(12); doc.text(eventName, 14, 32);
    doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(100); doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 38);

    const head = [['Attendee Name', ...formSchema.map(f => f.label)]];
    const body = filteredAttendees.map(a => {
      const parsed = typeof a.responses === 'string' ? JSON.parse(a.responses || '{}') : (a.responses || {});
      return [a.name, ...formSchema.map(f => formatAnswer(f, parsed[f.id]))];
    });

    autoTable(doc, { 
      head, 
      body, 
      startY: 44, 
      styles: { fontSize: 9, cellPadding: 4 }, 
      headStyles: { fillColor: [15, 23, 42], textColor: 255 }, // Monochromatic Slate Header
      alternateRowStyles: { fillColor: [248, 250, 252] }, 
      margin: { top: 44, left: 14, right: 14 } 
    });
    
    doc.save(`${eventName.replace(/\s+/g, '_')}_Responses.pdf`);
    toast.success('PDF Exported Successfully');
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center p-20">
          <Loader2 className="animate-spin text-slate-300 dark:text-slate-600" size={32} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl w-full mx-auto space-y-6 animate-in fade-in duration-500 pb-12 px-4 sm:px-6 md:px-8 mt-2">
        
        {/* --- Header --- */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl border border-purple-100/50 dark:border-purple-800/50 shadow-sm">
            <MessageSquare size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-medium text-slate-900 dark:text-white tracking-tight">Form Responses</h1>
            <p className="text-sm text-slate-500 font-normal mt-1">View and export custom answers.</p>
          </div>
        </div>

        {/* --- Toolbar --- */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-[20px] border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-center">
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto flex-1">
            <select 
              value={selectedEventId} 
              onChange={e => setSelectedEventId(e.target.value)} 
              className="w-full sm:w-72 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-slate-400 transition-all cursor-pointer appearance-none"
            >
              {events.map(event => <option key={event.id} value={event.id}>{event.title}</option>)}
            </select>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search attendee..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-normal text-slate-900 dark:text-white outline-none focus:border-slate-400 transition-all placeholder:text-slate-400" 
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <button 
              onClick={handleExportCSV} 
              disabled={filteredAttendees.length === 0} 
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl transition-all shadow-sm disabled:opacity-50"
            >
              <Download size={16} /> CSV
            </button>
            <button 
              onClick={handleExportPDF} 
              disabled={filteredAttendees.length === 0} 
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:active:scale-100"
            >
              <FileText size={16} /> PDF
            </button>
          </div>
        </div>

        {/* --- Table --- */}
        <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden min-h-[400px]">
          {loadingResponses ? (
            <div className="p-20 flex flex-col items-center">
              <Loader2 className="animate-spin mb-4 text-slate-300 dark:text-slate-600" size={32} />
              <p className="text-sm font-medium text-slate-500">Loading responses...</p>
            </div>
          ) : filteredAttendees.length === 0 ? (
            <div className="p-20 text-center animate-in fade-in zoom-in-95 duration-300">
              <Inbox size={48} className="mx-auto text-slate-200 dark:text-slate-800 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No responses yet</h3>
              <p className="text-sm text-slate-500 font-normal">There are no form submissions for this event.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
                <thead className="bg-slate-50/50 dark:bg-slate-800/30 text-xs uppercase font-medium text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/50 tracking-wider">
                  <tr>
                    <th className="px-6 py-4 sticky left-0 bg-slate-50/50 dark:bg-slate-800/80 z-10">Attendee</th>
                    <th className="px-6 py-4">Date Registered</th>
                    {formSchema.map(field => (
                      <th key={field.id} className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                          <TableProperties size={14} />{field.label}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {filteredAttendees.map(attendee => {
                    let answers: Record<string, any> = {};
                    try { answers = typeof attendee.responses === 'string' ? JSON.parse(attendee.responses) : (attendee.responses || {}); } catch (e) { }
                    return (
                      <tr key={attendee.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                        <td className="px-6 py-4 sticky left-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50/50 dark:group-hover:bg-slate-800/30 transition-colors z-10 border-r border-transparent dark:border-slate-800/50">
                          <p className="font-medium text-slate-900 dark:text-slate-100">{attendee.name}</p>
                          <p className="text-xs text-slate-500 font-normal">{attendee.email}</p>
                        </td>
                        <td className="px-6 py-4 text-sm font-normal text-slate-500">
                          {new Date(attendee.created_at).toLocaleDateString()}
                        </td>
                        {formSchema.map(field => (
                          <td key={field.id} className="px-6 py-4 text-slate-700 dark:text-slate-300 font-normal truncate max-w-xs" title={formatAnswer(field, answers[field.id])}>
                            {formatAnswer(field, answers[field.id])}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}