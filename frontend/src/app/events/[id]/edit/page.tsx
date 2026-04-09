'use client';

import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { EventForm } from '@/components/EventForm';
import { EventEditorHeader } from '@/components/EventEditorHeader';
import api from '@/lib/api';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { FilePenLine, Loader2, Video, Link2, ExternalLink } from 'lucide-react';

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
      // Re-fetch to get updated daily_room_url if a room was just created
      const res = await api.get(`/api/events/${eventId}`);
      setEventData(res.data);
      router.push('/events');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyJoinLink = () => {
    const url = `${window.location.origin}/join/${eventId}`;
    navigator.clipboard.writeText(url).then(() => toast.success('Join link copied!')).catch(() => toast.error('Failed to copy link'));
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

        <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500 space-y-6">
          {/* Daily Room Banner */}
          {eventData?.daily_room_url && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[20px] border border-violet-200 bg-violet-50 dark:border-violet-800/50 dark:bg-violet-900/20 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400">
                  <Video size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-violet-900 dark:text-violet-200">Video Room Active</p>
                  <p className="text-xs text-violet-600 dark:text-violet-400 mt-0.5 truncate max-w-xs">{eventData.daily_room_url}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={copyJoinLink}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-violet-700 dark:text-violet-300 border border-violet-300 dark:border-violet-700 rounded-xl hover:bg-violet-100 dark:hover:bg-violet-800/40 transition-colors"
                >
                  <Link2 size={14} /> Copy Join Link
                </button>
                <button
                  onClick={() => router.push(`/events/${eventId}/room`)}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-colors"
                >
                  <ExternalLink size={14} /> Join Room
                </button>
              </div>
            </div>
          )}

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