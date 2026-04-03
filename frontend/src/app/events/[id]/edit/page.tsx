'use client';

import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { EventForm } from '@/components/EventForm';
import { EventEditorHeader } from '@/components/EventEditorHeader';
import api from '@/lib/api';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { FilePenLine, Loader2 } from 'lucide-react';

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id;

  const [eventData, setEventData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch the existing event data to pre-fill the form
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await api.get(`/api/events/${eventId}`);
        setEventData(res.data);
      } catch (error) {
        toast.error('Failed to load event details');
        router.push('/events');
      } finally {
        setIsLoading(false);
      }
    };
    if (eventId) fetchEvent();
  }, [eventId, router]);

  const handleUpdate = async (data: any) => {
    setIsSubmitting(true);
    try {
      await api.put(`/api/events/${eventId}`, data);
      toast.success('Event updated successfully!');
      router.push('/events');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update event');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-7xl w-full mx-auto space-y-8 pb-12 px-4 sm:px-6 md:px-8 mt-2">
          <EventEditorHeader
            title="Edit Event"
            description="Update the details, registration questions, and delivery settings for this event."
            icon={FilePenLine}
            backLabel="Back to events"
            onBack={() => router.push('/events')}
          />

          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-[20px] border border-slate-200/80 bg-white text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            <Loader2 className="mb-4 animate-spin text-slate-300 dark:text-slate-600" size={32} />
            <p className="text-sm font-medium">Loading event details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl w-full mx-auto space-y-8 animate-in fade-in duration-500 pb-12 px-4 sm:px-6 md:px-8 mt-2">
        <EventEditorHeader
          title="Edit Event"
          description={
            eventData?.title
              ? `Refine "${eventData.title}" without leaving the main dashboard workflow.`
              : 'Update the details, registration questions, and delivery settings for this event.'
          }
          icon={FilePenLine}
          backLabel="Back to events"
          onBack={() => router.push('/events')}
        />

        <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
          <EventForm
            initialData={eventData}
            onSubmit={handleUpdate}
            isLoading={isSubmitting}
          />
        </div>
      </div>
    </Layout>
  );
}