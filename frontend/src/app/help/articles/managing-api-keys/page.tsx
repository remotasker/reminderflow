'use client';

import Link from 'next/link';
import { Layout } from '@/components/Layout';
import { ChevronLeft, ExternalLink } from 'lucide-react';

export default function ManagingAPIKeysPage() {
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
          <h1 className="text-3xl font-medium text-slate-900 dark:text-white tracking-tight">Managing API Keys</h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">Secure access to the ReminderFlow API</p>
        </div>

        {/* Content */}
        <div className="prose dark:prose-invert max-w-none space-y-6">
          
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">What are API Keys?</h2>
            <p className="text-slate-700 dark:text-slate-300">
              API keys are secure tokens that allow programmatic access to ReminderFlow. They're used for:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300">
              <li>Integrating ReminderFlow with external applications</li>
              <li>Automating event and attendee management</li>
              <li>Building custom workflows</li>
              <li>CLI tool access</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Creating API Keys</h2>
            <ol className="list-decimal list-inside space-y-2 text-slate-700 dark:text-slate-300">
              <li>Go to Settings → API Keys</li>
              <li>Click "Generate New Key"</li>
              <li>Give the key a descriptive name</li>
              <li>Select the required scopes (permissions)</li>
              <li>Save and store the key securely</li>
            </ol>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">API Key Scopes</h2>
            <div className="space-y-2">
              <p className="text-slate-700 dark:text-slate-300">Scopes determine what actions an API key can perform:</p>
              <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded font-mono text-sm text-slate-700 dark:text-slate-300 overflow-x-auto">
                <div>read:events - Read event data</div>
                <div>write:events - Create and modify events</div>
                <div>read:attendees - Read attendee data</div>
                <div>write:attendees - Create and modify attendees</div>
                <div>read:analytics - Read analytics data</div>
                <div>send:emails - Manually trigger emails</div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Using API Keys</h2>
            <p className="text-slate-700 dark:text-slate-300">
              Include your API key in the Authorization header of API requests:
            </p>
            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded font-mono text-sm text-slate-700 dark:text-slate-300 overflow-x-auto">
              Authorization: Bearer your_api_key_here
            </div>
          </section>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 p-4 rounded-lg">
            <p className="text-sm text-red-900 dark:text-red-300">
              <strong>Security Warning:</strong> Never share your API keys. Treat them like passwords. If compromised, regenerate immediately.
            </p>
          </div>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Rotating API Keys</h2>
            <p className="text-slate-700 dark:text-slate-300">
              To rotate an API key:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-slate-700 dark:text-slate-300">
              <li>Create a new API key with the same scopes</li>
              <li>Update your applications to use the new key</li>
              <li>Verify everything works correctly</li>
              <li>Delete the old key</li>
            </ol>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Monitoring API Usage</h2>
            <p className="text-slate-700 dark:text-slate-300">
              Each API key shows:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300">
              <li>Last used timestamp</li>
              <li>Total API requests made</li>
              <li>Creation date</li>
              <li>Associated scopes</li>
            </ul>
          </section>

        </div>

      </div>
    </Layout>
  );
}
