'use client';

import Link from 'next/link';
import React from 'react';
import { Layout } from '@/components/Layout';
import { ChevronLeft } from 'lucide-react';

export default function SendgridSetupPage() {
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
          <h1 className="text-3xl font-medium text-slate-900 dark:text-white tracking-tight">SendGrid Setup</h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">5 min read</p>
        </div>

        <div className="space-y-6 text-slate-700 dark:text-slate-300">
        
        <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">What is SendGrid?</h2>
          <p>
            SendGrid is an email delivery platform that ensures your reminder emails reach attendees' inboxes reliably. ReminderFlow uses SendGrid to handle all email sending, to ensure high deliverability and professional email infrastructure.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Prerequisites</h2>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>A SendGrid account (free tier available at sendgrid.com)</li>
            <li>Admin access to your ReminderFlow organization</li>
            <li>A verified sender email address in SendGrid</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Step 1: Create a SendGrid API Key</h2>
          <ol className="list-decimal list-inside space-y-3 ml-4">
            <li>
              Log in to your <a href="https://app.sendgrid.com" className="text-blue-600 hover:underline">SendGrid account</a>
            </li>
            <li>
              Navigate to Settings → API Keys
            </li>
            <li>
              Click "Create API Key"
            </li>
            <li>
              Give it a name like "ReminderFlow"
            </li>
            <li>
              Select "Full Access" or at minimum "Mail Send" permission
            </li>
            <li>
              Click "Create & View"
            </li>
            <li>
              Copy the API key displayed (you won't be able to see it again)
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Step 2: Verify a Sender Email</h2>
          <p>
            Before SendGrid can send emails on your behalf, you must verify a sender email address.
          </p>
          <ol className="list-decimal list-inside space-y-3 ml-4">
            <li>
              In SendGrid, go to Settings → Sender Authentication
            </li>
            <li>
              Click "Verify a Single Sender"
            </li>
            <li>
              Fill in:
              <ul className="list-disc list-inside space-y-1 ml-6 mt-2">
                <li>From Email: The email address reminders will come from</li>
                <li>From Name: Your organization name</li>
                <li>Reply To: Support email address (optional)</li>
              </ul>
            </li>
            <li>
              Click "Create"
            </li>
            <li>
              Check your email and click the verification link
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Step 3: Connect SendGrid to ReminderFlow</h2>
          <ol className="list-decimal list-inside space-y-3 ml-4">
            <li>
              In ReminderFlow, click your profile → Organization Settings
            </li>
            <li>
              Go to "Email Configuration"
            </li>
            <li>
              Click "Connect SendGrid"
            </li>
            <li>
              Paste your SendGrid API key
            </li>
            <li>
              Enter your verified sender email
            </li>
            <li>
              Click "Test Connection" to verify it works
            </li>
            <li>
              Click "Save Configuration"
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Troubleshooting</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">❌ "Invalid API Key" Error</h3>
              <p>
                Make sure you copied the entire API key correctly from SendGrid. Keys are long alphanumeric strings. If you're unsure, generate a new one in SendGrid.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">❌ "Sender Email Not Verified" Error</h3>
              <p>
                The email address you're using must be verified in SendGrid first. Check your email for a verification link from SendGrid and click it.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">❌ Emails Going to Spam</h3>
              <p>
                If reminders end up in spam folders:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                <li>Verify your sender email in SendGrid</li>
                <li>Enable DKIM and SPF authentication in SendGrid</li>
                <li>Use a professional sender email (not no-reply@domain)</li>
                <li>Check for spam words in your email templates</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mt-8">
          <p className="font-medium text-slate-900 dark:text-white mb-2">✅ Success!</p>
          <p className="text-sm">
            Once connected, you can send test emails from your event settings to verify everything is working correctly.
          </p>
        </section>
        </div>
      </div>
    </Layout>
  );
}
