'use client';

import React from 'react';
import { generateGoogleCalendarLink, generateOutlookCalendarLink, downloadCalendarFile } from '@/lib/calendar';

interface CalendarLinksProps {
  title: string;
  description: string;
  date: string;
  time: string;
  timezone: string;
  meetingLink: string;
}

export const CalendarLinks: React.FC<CalendarLinksProps> = ({
  title,
  description,
  date,
  time,
  timezone,
  meetingLink,
}) => {
  const eventData = {
    title,
    description,
    date,
    time,
    timezone,
    meetingLink,
  };

  const googleLink = generateGoogleCalendarLink(eventData);
  const outlookLink = generateOutlookCalendarLink(eventData);

  const handleAppleCalendar = () => {
    downloadCalendarFile(eventData);
  };

  return (
    <div className="flex flex-wrap gap-3">
      <a
        href={googleLink}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-secondary text-sm"
      >
        📅 Google Calendar
      </a>
      <a
        href={outlookLink}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-secondary text-sm"
      >
        📅 Outlook
      </a>
      <button
        onClick={handleAppleCalendar}
        className="btn btn-secondary text-sm"
      >
        📅 Apple Calendar
      </button>
    </div>
  );
};
