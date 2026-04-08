import type { Metadata } from 'next';
import { LegalPage } from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Terms of Service | ReminderFlow',
  description: 'ReminderFlow terms of service covering account use, responsibilities, billing, and service access.',
};

const SECTIONS = [
  {
    title: 'Acceptance of Terms',
    paragraphs: [
      'These Terms of Service govern your access to and use of ReminderFlow, including our website, hosted application, and related services.',
      'By creating an account, accessing the service, or submitting attendee information through ReminderFlow, you agree to these terms on behalf of yourself and, if applicable, the organization you represent.',
    ],
  },
  {
    title: 'Who May Use the Service',
    paragraphs: [
      'You may use ReminderFlow only if you can form a binding agreement and are authorized to act for the organization whose events, attendees, and communications you manage.',
      'You are responsible for keeping your account credentials secure and for all activity that occurs under your account.',
    ],
  },
  {
    title: 'Your Responsibilities',
    paragraphs: [
      'You are responsible for the information you upload or collect through ReminderFlow, including attendee names, email addresses, registration responses, and messaging content.',
      'You agree to use the service lawfully, to respect anti-spam and privacy rules that apply to your attendees, and to obtain any consent required before sending reminders or collecting personal data.',
    ],
    bullets: [
      'Keep account, billing, and organization details accurate and up to date.',
      'Use ReminderFlow only for legitimate event operations and attendee communications.',
      'Avoid uploading malicious code, interfering with the platform, or attempting unauthorized access.',
    ],
  },
  {
    title: 'Communications and Messaging',
    paragraphs: [
      'ReminderFlow helps you automate operational event messages such as confirmations, reminders, and updates. Delivery may depend on third-party providers such as SendGrid, Twilio, hosting infrastructure, and recipient systems.',
      'You remain responsible for the timing, content, and legal basis of the messages you choose to send. We do not guarantee delivery, inbox placement, or uninterrupted availability of any third-party integration.',
    ],
  },
  {
    title: 'Billing, Trials, and Changes',
    paragraphs: [
      'If ReminderFlow offers a free trial, promotional access, or paid subscription, the related pricing and renewal details will be presented to you at the point of purchase or activation.',
      'We may update features, limits, pricing, or packaging over time. Material changes will take effect prospectively and will not retroactively remove rights you already paid for during an active billing period unless required for security, legal, or operational reasons.',
    ],
  },
  {
    title: 'Intellectual Property',
    paragraphs: [
      'ReminderFlow and all related branding, software, visual design, and service materials remain the property of ReminderFlow or its licensors.',
      'You retain ownership of your organization data, event content, templates, and attendee records, subject to the rights needed for us to host, process, transmit, and secure that data in order to provide the service.',
    ],
  },
  {
    title: 'Suspension and Termination',
    paragraphs: [
      'We may suspend or terminate access if we reasonably believe an account is violating these terms, creating security risk, abusing messaging infrastructure, or exposing us or others to legal or operational harm.',
      'You may stop using ReminderFlow at any time. Termination does not relieve you of obligations accrued before termination, including payment obligations and compliance responsibilities for messages already sent.',
    ],
  },
  {
    title: 'Disclaimers and Liability Limits',
    paragraphs: [
      'ReminderFlow is provided on an as-is and as-available basis. To the maximum extent permitted by law, we disclaim implied warranties of merchantability, fitness for a particular purpose, and non-infringement.',
      'To the maximum extent permitted by law, ReminderFlow will not be liable for indirect, incidental, special, consequential, or punitive damages, or for lost profits, lost revenue, lost data, or business interruption arising from your use of the service.',
      'If liability cannot be excluded, ReminderFlow total liability for claims arising from the service will be limited to the amounts you paid to ReminderFlow for the affected service during the 12 months before the event giving rise to the claim.',
    ],
  },
  {
    title: 'Contact',
    paragraphs: [
      'If you have questions about these Terms of Service, contact us at support@reminderflow.app.',
    ],
  },
] as const;

export default function TermsPage() {
  return (
    <LegalPage
      currentPage="terms"
      title="Terms of Service"
      description="The rules that apply when you create a ReminderFlow account, manage events, and send automated reminders through the platform."
      lastUpdated="April 8, 2026"
      sections={[...SECTIONS]}
    />
  );
}
