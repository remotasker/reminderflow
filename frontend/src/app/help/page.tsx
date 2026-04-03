'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Layout } from '@/components/Layout';
import { 
  Search, 
  BookOpen, 
  ShieldCheck, 
  Zap, 
  ChevronRight,
  Send,
  CheckCircle2,
  Globe,
  LifeBuoy
} from 'lucide-react';

export default function HelpCenterPage() {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inquiryType, setInquiryType] = useState('Technical Support');
  const [priority, setPriority] = useState('Standard (1-2 days)');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    {
      title: 'Getting Started',
      icon: <Zap size={20} className="text-amber-600 dark:text-amber-400" />,
      iconBg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/50',
      description: 'Foundational concepts for setting up your first automated reminder flow.',
      links: ['Initial Setup Guide', 'Connecting SendGrid', 'Dashboard Overview']
    },
    {
      title: 'Security',
      icon: <ShieldCheck size={20} className="text-blue-600 dark:text-blue-400" />,
      iconBg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/50',
      description: 'API protocols, JWT implementation, and multi-tenant data isolation.',
      links: ['Managing API Keys', 'Role-Based Access', 'Webhook Security']
    },
    {
      title: 'Attendees',
      icon: <BookOpen size={20} className="text-emerald-600 dark:text-emerald-400" />,
      iconBg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/50',
      description: 'Deep dive into bulk imports, CSV formatting, and automated tracking.',
      links: ['CSV Troubleshooting', 'Bulk Upload Limits', 'Custom Fields']
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset error
    setError('');
    
    // Validate form
    if (!message.trim()) {
      setError('Please provide a message');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inquiryType,
          priority,
          message: message.trim(),
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit support ticket');
      }
      
      setIsSubmitting(false);
      setFormSubmitted(true);
      // Reset form
      setMessage('');
      setInquiryType('Technical Support');
      setPriority('Standard (1-2 days)');
    } catch (err) {
      setIsSubmitting(false);
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl w-full mx-auto space-y-10 animate-in fade-in duration-500 pb-12 px-4 sm:px-6 md:px-8">
        
        {/* --- Header Section --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-medium text-slate-900 dark:text-white tracking-tight">Help Center</h1>
              <span className="inline-flex items-center justify-center px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md text-[10px] font-medium uppercase tracking-widest">
                v1.0.4
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-2 font-normal">Everything you need to set up and manage ReminderFlow.</p>
          </div>
          
          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-600 dark:group-focus-within:text-slate-300 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-full shadow-sm outline-none text-sm font-normal text-slate-700 dark:text-slate-200 focus:border-slate-400 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* --- Category Grid --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((cat, i) => (
            <Link key={i} href="/help/articles" className="bg-white dark:bg-slate-900 p-8 rounded-[20px] border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 group flex flex-col">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center border mb-6 group-hover:scale-110 transition-transform duration-300 ${cat.iconBg}`}>
                {cat.icon}
              </div>
              <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-2 tracking-tight">{cat.title}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-normal leading-relaxed mb-6 flex-1">
                {cat.description}
              </p>
              
              <div className="space-y-1.5 mt-auto pt-6 border-t border-slate-100 dark:border-slate-800/50">
                {cat.links.map((link, j) => {
                  const slug = link.toLowerCase().replace(/\s+/g, '-');
                  return (
                    <Link key={j} href={`/help/articles/${slug}`} className="flex items-center justify-between w-full p-2 -mx-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group/link">
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-400 group-hover/link:text-slate-900 dark:group-hover/link:text-slate-200 transition-colors">
                        {link}
                      </span>
                      <ChevronRight size={14} className="text-slate-300 dark:text-slate-600 group-hover/link:text-slate-500 transition-all group-hover/link:translate-x-1" />
                    </Link>
                  );
                })}
              </div>
            </Link>
          ))}
        </div>

        {/* --- Integrated Contact Section --- */}
        <div className="bg-white dark:bg-slate-900 rounded-[20px] overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row">
          
          {/* Left Info Column */}
          <div className="p-8 lg:p-10 lg:w-2/5 bg-slate-50/50 dark:bg-slate-800/20 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full mb-6 w-fit shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest">Support Request</span>
            </div>
            
            <h3 className="text-xl font-medium text-slate-900 dark:text-white tracking-tight mb-3">Still need help?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-normal leading-relaxed mb-10">
              Reach out to our engineering team for integration help, bug reports, or feature requests.
            </p>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm">
                  <Globe size={16} className="text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-0.5">Avg Response Time</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Under 4 hours</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm">
                  <LifeBuoy size={16} className="text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-0.5">System Status</p>
                  <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 size={14} /> All systems operational
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Form Column */}
          <div className="p-8 lg:p-10 lg:w-3/5">
            {formSubmitted ? (
              <div className="h-full flex flex-col items-center justify-center text-center animate-in zoom-in-95 py-12">
                <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-500 mb-6 border border-emerald-100 dark:border-emerald-800/50">
                  <CheckCircle2 size={32} />
                </div>
                <h4 className="text-xl font-medium text-slate-900 dark:text-white tracking-tight mb-2">Message Received</h4>
                <p className="text-sm text-slate-500 font-normal max-w-sm mx-auto mb-8">
                  Our technical support team will review your request and reply to your registered email address shortly.
                </p>
                <button 
                  onClick={() => setFormSubmitted(false)}
                  className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-sm font-medium rounded-full transition-colors"
                >
                  Submit another request
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-widest ml-1">Inquiry Type</label>
                    <select 
                      value={inquiryType}
                      onChange={(e) => setInquiryType(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-slate-400 transition-all appearance-none cursor-pointer">
                      <option>Technical Support</option>
                      <option>API & Integration</option>
                      <option>Feature Request</option>
                      <option>Billing Question</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-widest ml-1">Priority Level</label>
                    <select 
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-slate-400 transition-all appearance-none cursor-pointer">
                      <option>Standard (1-2 days)</option>
                      <option>Urgent (Under 4 hours)</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-widest ml-1">How can we help?</label>
                  <textarea 
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Please describe your issue in detail..."
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-normal text-slate-900 dark:text-white outline-none focus:border-slate-400 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none"
                  />
                </div>
                
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg text-sm text-red-700 dark:text-red-400">
                    {error}
                  </div>
                )}
                
                <div className="flex items-center justify-end pt-2">
                  <button 
                    disabled={isSubmitting}
                    className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full text-sm font-medium active:scale-95 transition-all disabled:opacity-70 disabled:active:scale-100 shadow-sm"
                  >
                    {isSubmitting ? 'Sending...' : (
                      <>
                        Send Message
                        <Send size={16} className="-mt-0.5 ml-1" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

      </div>
    </Layout>
  );
}