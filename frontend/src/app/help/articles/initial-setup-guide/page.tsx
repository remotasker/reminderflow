'use client';

import Link from 'next/link';
import { Layout } from '@/components/Layout';
import { ChevronLeft, ExternalLink } from 'lucide-react';

export default function InitialSetupGuidePage() {
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
          <p className="text-lg text-slate-600 dark:text-slate-400">Get started with ReminderFlow in minutes</p>
        </div>

        {/* Content */}
        <div className="prose dark:prose-invert max-w-none space-y-6">
          
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">1. Create Your Organization</h2>
            <p className="text-slate-700 dark:text-slate-300">
              When you first sign up, you'll create an organization. This is your workspace where you'll manage all events, attendees, and reminder campaigns.
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300">
              <li>Choose a unique organization slug</li>
              <li>Set your organization name</li>
              <li>Configure your branding colors (optional)</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">2. Connect SendGrid</h2>
            <p className="text-slate-700 dark:text-slate-300">
              ReminderFlow uses SendGrid to send emails. You'll need a SendGrid API key to get started.
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 p-4 rounded-lg">
              <p className="text-sm text-blue-900 dark:text-blue-300">
                <strong>Tip:</strong> Visit your SendGrid account settings to generate an API key. Store it securely.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">3. Create Your First Event</h2>
            <p className="text-slate-700 dark:text-slate-300">
              Navigate to the Events section and create a new event by providing:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300">
              <li>Event title and description</li>
              <li>Date and time</li>
              <li>Timezone (important for accurate scheduling)</li>
              <li>Meeting link (if applicable)</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">4. Add Attendees</h2>
            <p className="text-slate-700 dark:text-slate-300">
              You can add attendees by:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300">
              <li>Manually adding individual attendees</li>
              <li>Uploading a CSV file with attendee information</li>
              <li>Importing from integrations</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">5. Configure Reminders</h2>
            <p className="text-slate-700 dark:text-slate-300">
              Set up when your attendees should receive reminder emails:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300">
              <li>24 hours before the event</li>
              <li>1 hour before the event</li>
              <li>Custom intervals</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">6. Customize Email Templates</h2>
            <p className="text-slate-700 dark:text-slate-300">
              Create personalized email templates with your branding. You can use template variables like:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300">
              <li>@attendee_name@ - recipient's name</li>
              <li>@event_title@ - event name</li>
              <li>@event_date@ - formatted event date</li>
              <li>@meeting_link@ - the event meeting link</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">7. Launch Your Campaign</h2>
            <p className="text-slate-700 dark:text-slate-300">
              Once everything is configured, activate your event. ReminderFlow will automatically send reminders at the scheduled times.
            </p>
          </section>

        </div>

        {/* Next Steps */}
        <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-6 rounded-lg space-y-3">
          <h3 className="font-semibold text-slate-900 dark:text-white">Next Steps</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Check out our other guides to learn about advanced features like integrations, analytics, and more.
          </p>
          <div className="flex gap-3 flex-wrap">
            <Link href="/help/articles/connecting-sendgrid" className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium text-slate-900 dark:text-white">
              Connecting SendGrid
              <ExternalLink size={14} />
            </Link>
            <Link href="/help/articles/dashboard-overview" className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium text-slate-900 dark:text-white">
              Dashboard Overview
              <ExternalLink size={14} />
            </Link>
          </div>
        </div>

      </div>
    </Layout>
  );
}
