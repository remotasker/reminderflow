'use client';

import Link from 'next/link';
import React from 'react';
import { Layout } from '@/components/Layout';
import { ChevronLeft } from 'lucide-react';

export default function RbacPage() {
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
          <h1 className="text-3xl font-medium text-slate-900 dark:text-white tracking-tight">Role-Based Access</h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">4 min read</p>
        </div>

        <div className="space-y-6 text-slate-700 dark:text-slate-300">
        
        <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Understanding Roles</h2>
          <p>
            ReminderFlow uses role-based access control (RBAC) to manage permissions for team members within your organization.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Available Roles</h2>
          
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Admin</h3>
              <p className="text-sm">Full access to all features and settings. Can manage other users and view billing information.</p>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Manager</h3>
              <p className="text-sm">Can create and manage events, attendees, and reminders. Can view analytics but cannot change organization settings.</p>
            </div>

            <div className="border-l-4 border-amber-500 pl-4">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Analyst</h3>
              <p className="text-sm">Read-only access to events, attendees, and analytics data. Cannot make changes.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Managing Team Members</h2>
          <ol className="list-decimal list-inside space-y-3 ml-4">
            <li>Go to Organization Settings → Team Members</li>
            <li>Click "Invite Team Member"</li>
            <li>Enter their email address</li>
            <li>Select their role</li>
            <li>Click "Send Invite"</li>
          </ol>
        </section>

        <section className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-8">
          <p className="font-medium text-slate-900 dark:text-white mb-2">💡 Best Practice</p>
          <p className="text-sm">
            Grant team members the minimum access level they need. This principle of least privilege helps maintain security.
          </p>
        </section>
        </div>
      </div>
    </Layout>
  );
}
