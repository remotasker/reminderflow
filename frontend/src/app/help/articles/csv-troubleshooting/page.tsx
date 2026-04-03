'use client';

import Link from 'next/link';
import React from 'react';
import { Layout } from '@/components/Layout';
import { ChevronLeft } from 'lucide-react';

export default function CSVTroubleshootingPage() {
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
          <h1 className="text-3xl font-medium text-slate-900 dark:text-white tracking-tight">CSV Troubleshooting</h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">6 min read</p>
        </div>

        <div className="space-y-6 text-slate-700 dark:text-slate-300">
        
        <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">CSV Import Overview</h2>
          <p>
            CSV (Comma-Separated Values) files are the fastest way to import large lists of attendees into ReminderFlow. This guide covers common issues and how to resolve them.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">CSV File Format Requirements</h2>
          <p>Your CSV file must include these columns:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>email</strong> (required): Valid email address</li>
            <li><strong>name</strong> (required): Attendee full name</li>
            <li><strong>phone</strong> (optional): Phone number</li>
            <li><strong>company</strong> (optional): Organization name</li>
            <li><strong>title</strong> (optional): Job title</li>
          </ul>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-3">
            Example CSV structure:
          </p>
          <div className="bg-slate-100 dark:bg-slate-800 rounded p-4 font-mono text-xs overflow-x-auto my-4">
            <code>{`email,name,phone,company,title
john@example.com,John Doe,555-0100,Acme Corp,Manager
jane@example.com,Jane Smith,555-0101,Tech Inc,Director`}</code>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Common Import Issues</h2>
          
          <div className="space-y-5">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">❌ "Invalid CSV Format" Error</h3>
              <p><strong>Cause:</strong> Missing required columns or incorrect formatting</p>
              <p><strong>Solution:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                <li>Verify your CSV has "email" and "name" columns</li>
                <li>Check that column headers are lowercase</li>
                <li>Ensure the file is saved as .csv format (not Excel .xlsx)</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">❌ "Invalid Email Address" Error</h3>
              <p><strong>Cause:</strong> One or more rows contain invalid email addresses</p>
              <p><strong>Solution:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                <li>Check for typos in email addresses</li>
                <li>Ensure emails have @ symbol and domain</li>
                <li>Remove any spaces before or after email addresses</li>
                <li>Use Excel's Find & Replace to fix common errors</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">❌ "Duplicate Email Detected" Error</h3>
              <p><strong>Cause:</strong> The same email appears twice in your CSV or already exists in the event</p>
              <p><strong>Solution:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                <li>Use Excel's Data → Remove Duplicates feature</li>
                <li>Sort by email and check for duplicates manually</li>
                <li>Check if attendees are already added to the event</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">❌ "File Too Large" Error</h3>
              <p><strong>Cause:</strong> CSV file exceeds size limits</p>
              <p><strong>Solution:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                <li>Split large files (max 10,000 attendees per file)</li>
                <li>Import in batches</li>
                <li>Remove unnecessary columns</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">❌ "Encoding Error" Error</h3>
              <p><strong>Cause:</strong> CSV file is not UTF-8 encoded (often occurs with non-English characters)</p>
              <p><strong>Solution:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                <li>Open CSV in Notepad or a text editor</li>
                <li>Go to File → Save As</li>
                <li>Change encoding to UTF-8</li>
                <li>Save and try importing again</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Tips for Clean Data</h2>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Remove leading/trailing spaces:</strong> Use Excel's TRIM function</li>
            <li><strong>Standardize names:</strong> Use PROPER function to capitalize properly</li>
            <li><strong>Text to lowercase:</strong> Use LOWER function for consistency</li>
            <li><strong>Remove special characters:</strong> Replace unusual characters</li>
            <li><strong>Validate emails:</strong> Use data validation before exporting</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Excel Preparation Guide</h2>
          <ol className="list-decimal list-inside space-y-3 ml-4">
            <li>
              Open your attendee list in Excel
            </li>
            <li>
              Ensure columns are named: email, name, phone, company, title
            </li>
            <li>
              Use Data → Remove Duplicates to clean your list
            </li>
            <li>
              Apply conditional formatting to find invalid emails
            </li>
            <li>
              Save As → CSV (Comma delimited) with UTF-8 encoding
            </li>
            <li>
              Upload to ReminderFlow
            </li>
          </ol>
        </section>

        <section className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-8">
          <p className="font-medium text-slate-900 dark:text-white mb-2">💡 Pro Tip</p>
          <p className="text-sm">
            Test with a small CSV file (5-10 attendees) first to verify your format is correct before importing thousands of records.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Verifying Imported Attendees</h2>
          <p>
            After successful import:
          </p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Go to your event's Attendees tab</li>
            <li>Verify the count matches your expected number</li>
            <li>Check a few random attendees to ensure data is correct</li>
            <li>Look for any data that got cut off or corrupted</li>
          </ol>
        </section>

        <section className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mt-8">
          <p className="font-medium text-slate-900 dark:text-white mb-2">✅ Ready to Go!</p>
          <p className="text-sm">
            Once attendees are imported, you can set up reminders and start sending emails automatically.
          </p>
        </section>
        </div>
      </div>
    </Layout>
  );
}
