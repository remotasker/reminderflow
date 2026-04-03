'use client';

import Link from 'next/link';
import React from 'react';
import { Layout } from '@/components/Layout';
import { ChevronLeft } from 'lucide-react';

export default function ApiKeysPage() {
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
          <h1 className="text-3xl font-medium text-slate-900 dark:text-white tracking-tight">API Keys</h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">6 min read</p>
        </div>

        <div className="space-y-6 text-slate-700 dark:text-slate-300">
        
        <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">What are API Keys?</h2>
          <p>
            API keys are secure credentials that allow external applications and services to interact with your ReminderFlow account programmatically. They enable automation beyond the web interface.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Creating an API Key</h2>
          <ol className="list-decimal list-inside space-y-3 ml-4">
            <li>
              Log in to ReminderFlow
            </li>
            <li>
              Click your profile → Organization Settings
            </li>
            <li>
              Go to "API & Integrations" → "API Keys"
            </li>
            <li>
              Click "Generate New Key"
            </li>
            <li>
              Enter a descriptive name (e.g., "Production API")
            </li>
            <li>
              Select permissions you want to grant
            </li>
            <li>
              Click "Create"
            </li>
            <li>
              <strong>Important:</strong> Copy the key immediately. You won't be able to view it again for security reasons.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">API Key Permissions</h2>
          <p>
            When creating an API key, you can choose specific permissions:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Events:</strong> Create, read, update, delete events</li>
            <li><strong>Attendees:</strong> Manage attendee lists and data</li>
            <li><strong>Email:</strong> Send emails and manage email templates</li>
            <li><strong>Analytics:</strong> Read event and email analytics</li>
            <li><strong>Settings:</strong> Modify organization settings</li>
          </ul>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-3">
            <strong>Best Practice:</strong> Only grant permissions that are strictly necessary for your use case (principle of least privilege).
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Using Your API Key</h2>
          <p>
            Include your API key in the Authorization header of HTTP requests:
          </p>
          <div className="bg-slate-100 dark:bg-slate-800 rounded p-4 font-mono text-sm overflow-x-auto my-4">
            <code>Authorization: Bearer YOUR_API_KEY</code>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Example using curl:
          </p>
          <div className="bg-slate-100 dark:bg-slate-800 rounded p-4 font-mono text-xs overflow-x-auto my-4">
            <code>{'curl -H "Authorization: Bearer YOUR_API_KEY" https://api.reminderflow.app/events'}</code>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Rotating API Keys</h2>
          <p>
            Periodically rotate your API keys to maintain security:
          </p>
          <ol className="list-decimal list-inside space-y-3 ml-4">
            <li>
              Create a new API key with the same permissions
            </li>
            <li>
              Update your applications to use the new key
            </li>
            <li>
              Test to ensure everything works
            </li>
            <li>
              Return to API Keys settings and delete the old key
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Security Best Practices</h2>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Never share your keys:</strong> Treat API keys like passwords</li>
            <li><strong>Use environment variables:</strong> Store keys in .env files, not in code</li>
            <li><strong>Rotate regularly:</strong> Change keys every 90 days</li>
            <li><strong>Use minimal permissions:</strong> Only enable what you need</li>
            <li><strong>Monitor usage:</strong> Check API logs for unusual activity</li>
            <li><strong>Revoke immediately:</strong> If you suspect a key is compromised, delete it right away</li>
          </ul>
        </section>

        <section className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mt-8">
          <p className="font-medium text-slate-900 dark:text-white mb-2">⚠️ Security Alert</p>
          <p className="text-sm">
            If you accidentally commit an API key to version control, regenerate it immediately. Keys exposed in public repositories are automatically revoked by our security system.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Need Help?</h2>
          <p>
            Check out our API documentation or contact support if you have questions about API key management.
          </p>
        </section>
        </div>
      </div>
    </Layout>
  );
}
