'use client';

import Link from 'next/link';
import { Layout } from '@/components/Layout';
import { ChevronLeft, ExternalLink } from 'lucide-react';

export default function BulkUploadLimitsPage() {
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
          <h1 className="text-3xl font-medium text-slate-900 dark:text-white tracking-tight">Bulk Upload Limits</h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">Understanding file size and record limits for bulk uploads</p>
        </div>

        {/* Content */}
        <div className="prose dark:prose-invert max-w-none space-y-6">
          
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Upload Size Limits</h2>
            <div className="space-y-3">
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                <p className="font-semibold text-slate-900 dark:text-white">Maximum file size: 10 MB</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Files larger than 10MB must be split and uploaded separately</p>
              </div>
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                <p className="font-semibold text-slate-900 dark:text-white">Maximum records per file: 50,000</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Files with more than 50,000 rows should be split</p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Supported File Formats</h2>
            <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300">
              <li><code>*.csv</code> - Comma-separated values (recommended)</li>
              <li><code>*.xlsx</code> - Microsoft Excel (first sheet only)</li>
              <li><code>*.xls</code> - Microsoft Excel 97-2003</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Rate Limits</h2>
            <p className="text-slate-700 dark:text-slate-300">
              To ensure system stability:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300">
              <li>Maximum 10 uploads per hour</li>
              <li>Maximum 100,000 attendees per event</li>
              <li>Uploads are queued and processed sequentially</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Splitting Large Files</h2>
            <p className="text-slate-700 dark:text-slate-300">
              If your file exceeds limits:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-slate-700 dark:text-slate-300">
              <li>Open your file in Excel or Google Sheets</li>
              <li>Split into multiple files (e.g., attendees-1.csv, attendees-2.csv)</li>
              <li>Upload each file separately</li>
              <li>All attendees will be added to the same event</li>
            </ol>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Upload Performance Tips</h2>
            <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300">
              <li>Remove unnecessary columns to reduce file size</li>
              <li>Use clean, consistent formatting</li>
              <li>Validate email addresses before uploading</li>
              <li>Remove duplicate entries</li>
              <li>Use UTF-8 encoding for special characters</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Monitoring Upload Status</h2>
            <p className="text-slate-700 dark:text-slate-300">
              After uploading, you can monitor the upload status:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300">
              <li>View import progress in Attendees → Imports</li>
              <li>See success and error counts</li>
              <li>Download error reports for failed rows</li>
              <li>Retry failed imports</li>
            </ul>
          </section>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 p-4 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-300">
              <strong>Tip:</strong> For very large uploads (&gt;100k attendees), contact support for custom solutions.
            </p>
          </div>

        </div>

      </div>
    </Layout>
  );
}
