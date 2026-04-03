'use client';

import Link from 'next/link';
import React from 'react';
import { Layout } from '@/components/Layout';
import { ChevronLeft } from 'lucide-react';

export default function InitialSetupPage() {
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
          <h1 className="text-3xl font-medium text-slate-900 dark:text-white tracking-tight">Initial Setup Guide</h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">5 min read</p>
        </div>

        <div className="space-y-6 text-slate-700 dark:text-slate-300">
        
        <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Welcome to ReminderFlow</h2>
          <p>
            This guide will walk you through the initial setup of ReminderFlow. By the end, you'll have your first automated reminder workflow configured and ready to send emails to your attendees.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Step 1: Create Your Organization</h2>
          <p>
            When you sign up for ReminderFlow, you'll need to create an organization. This is your workspace where all events, attendees, and automations are stored.
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Choose a unique organization name</li>
            <li>Select your primary timezone (can be changed later)</li>
            <li>Invite team members if needed</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Step 2: Connect SendGrid</h2>
          <p>
            ReminderFlow uses SendGrid to send emails. You'll need to connect your SendGrid account to enable email sending.
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Go to Settings → Email Configuration</li>
            <li>Click "Connect SendGrid"</li>
            <li>Enter your SendGrid API key</li>
            <li>Click "Verify" to test the connection</li>
          </ul>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-3">
            Don't have a SendGrid account? <a href="https://sendgrid.com" className="text-blue-600 hover:underline">Sign up here</a> for free.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Step 3: Create Your First Event</h2>
          <p>
            Events are the core of ReminderFlow. An event represents a webinar, meeting, or any online gathering.
          </p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Click "Events" in the navigation</li>
            <li>Click "Create Event"</li>
            <li>Fill in event details:
              <ul className="list-disc list-inside space-y-1 ml-6 mt-2">
                <li>Event title</li>
                <li>Date and time</li>
                <li>Timezone</li>
                <li>Meeting link (optional)</li>
              </ul>
            </li>
            <li>Click "Create"</li>
          </ol>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Step 4: Add Attendees</h2>
          <p>
            Attendees are the people who will receive reminders about your event.
          </p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Go to your event details</li>
            <li>Click "Add Attendees"</li>
            <li>You can add attendees by:
              <ul className="list-disc list-inside space-y-1 ml-6 mt-2">
                <li>Uploading a CSV file</li>
                <li>Manually entering email addresses</li>
              </ul>
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Step 5: Set Up Reminders</h2>
          <p>
            Configure when reminders should be sent before your event.
          </p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Go to event settings</li>
            <li>Click "Configure Reminders"</li>
            <li>Select reminder times (e.g., 1 day before, 1 hour before)</li>
            <li>Choose or customize email template</li>
            <li>Click "Save"</li>
          </ol>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Step 6: Test & Launch</h2>
          <p>
            Before sending reminders to all attendees, send yourself a test email to verify everything looks correct.
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Click "Send Test Email"</li>
            <li>Review the email in your inbox</li>
            <li>Make adjustments if needed</li>
            <li>Click "Go Live" when ready</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">What's Next?</h2>
          <p>
            Now that you have your first event configured, you can:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Check event analytics to see open rates and click-through rates</li>
            <li>Create custom email templates</li>
            <li>Invite team members and configure access levels</li>
            <li>Set up API integrations for more advanced automation</li>
          </ul>
        </section>

        <section className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-8">
          <p className="font-medium text-slate-900 dark:text-white mb-2">💡 Pro Tip</p>
          <p className="text-sm">
            You can schedule multiple reminder emails for a single event. Most organizations send reminders 1 week, 1 day, and 1 hour before the event for best results.
          </p>
        </section>
        </div>
      </div>
    </Layout>
  );
}
