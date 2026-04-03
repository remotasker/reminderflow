'use client';
import React from 'react';
import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { EventForm } from '@/components/EventForm';
import { EmailPreviewStep } from '@/components/EmailPreviewStep';
import { EventEditorHeader } from '@/components/EventEditorHeader';
import {
  CalendarPlus,
  LayoutTemplate,
  MonitorPlay,
  Users,
  Presentation,
  Eye,
} from 'lucide-react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

// ── Template definitions ───────────────────────────────────────────────────

const EVENT_TEMPLATES = [
  {
    id:          'blank',
    name:        'Start from Scratch',
    description: 'A completely blank canvas. Build your event from the ground up.',
    icon:        CalendarPlus,
    color:       'text-slate-600 bg-slate-50 border-slate-200/50 dark:text-slate-300 dark:bg-slate-800 dark:border-slate-700/50',
    data:        null,
  },
  {
    id:          'webinar',
    name:        'Virtual Webinar',
    description: 'Perfect for online presentations, masterclasses, or product demos.',
    icon:        MonitorPlay,
    color:       'text-blue-600 bg-blue-50 border-blue-100/50 dark:text-blue-400 dark:bg-blue-900/30 dark:border-blue-800/50',
    data: {
      title:       'Live Webinar: [Topic Here]',
      description: 'Join us for an exclusive live session where we will cover [Topic].',
      location:    'Virtual / Zoom',
      questions: [
        {
          id:       'q1',
          text:     'What do you hope to learn from this session?',
          type:     'multiple_choice',
          options:  ['Basics & Fundamentals', 'Advanced Strategies', 'Tooling & Setup'],
          required: true,
        },
      ],
    },
  },
  {
    id:          'workshop',
    name:        'Interactive Workshop',
    description: 'For smaller, hands-on sessions requiring attendee participation.',
    icon:        Users,
    color:       'text-emerald-600 bg-emerald-50 border-emerald-100/50 dark:text-emerald-400 dark:bg-emerald-900/30 dark:border-emerald-800/50',
    data: {
      title:       'Hands-On Workshop: [Topic Here]',
      description: 'A highly interactive workshop limited to a small group.',
      location:    '',
      questions: [
        {
          id:       'q1',
          text:     'Do you have prior experience with this topic?',
          type:     'yes_no',
          options:  [],
          required: true,
        },
      ],
    },
  },
  {
    id:          'conference',
    name:        'In-Person Conference',
    description: 'Standard setup for physical meetups, summits, or networking events.',
    icon:        Presentation,
    color:       'text-amber-600 bg-amber-50 border-amber-100/50 dark:text-amber-400 dark:bg-amber-900/30 dark:border-amber-800/50',
    data: {
      title:       'Annual Summit 2026',
      description: 'Join industry leaders for a full day of networking and keynotes.',
      location:    '123 Business Center, Suite 100',
      questions: [
        {
          id:       'q1',
          text:     'Do you have any dietary restrictions?',
          type:     'multiple_choice',
          options:  ['None', 'Vegetarian', 'Vegan', 'Gluten-Free'],
          required: true,
        },
      ],
    },
  },
];

// ── Step type ──────────────────────────────────────────────────────────────

type Step = 'template_picker' | 'form' | 'preview';

// ── Page ───────────────────────────────────────────────────────────────────

export default function CreateEventPage() {
  const router = useRouter();

  const [step,                 setStep]                 = useState<Step>('template_picker');
  const [selectedTemplateData, setSelectedTemplateData] = useState<any>(null);
  const [pendingEventPayload,  setPendingEventPayload]  = useState<any>(null);
  const [isSubmitting,         setIsSubmitting]         = useState(false);

  // Step 1 → Step 2: user picks a template
  const handleSelectTemplate = (templateData: any) => {
    setSelectedTemplateData(templateData);
    setStep('form');
  };

  // Step 2 → Step 3: EventForm calls onSubmit — we capture the payload and
  // move to the preview step instead of posting to the API immediately.
  const handleFormComplete = async (data: any) => {
    setPendingEventPayload(data);
    setStep('preview');
  };

  // Step 3 → API: user clicks "Publish event"
  const handlePublish = async (themeId: string, customMessage: string) => {
    if (!pendingEventPayload) return;
    setIsSubmitting(true);
    try {
      // Attach chosen theme + message to the event payload so the backend
      // can persist them alongside the event for use in the email worker.
      await api.post('/api/events', {
        ...pendingEventPayload,
        email_theme_id: themeId,
      });
      toast.success('Event created successfully!');
      router.push('/events');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create event');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Header meta per step ──────────────────────────────────────────────

  const headerProps = {
    template_picker: {
      title:       'Choose a Template',
      description: 'Start from scratch or pick a preset that matches the kind of event you are hosting.',
      icon:        LayoutTemplate,
      backLabel:   'Back to events',
      onBack:      () => router.push('/events'),
    },
    form: {
      title:       'Create Event',
      description: 'Configure the details, registration questions, and meeting info for your new event.',
      icon:        CalendarPlus,
      backLabel:   'Back to templates',
      onBack:      () => setStep('template_picker'),
    },
    preview: {
      title:       'Preview Emails',
      description: 'See exactly what your attendees will receive, then publish when you\'re happy.',
      icon:        Eye,
      backLabel:   'Back to event details',
      onBack:      () => setStep('form'),
    },
  }[step];

  // ── Step indicator ────────────────────────────────────────────────────

  const STEPS = [
    { key: 'template_picker', label: 'Template'  },
    { key: 'form',            label: 'Details'   },
    { key: 'preview',         label: 'Preview'   },
  ];
  const currentStepIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <Layout>
      <div className="max-w-7xl w-full mx-auto space-y-8 animate-in fade-in duration-500 pb-12 px-4 sm:px-6 md:px-8">

        <EventEditorHeader
          {...headerProps}
          actions={
            step === 'form'
              ? [{ label: 'Back to Events', onClick: () => router.push('/events') }]
              : []
          }
        />

        {/* ── Step progress indicator ───────────────────────────── */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.key}>
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                    i < currentStepIndex
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                      : i === currentStepIndex
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {i < currentStepIndex ? '✓' : i + 1}
                </div>
                <span
                  className={`text-sm font-medium hidden sm:block ${
                    i <= currentStepIndex
                      ? 'text-slate-900 dark:text-white'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-[2px] rounded transition-all ${
                    i < currentStepIndex
                      ? 'bg-slate-900 dark:bg-white'
                      : 'bg-slate-100 dark:bg-slate-800'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* ── Step 1: Template picker ───────────────────────────── */}
        {step === 'template_picker' && (
          <div className="space-y-6">
            <div className="rounded-[20px] border border-slate-200/80 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-medium uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Event Setup
              </p>
              <h2 className="mt-2 text-2xl font-medium tracking-tight text-slate-900 dark:text-white">
                What kind of event are you hosting?
              </h2>
              <p className="mt-1 text-sm font-normal text-slate-500 dark:text-slate-400">
                Each template pre-fills the form so you can get moving quickly.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {EVENT_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleSelectTemplate(template.data)}
                  className="group flex items-start gap-5 rounded-[20px] border border-slate-200/80 bg-white p-6 text-left shadow-sm transition-all hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-600"
                >
                  <div className={`rounded-xl p-3 flex-shrink-0 border transition-colors ${template.color}`}>
                    <template.icon size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium tracking-tight text-slate-900 transition-colors group-hover:text-slate-600 dark:text-white dark:group-hover:text-slate-300">
                      {template.name}
                    </h3>
                    <p className="mt-1.5 text-sm font-normal leading-relaxed text-slate-500 dark:text-slate-400">
                      {template.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2: Event details form ────────────────────────── */}
        {step === 'form' && (
          <div className="max-w-4xl mx-auto animate-in slide-in-from-right-4 duration-300">
            <EventForm
              initialData={selectedTemplateData}
              onSubmit={handleFormComplete}
              isLoading={false}
              submitLabel="Next: Preview emails →"
            />
          </div>
        )}

        {/* ── Step 3: Theme + email preview ────────────────────── */}
        {step === 'preview' && pendingEventPayload && (
          <EmailPreviewStep
            eventData={pendingEventPayload}
            onBack={() => setStep('form')}
            onPublish={handlePublish}
            isPublishing={isSubmitting}
          />
        )}
      </div>
    </Layout>
  );
}