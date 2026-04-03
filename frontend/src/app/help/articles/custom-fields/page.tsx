'use client';

import Link from 'next/link';
import { Layout } from '@/components/Layout';
import { ChevronLeft, ExternalLink } from 'lucide-react';

export default function CustomFieldsPage() {
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
          <h1 className="text-3xl font-medium text-slate-900 dark:text-white tracking-tight">Custom Fields</h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">Extend attendee data with custom fields</p>
        </div>

        {/* Content */}
        <div className="prose dark:prose-invert max-w-none space-y-6">
          
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">What are Custom Fields?</h2>
            <p className="text-slate-700 dark:text-slate-300">
              Custom fields allow you to capture and store additional information about your attendees beyond the default name and email, such as:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300">
              <li>Phone number</li>
              <li>Company name</li>
              <li>Job title</li>
              <li>Registration ID</li>
              <li>Ticket type</li>
              <li>Any other relevant data</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Creating Custom Fields</h2>
            <ol className="list-decimal list-inside space-y-2 text-slate-700 dark:text-slate-300">
              <li>Go to Attendees → Custom Fields</li>
              <li>Click "Add Custom Field"</li>
              <li>Enter the field name</li>
              <li>Select the field type</li>
              <li>Configure validation rules (optional)</li>
              <li>Save the field</li>
            </ol>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Supported Field Types</h2>
            <div className="space-y-3">
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                <p className="font-semibold text-slate-900 dark:text-white text-sm">Text</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Short text (e.g., company name, job title)</p>
              </div>
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                <p className="font-semibold text-slate-900 dark:text-white text-sm">Long Text</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Longer content (e.g., comments, notes)</p>
              </div>
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                <p className="font-semibold text-slate-900 dark:text-white text-sm">Email</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Email address with validation</p>
              </div>
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                <p className="font-semibold text-slate-900 dark:text-white text-sm">Phone</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Phone number with formatting</p>
              </div>
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                <p className="font-semibold text-slate-900 dark:text-white text-sm">Dropdown</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Select from predefined options</p>
              </div>
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                <p className="font-semibold text-slate-900 dark:text-white text-sm">Date</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Date picker with validation</p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Using Custom Fields in Bulk Uploads</h2>
            <p className="text-slate-700 dark:text-slate-300">
              When uploading attendees via CSV:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-slate-700 dark:text-slate-300">
              <li>Include custom field names as column headers</li>
              <li>Column names must match your custom field names exactly</li>
              <li>ReminderFlow will automatically map the data</li>
              <li>Missing values are stored as empty/null</li>
            </ol>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">CSV Example</h2>
            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded font-mono text-xs text-slate-700 dark:text-slate-300 overflow-x-auto">
              <pre>{`name,email,phone,company,job_title
John Doe,john@example.com,555-0123,Acme Corp,Developer
Jane Smith,jane@example.com,555-0456,Tech Inc,Manager
Bob Johnson,bob@example.com,555-0789,StartUp LLC,CTO`}</pre>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Using Custom Fields in Email Templates</h2>
            <p className="text-slate-700 dark:text-slate-300">
              Reference custom fields in email templates with variables:
            </p>
            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded font-mono text-sm text-slate-700 dark:text-slate-300 overflow-x-auto">
              <div>Dear @attendee_name@,</div>
              <div>Your company: @company@</div>
              <div>Your phone: @phone@</div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Editing and Deleting Custom Fields</h2>
            <p className="text-slate-700 dark:text-slate-300">
              To modify a custom field:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300">
              <li>Click on the field to edit its properties</li>
              <li>You can rename fields and change validation rules</li>
              <li>Deleting a field will remove all associated data</li>
              <li>Deleted fields cannot be recovered</li>
            </ul>
          </section>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 p-4 rounded-lg">
            <p className="text-sm text-amber-900 dark:text-amber-300">
              <strong>Caution:</strong> Be careful when deleting custom fields. This action is permanent and will delete all data stored in that field for all attendees.
            </p>
          </div>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Best Practices</h2>
            <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300">
              <li>Use descriptive field names</li>
              <li>Define validation rules to ensure data quality</li>
              <li>Document your custom fields for team members</li>
              <li>Limit the number of custom fields (10-20 recommended)</li>
              <li>Use dropdown fields for consistent options</li>
              <li>Backup your attendance data regularly</li>
            </ul>
          </section>

        </div>

      </div>
    </Layout>
  );
}
