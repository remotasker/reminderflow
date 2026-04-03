'use client';

import Link from 'next/link';
import { Layout } from '@/components/Layout';
import { ChevronLeft, ExternalLink } from 'lucide-react';

export default function RoleBasedAccessPage() {
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
          <h1 className="text-3xl font-medium text-slate-900 dark:text-white tracking-tight">Role-Based Access Control</h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">Manage user permissions and access levels</p>
        </div>

        {/* Content */}
        <div className="prose dark:prose-invert max-w-none space-y-6">
          
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Understanding Roles</h2>
            <p className="text-slate-700 dark:text-slate-300">
              ReminderFlow uses role-based access control (RBAC) to manage permissions. Each user is assigned a role that determines what they can do.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Available Roles</h2>
            <div className="space-y-4">
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">👑 Owner</h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">Full control of the organization and all features</p>
                <ul className="text-sm space-y-1 text-slate-700 dark:text-slate-300">
                  <li>✓ Create and delete events</li>
                  <li>✓ Manage team members</li>
                  <li>✓ Access billing and settings</li>
                  <li>✓ Generate API keys</li>
                  <li>✓ View all analytics</li>
                </ul>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">🔧 Manager</h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">Can manage events and attendees</p>
                <ul className="text-sm space-y-1 text-slate-700 dark:text-slate-300">
                  <li>✓ Create and edit events</li>
                  <li>✓ Manage attendees</li>
                  <li>✓ Create email templates</li>
                  <li>✓ View analytics</li>
                  <li>✗ Cannot manage team or billing</li>
                </ul>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">👁️ Viewer</h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">Read-only access to view data</p>
                <ul className="text-sm space-y-1 text-slate-700 dark:text-slate-300">
                  <li>✓ View events</li>
                  <li>✓ View attendees</li>
                  <li>✓ View analytics</li>
                  <li>✗ Cannot create or modify anything</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Managing Team Members</h2>
            <ol className="list-decimal list-inside space-y-2 text-slate-700 dark:text-slate-300">
              <li>Go to Settings → Team Members</li>
              <li>Click "Invite Member"</li>
              <li>Enter the member's email</li>
              <li>Select their role</li>
              <li>Send the invitation</li>
            </ol>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Changing Member Roles</h2>
            <ol className="list-decimal list-inside space-y-2 text-slate-700 dark:text-slate-300">
              <li>Go to Settings → Team Members</li>
              <li>Find the team member</li>
              <li>Click the role dropdown</li>
              <li>Select a new role</li>
              <li>Confirm the change</li>
            </ol>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Removing Team Members</h2>
            <p className="text-slate-700 dark:text-slate-300">
              To remove a team member:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-slate-700 dark:text-slate-300">
              <li>Go to Settings → Team Members</li>
              <li>Find the member to remove</li>
              <li>Click the "Remove" button</li>
              <li>Confirm the removal</li>
            </ol>
          </section>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 p-4 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-300">
              <strong>Tip:</strong> Always ensure you have at least one Owner in your organization for security and account recovery purposes.
            </p>
          </div>

        </div>

      </div>
    </Layout>
  );
}
