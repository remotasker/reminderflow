'use client';

import Link from 'next/link';
import React from 'react';
import { Layout } from '@/components/Layout';
import { ChevronLeft } from 'lucide-react';

export default function WebhookSecurityPage() {
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
          <h1 className="text-3xl font-medium text-slate-900 dark:text-white tracking-tight">Webhook Security</h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">5 min read</p>
        </div>

        <div className="space-y-6 text-slate-700 dark:text-slate-300">
        
        <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">What are Webhooks?</h2>
          <p>
            Webhooks are HTTP callbacks that allow ReminderFlow to send real-time data to your application when events occur (like emails being sent or opened).
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Webhook Security Best Practices</h2>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Verify signatures:</strong> Always validate webhook signatures to ensure requests come from ReminderFlow</li>
            <li><strong>Use HTTPS:</strong> Webhook URLs must use HTTPS for encryption in transit</li>
            <li><strong>Validate payloads:</strong> Check that required fields exist before processing</li>
            <li><strong>Implement retries:</strong> Handle failed webhook deliveries gracefully</li>
            <li><strong>Rate limiting:</strong> Implement request rate limiting on your endpoint</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Verifying Webhook Signatures</h2>
          <p>
            Every webhook request includes an X-ReminderFlow-Signature header. Verify this signature by:
          </p>
          <ol className="list-decimal list-inside space-y-3 ml-4">
            <li>Get the raw webhook body</li>
            <li>Get the timestamp from the request header</li>
            <li>Compute HMAC-SHA256 of the body using your webhook secret</li>
            <li>Compare the computed signature with the one in the header</li>
          </ol>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Setting Up Webhooks</h2>
          <ol className="list-decimal list-inside space-y-3 ml-4">
            <li>Go to Organization Settings → Webhooks</li>
            <li>Click "Add Webhook"</li>
            <li>Enter your webhook URL (must be HTTPS)</li>
            <li>Select which events to subscribe to</li>
            <li>Copy your webhook secret and store it safely</li>
            <li>Click "Create"</li>
          </ol>
        </section>

        <section className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mt-8">
          <p className="font-medium text-slate-900 dark:text-white mb-2">⚠️ Security Alert</p>
          <p className="text-sm">
            Never expose your webhook secret in client-side code. Store it securely on your server-side environment variables.
          </p>
        </section>
        </div>
      </div>
    </Layout>
  );
}
