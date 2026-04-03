'use client';

import Link from 'next/link';
import React from 'react';
import { Layout } from '@/components/Layout';
import { ChevronLeft } from 'lucide-react';

export default function DashboardOverviewPage() {
  return (
    <Layout>
      <div className="max-w-3xl w-full mx-auto space-y-8 animate-in fade-in duration-500 pb-12 px-4 sm:px-6 md:px-8">
        
        {/* Back Link */}
        <Link href="/help" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-300 transition-colors">
          <ChevronLeft size={16} />
          <span className="text-sm font-medium">Back to Help Center</span>
        </Link>

        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-3xl font-medium text-slate-900 dark:text-white tracking-tight">Dashboard Overview</h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">4 min read</p>
        </div>

        <div className="space-y-6 text-slate-700 dark:text-slate-300">
        
        <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Welcome to Your Dashboard</h2>
          <p>
            The ReminderFlow dashboard is your command center for managing events, sending reminders, and tracking engagement. This guide will help you get the most out of it.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Main Dashboard Sections</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">📊 Overview</h3>
              <p>
                At a glance, see metrics for your current month:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                <li>Total emails sent</li>
                <li>Open rate percentage</li>
                <li>Click-through rate</li>
                <li>Active events</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">📅 Events</h3>
              <p>
                View all your upcoming and past events. You can:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                <li>Create new events</li>
                <li>Edit event details</li>
                <li>View attendee lists</li>
                <li>Configure reminders</li>
                <li>Check analytics for each event</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">👥 Attendees</h3>
              <p>
                Manage your audience across all events:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                <li>Import attendee lists via CSV</li>
                <li>Add attendees manually</li>
                <li>View response data</li>
                <li>Export attendee information</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">📈 Analytics</h3>
              <p>
                Deep dive into your email performance:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                <li>Email open rates</li>
                <li>Click tracking data</li>
                <li>Attendance conversion</li>
                <li>Engagement trends</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Navigation Tips</h2>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Use the sidebar to quickly navigate between main sections</li>
            <li>Click your profile icon (top right) to access settings</li>
            <li>Use search functionality to find specific events</li>
            <li>Filter by date range to focus on specific timeframes</li>
          </ul>
        </section>
        </div>
      </div>
    </Layout>
  );
}
