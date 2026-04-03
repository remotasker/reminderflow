'use client';

import Link from 'next/link';
import { Layout } from '@/components/Layout';
import { ChevronLeft, ExternalLink } from 'lucide-react';

export default function ConnectingSendGridPage() {
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
          <h1 className="text-3xl font-medium text-slate-900 dark:text-white tracking-tight">Connecting SendGrid</h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">Set up SendGrid for email delivery</p>
        </div>

        {/* Content */}
        <div className="prose dark:prose-invert max-w-none space-y-6">
          
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">What is SendGrid?</h2>
            <p className="text-slate-700 dark:text-slate-300">
              SendGrid is a cloud-based email delivery platform that powers ReminderFlow's email capabilities. It ensures your reminder emails are delivered reliably and tracks engagement metrics.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Step 1: Create a SendGrid Account</h2>
            <ol className="list-decimal list-inside space-y-2 text-slate-700 dark:text-slate-300">
              <li>Visit <a href="https://sendgrid.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">sendgrid.com</a></li>
              <li>Click "Create Account"</li>
              <li>Fill in your details and verify your email</li>
              <li>Complete the account setup process</li>
            </ol>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Step 2: Generate an API Key</h2>
            <ol className="list-decimal list-inside space-y-2 text-slate-700 dark:text-slate-300">
              <li>Log in to your SendGrid account</li>
              <li>Navigate to Settings → API Keys</li>
              <li>Click "Create API Key"</li>
              <li>Give it a name (e.g., "ReminderFlow")</li>
              <li>Select "Restricted Access" and grant email sending permissions</li>
              <li>Copy the generated API key (you won't see it again!)</li>
            </ol>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Step 3: Add API Key to ReminderFlow</h2>
            <ol className="list-decimal list-inside space-y-2 text-slate-700 dark:text-slate-300">
              <li>Go to ReminderFlow Dashboard</li>
              <li>Navigate to Settings → Email Configuration</li>
              <li>Paste your SendGrid API key</li>
              <li>Click "Test Connection" to verify</li>
              <li>Save your settings</li>
            </ol>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Step 4: Verify Your Sender Email (Optional but Recommended)</h2>
            <p className="text-slate-700 dark:text-slate-300">
              To maximize deliverability, verify the email address your reminders will be sent from:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-slate-700 dark:text-slate-300">
              <li>In SendGrid, go to Settings → Sender Authentication</li>
              <li>Click "Verify a Single Sender"</li>
              <li>Fill in your sender details</li>
              <li>Confirm the verification email</li>
            </ol>
          </section>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 p-4 rounded-lg">
            <p className="text-sm text-amber-900 dark:text-amber-300">
              <strong>Important:</strong> Keep your API key secure. Never share it or commit it to version control. Use environment variables for storage.
            </p>
          </div>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Troubleshooting</h2>
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Q: Emails aren't being sent</h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">Check that your SendGrid account is active and your API key is in the correct environment variable.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Q: "Invalid API Key" error</h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">Verify you copied the entire API key correctly. Note that SendGrid shows it only once.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Q: Low email deliverability</h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">Verify your sender email, set up domain authentication, and ensure your attendee list is clean and opted in.</p>
              </div>
            </div>
          </section>

        </div>

        {/* Next Steps */}
        <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-6 rounded-lg space-y-3">
          <h3 className="font-semibold text-slate-900 dark:text-white">Next Steps</h3>
          <Link href="/help/articles/initial-setup-guide" className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium text-slate-900 dark:text-white">
            Back to Initial Setup Guide
            <ExternalLink size={14} />
          </Link>
        </div>

      </div>
    </Layout>
  );
}
