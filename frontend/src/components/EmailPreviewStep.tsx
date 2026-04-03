'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  Loader2,
  Monitor,
  Palette,
  Rocket,
  RotateCcw,
} from 'lucide-react';
import {
  EMAIL_TYPE_LABELS,
  EmailType,
  THEMES,
  fetchEmailPreview,
} from '@/lib/emailPreview';

// ── Types ──────────────────────────────────────────────────────────────────

interface EventPayload {
  title:       string;
  description: string;
  eventDate:   string;
  eventTime:   string;
  timezone:    string;
  meetingLink?: string;
  formSchema:  any[];
}

interface EmailPreviewStepProps {
  /** Raw payload straight from EventForm.onSubmit */
  eventData:    EventPayload;
  onBack:       () => void;
  onPublish:    (themeId: string, customMessage: string) => Promise<void>;
  isPublishing: boolean;
}

const EMAIL_TABS: EmailType[] = ['confirmation', '24h', '1h', '10m'];

// ── Helpers ────────────────────────────────────────────────────────────────

/** Format "2026-10-15" → "October 15, 2026" */
function formatDate(iso: string): string {
  if (!iso) return '';
  try {
    return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch {
    return iso;
  }
}

/** Format "14:30" → "2:30 PM" */
function formatTime(time: string): string {
  if (!time) return '';
  try {
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
  } catch {
    return time;
  }
}

// ── Component ──────────────────────────────────────────────────────────────

export function EmailPreviewStep({
  eventData,
  onBack,
  onPublish,
  isPublishing,
}: EmailPreviewStepProps) {
  const [selectedTheme,   setSelectedTheme]   = useState('minimal_light');
  const [customMessage,   setCustomMessage]   = useState('');
  const [activeTab,       setActiveTab]       = useState<EmailType>('confirmation');
  const [previewHtml,     setPreviewHtml]     = useState('');
  const [previewSubject,  setPreviewSubject]  = useState('');
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError,    setPreviewError]    = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Debounce timer so we don't fire on every keystroke
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadPreview = useCallback(
    async (themeId: string, message: string, emailType: EmailType) => {
      setIsLoadingPreview(true);
      setPreviewError('');
      try {
        const { html, subject } = await fetchEmailPreview({
          themeId,
          customMessage:  message,
          eventTitle:     eventData.title,
          eventDate:      formatDate(eventData.eventDate),
          eventTime:      formatTime(eventData.eventTime),
          meetingLink:    eventData.meetingLink,
          emailType,
        });
        setPreviewHtml(html);
        setPreviewSubject(subject);
      } catch {
        setPreviewError('Could not load preview. Check your connection and try again.');
      } finally {
        setIsLoadingPreview(false);
      }
    },
    [eventData]
  );

  // Reload preview whenever theme, message, or tab changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadPreview(selectedTheme, customMessage, activeTab);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [selectedTheme, customMessage, activeTab, loadPreview]);

  // Write HTML into iframe after it loads to avoid XSS via srcdoc cross-origin issues
  useEffect(() => {
    if (!iframeRef.current || !previewHtml) return;
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(previewHtml);
    doc.close();
  }, [previewHtml]);

  const handlePublish = () => onPublish(selectedTheme, customMessage);

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">

      {/* ── Top summary bar ─────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
              Step 3 — Preview &amp; publish
            </p>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              {eventData.title || 'Your Event'}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {formatDate(eventData.eventDate)}
              {eventData.eventTime && ` · ${formatTime(eventData.eventTime)}`}
              {eventData.timezone && ` · ${eventData.timezone}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ChevronLeft size={16} />
            Edit details
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-6">

        {/* ── Left panel: theme + message ───────────────────────── */}
        <div className="space-y-5">

          {/* Theme picker */}
          <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2 mb-4">
              <Palette size={16} className="text-blue-500" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Email theme
              </h3>
            </div>
            <div className="space-y-2.5">
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setSelectedTheme(theme.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    selectedTheme === theme.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  {/* Colour swatch */}
                  <div className={`w-9 h-9 rounded-lg flex-shrink-0 ${theme.preview}`} />
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold truncate ${
                      selectedTheme === theme.id
                        ? 'text-blue-700 dark:text-blue-300'
                        : 'text-slate-800 dark:text-slate-200'
                    }`}>
                      {theme.label}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{theme.description}</p>
                  </div>
                  {selectedTheme === theme.id && (
                    <CheckCircle2 size={16} className="text-blue-500 flex-shrink-0 ml-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Custom message */}
          <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
              Custom message <span className="font-normal text-slate-400">(optional)</span>
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Appears as a highlighted callout inside every email.
            </p>
            <textarea
              rows={4}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="e.g., Please prepare your questions in advance. We look forward to seeing you!"
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
              maxLength={500}
            />
            <div className="flex justify-between mt-1.5">
              <button
                type="button"
                onClick={() => setCustomMessage('')}
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
              >
                <RotateCcw size={11} /> Clear
              </button>
              <span className="text-xs text-slate-400">{customMessage.length}/500</span>
            </div>
          </div>

          {/* Publish button */}
          <button
            type="button"
            onClick={handlePublish}
            disabled={isPublishing}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 shadow-sm"
          >
            {isPublishing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Rocket size={16} />
            )}
            {isPublishing ? 'Publishing…' : 'Publish event'}
          </button>
        </div>

        {/* ── Right panel: email preview ─────────────────────────── */}
        <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden flex flex-col min-h-[600px]">

          {/* Tab bar */}
          <div className="flex items-center gap-1 px-4 pt-4 pb-0 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
            <Monitor size={15} className="text-slate-400 mr-2 flex-shrink-0" />
            {EMAIL_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`flex-shrink-0 px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-all ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {EMAIL_TYPE_LABELS[tab]}
              </button>
            ))}
          </div>

          {/* Subject line */}
          {previewSubject && (
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <p className="text-xs text-slate-500 font-medium">
                <span className="text-slate-400">Subject: </span>
                {previewSubject}
              </p>
            </div>
          )}

          {/* Preview area */}
          <div className="flex-1 relative">
            {isLoadingPreview && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 z-10">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 size={24} className="animate-spin text-blue-500" />
                  <p className="text-xs text-slate-500 font-medium">Rendering preview…</p>
                </div>
              </div>
            )}

            {previewError && !isLoadingPreview && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center px-8">
                  <p className="text-sm text-red-500 font-medium mb-2">{previewError}</p>
                  <button
                    type="button"
                    onClick={() => loadPreview(selectedTheme, customMessage, activeTab)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Try again
                  </button>
                </div>
              </div>
            )}

            {!previewError && (
              <iframe
                ref={iframeRef}
                title={`Preview: ${EMAIL_TYPE_LABELS[activeTab]}`}
                className="w-full h-full min-h-[520px] border-0"
                sandbox="allow-same-origin"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}