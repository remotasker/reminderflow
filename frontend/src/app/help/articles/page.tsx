'use client';

import React from 'react';
import Link from 'next/link';
import { Layout } from '@/components/Layout';
import { ArrowLeft, BookOpen } from 'lucide-react';

export default function HelpArticlesPage() {
  const articles = [
    {
      id: 'initial-setup',
      title: 'Initial Setup Guide',
      category: 'Getting Started',
      description: 'Foundational guide to setting up ReminderFlow for your organization.',
      href: '/help/articles/initial-setup'
    },
    {
      id: 'sendgrid-setup',
      title: 'Connecting SendGrid',
      category: 'Getting Started',
      description: 'Step-by-step instructions for integrating SendGrid email service.',
      href: '/help/articles/sendgrid-setup'
    },
    {
      id: 'dashboard-overview',
      title: 'Dashboard Overview',
      category: 'Getting Started',
      description: 'Learn how to navigate and use the ReminderFlow dashboard.',
      href: '/help/articles/dashboard-overview'
    },
    {
      id: 'api-keys',
      title: 'Managing API Keys',
      category: 'Security',
      description: 'How to create, rotate, and manage API keys for secure integrations.',
      href: '/help/articles/api-keys'
    },
    {
      id: 'rbac',
      title: 'Role-Based Access',
      category: 'Security',
      description: 'Understanding and configuring role-based access control for your team.',
      href: '/help/articles/rbac'
    },
    {
      id: 'webhook-security',
      title: 'Webhook Security',
      category: 'Security',
      description: 'Best practices for securing webhook integrations and validating payloads.',
      href: '/help/articles/webhook-security'
    },
    {
      id: 'csv-troubleshooting',
      title: 'CSV Troubleshooting',
      category: 'Attendees',
      description: 'Common issues and solutions when importing attendee data via CSV.',
      href: '/help/articles/csv-troubleshooting'
    },
    {
      id: 'bulk-upload',
      title: 'Bulk Upload Limits',
      category: 'Attendees',
      description: 'Understanding file size limits and how to handle large attendee imports.',
      href: '/help/articles/bulk-upload'
    },
    {
      id: 'custom-fields',
      title: 'Custom Fields',
      category: 'Attendees',
      description: 'Adding and managing custom fields for attendee data.',
      href: '/help/articles/custom-fields'
    },
  ];

  const groupedByCategory = articles.reduce((acc, article) => {
    if (!acc[article.category]) {
      acc[article.category] = [];
    }
    acc[article.category].push(article);
    return acc;
  }, {} as Record<string, typeof articles>);

  return (
    <Layout>
      <div className="max-w-4xl w-full mx-auto py-8 px-4 sm:px-6 md:px-8">
        
        {/* Back Button */}
        <Link href="/help" className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-8 transition-colors">
          <ArrowLeft size={16} />
          Back to Help Center
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Help Articles</h1>
          <p className="text-slate-600 dark:text-slate-400">Browse our complete documentation to find the answers you need.</p>
        </div>

        {/* Articles by Category */}
        <div className="space-y-8">
          {Object.entries(groupedByCategory).map(([category, items]) => (
            <div key={category}>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">{category}</h2>
              <div className="grid gap-4">
                {items.map((article) => (
                  <Link
                    key={article.id}
                    href={article.href}
                    className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <BookOpen size={20} className="text-slate-400 dark:text-slate-600 mt-0.5 group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-colors flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-medium text-slate-900 dark:text-white group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">{article.title}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{article.description}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
