import type { Metadata } from 'next';
import { LegalPage } from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Privacy Policy | ReminderFlow',
  description: 'ReminderFlow privacy policy describing what data we collect, how we use it, and the choices available to users and attendee contacts.',
};

const SECTIONS = [
  {
    title: 'What This Policy Covers',
    paragraphs: [
      'This Privacy Policy explains how ReminderFlow collects, uses, stores, and shares information when you use our website, application, support channels, and related services.',
      'It applies to both account holders using ReminderFlow and attendee information processed through the platform on behalf of an event organizer.',
    ],
  },
  {
    title: 'Information We Collect',
    paragraphs: [
      'We collect information you provide directly, such as your name, email address, organization details, billing details, event information, support requests, and account preferences.',
      'We also process event and attendee data submitted through the service, which may include attendee names, email addresses, messaging preferences, custom registration responses, and message delivery records.',
    ],
    bullets: [
      'Account and organization details.',
      'Event content, scheduling details, and templates.',
      'Attendee registration data and communication logs.',
      'Technical usage data such as device, browser, IP address, and service diagnostics.',
    ],
  },
  {
    title: 'How We Use Information',
    paragraphs: [
      'We use personal information to operate and improve ReminderFlow, authenticate users, schedule and deliver event communications, provide support, protect the platform, and comply with legal obligations.',
      'We may also use aggregated or de-identified information for analytics, capacity planning, product improvement, and service reliability work.',
    ],
  },
  {
    title: 'How We Share Information',
    paragraphs: [
      'We do not sell personal information. We share information only when necessary to run the service, comply with the law, protect rights and safety, or as instructed by the customer using ReminderFlow.',
      'Service providers may process information on our behalf, including hosting, email delivery, communications, analytics, support tooling, and payment infrastructure.',
    ],
    bullets: [
      'Infrastructure and cloud hosting providers.',
      'Email and messaging providers used to deliver reminders.',
      'Security, monitoring, and support vendors.',
      'Authorities or counterparties when legally required or necessary to protect the service.',
    ],
  },
  {
    title: 'Cookies and Similar Technologies',
    paragraphs: [
      'ReminderFlow may use cookies, local storage, and similar technologies to keep you signed in, remember preferences, understand product usage, and maintain security.',
      'You can control some cookie behavior through your browser settings, though disabling certain technologies may affect the availability or performance of parts of the service.',
    ],
  },
  {
    title: 'Data Retention',
    paragraphs: [
      'We retain information for as long as needed to provide the service, meet contractual commitments, resolve disputes, enforce agreements, and satisfy legal, tax, accounting, or security requirements.',
      'Retention periods can vary depending on the type of information, whether an account remains active, and the operational purpose for which the information was collected.',
    ],
  },
  {
    title: 'Security',
    paragraphs: [
      'We use reasonable administrative, technical, and organizational safeguards designed to protect personal information against unauthorized access, loss, misuse, or alteration.',
      'No method of storage or transmission is completely secure, so we cannot guarantee absolute security. You should also protect your credentials and use strong access controls within your organization.',
    ],
  },
  {
    title: 'Your Choices and Rights',
    paragraphs: [
      'Depending on where you are located, you may have rights to access, correct, delete, restrict, or object to certain processing of your personal information, and to receive a portable copy of certain data.',
      'If ReminderFlow processes attendee data on behalf of one of our customers, we may direct your request to that customer when they control the relevant data.',
    ],
  },
  {
    title: 'Children and International Transfers',
    paragraphs: [
      'ReminderFlow is not intended for use by children under 13, and we do not knowingly collect personal information directly from children through our public-facing services.',
      'Because ReminderFlow may rely on service providers in multiple jurisdictions, information may be processed outside your country. When required, we use appropriate safeguards for cross-border data transfers.',
    ],
  },
  {
    title: 'Contact',
    paragraphs: [
      'Questions or privacy requests can be sent to support@reminderflow.app. If we update this policy materially, we will post the revised version on this page with an updated effective date.',
    ],
  },
] as const;

export default function PrivacyPage() {
  return (
    <LegalPage
      currentPage="privacy"
      title="Privacy Policy"
      description="How ReminderFlow handles account, event, attendee, and messaging data when you use the platform."
      lastUpdated="April 8, 2026"
      sections={[...SECTIONS]}
    />
  );
}
