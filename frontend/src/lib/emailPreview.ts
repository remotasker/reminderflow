// lib/emailPreview.ts
// Calls POST /api/templates/preview with real event data from Step 2.
// Returns rendered HTML + subject for a given email type and theme.

import api from './api';

export type EmailType = 'confirmation' | '24h' | '1h' | '10m';

export interface PreviewRequest {
  themeId:        string;
  customMessage?: string;
  primaryColor?:  string;
  secondaryColor?: string;
  // Real event data injected from Step 2
  eventTitle:     string;
  eventDate:      string;
  eventTime:      string;
  meetingLink?:   string;
  emailType:      EmailType;
}

export interface PreviewResponse {
  html:    string;
  subject: string;
}

export async function fetchEmailPreview(params: PreviewRequest): Promise<PreviewResponse> {
  const res = await api.post('/api/templates/preview', {
    theme_id:        params.themeId,
    custom_message:  params.customMessage || '',
    primary_color:   params.primaryColor,
    secondary_color: params.secondaryColor,
    event_title:     params.eventTitle,
    event_date:      params.eventDate,
    event_time:      params.eventTime,
    meeting_link:    params.meetingLink || '',
    email_type:      params.emailType,
  });

  return res.data as PreviewResponse;
}

export const EMAIL_TYPE_LABELS: Record<EmailType, string> = {
  confirmation: 'Confirmation',
  '24h':        '24 hr reminder',
  '1h':         '1 hr reminder',
  '10m':        '10 min reminder',
};

export const THEMES = [
  {
    id:          'minimal_light',
    label:       'Minimal light',
    description: 'Clean white layout, great for professional events',
    preview:     'bg-white border border-slate-200',
  },
  {
    id:          'modern_dark',
    label:       'Modern dark',
    description: 'Dark background, bold typography',
    preview:     'bg-slate-900 border border-slate-700',
  },
  {
    id:          'brand_heavy',
    label:       'Brand heavy',
    description: 'Your primary brand color dominates the header',
    preview:     'bg-blue-600 border border-blue-700',
  },
];