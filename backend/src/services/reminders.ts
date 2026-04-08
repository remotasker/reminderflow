import { v4 as uuidv4 } from 'uuid';
import { isEmailTypeEnabled } from '../utils/settings';

export const REMINDER_ORDER = ['confirmation', '24h', '1h', '10m'] as const;
export type ReminderType = (typeof REMINDER_ORDER)[number];

export const DEFAULT_EVENT_REMINDER_SCHEDULE: ReminderType[] = [
  'confirmation',
  '24h',
  '1h',
];

const HOURS_BEFORE_BY_TYPE: Record<ReminderType, number> = {
  confirmation: 0,
  '24h': 24,
  '1h': 1,
  '10m': 10 / 60,
};

export interface ReminderRow {
  type: string;
  hours_before?: number | string | null;
  hoursBefore?: number | string | null;
}

interface Queryable {
  query: (text: string, params?: any[]) => Promise<{ rows: any[] }>;
}

interface QueueRemindersForAttendeeOptions {
  organizationId: string;
  eventId: string;
  attendeeId: string;
  attendeeEmail: string;
  whatsappNumber?: string | null;
  eventDate: string | Date;
  eventTime: string;
  themeId?: string | null;
  settings: unknown;
  reminders: ReminderRow[];
  includeConfirmation?: boolean;
  now?: Date;
}

interface RebuildPendingReminderQueueOptions {
  eventId: string;
  organizationId: string;
  eventDate: string | Date;
  eventTime: string;
  themeId?: string | null;
  settings: unknown;
  reminders: ReminderRow[];
  attendees: Array<{
    id: string;
    email: string;
    whatsapp_number?: string | null;
  }>;
}

export function isReminderType(value: unknown): value is ReminderType {
  return typeof value === 'string' && REMINDER_ORDER.includes(value as ReminderType);
}

export function normalizeReminderSchedule(
  value: unknown,
  fallback: ReminderType[] = []
): ReminderType[] {
  const source = Array.isArray(value) ? value : fallback;
  const picked = new Set<ReminderType>();

  for (const candidate of source) {
    if (isReminderType(candidate)) picked.add(candidate);
  }

  return REMINDER_ORDER.filter((type) => picked.has(type));
}

export function reminderScheduleFromRows(
  rows: ReminderRow[],
  fallback: ReminderType[] = []
): ReminderType[] {
  const schedule = normalizeReminderSchedule(rows.map((row) => row.type));
  return schedule.length > 0 ? schedule : fallback;
}

export function buildReminderRowsFromSchedule(schedule: ReminderType[]): ReminderRow[] {
  return schedule.map((type) => ({
    type,
    hours_before: HOURS_BEFORE_BY_TYPE[type],
  }));
}

export function toDateOnlyString(value: string | Date): string {
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return String(value).split('T')[0];
}

export async function replaceEventReminderDefinitions(
  executor: Queryable,
  eventId: string,
  schedule: ReminderType[]
): Promise<void> {
  await executor.query('DELETE FROM reminders WHERE event_id = $1', [eventId]);

  for (const type of schedule) {
    await executor.query(
      `INSERT INTO reminders (id, event_id, type, hours_before)
       VALUES ($1, $2, $3, $4)`,
      [uuidv4(), eventId, type, HOURS_BEFORE_BY_TYPE[type]]
    );
  }
}

export async function queueRemindersForAttendee(
  executor: Queryable,
  options: QueueRemindersForAttendeeOptions
): Promise<void> {
  const now = options.now ?? new Date();
  const themeId = options.themeId || 'minimal_light';

  if (options.includeConfirmation !== false && isEmailTypeEnabled(options.settings, 'confirmation')) {
    await insertQueueItemIfMissing(executor, {
      organizationId: options.organizationId,
      eventId: options.eventId,
      attendeeId: options.attendeeId,
      attendeeEmail: options.attendeeEmail,
      templateType: 'confirmation',
      themeId,
      whatsappNumber: options.whatsappNumber ?? null,
      sendAt: now,
    });
  }

  for (const reminder of options.reminders) {
    if (!isReminderType(reminder.type) || reminder.type === 'confirmation') continue;
    if (!isEmailTypeEnabled(options.settings, reminder.type)) continue;

    const hoursBefore = getHoursBefore(reminder);
    if (hoursBefore === null) continue;

    const sendAt = getReminderSendAt(options.eventDate, options.eventTime, hoursBefore);
    if (!sendAt || sendAt <= now) continue;

    await insertQueueItemIfMissing(executor, {
      organizationId: options.organizationId,
      eventId: options.eventId,
      attendeeId: options.attendeeId,
      attendeeEmail: options.attendeeEmail,
      templateType: reminder.type,
      themeId,
      whatsappNumber: options.whatsappNumber ?? null,
      sendAt,
    });
  }
}

export async function rebuildPendingReminderQueueForEvent(
  executor: Queryable,
  options: RebuildPendingReminderQueueOptions
): Promise<void> {
  await executor.query(
    `DELETE FROM email_queue
     WHERE event_id = $1
       AND template_type IN ('24h', '1h', '10m')
       AND status IN ('pending', 'failed')`,
    [options.eventId]
  );

  for (const attendee of options.attendees) {
    await queueRemindersForAttendee(executor, {
      organizationId: options.organizationId,
      eventId: options.eventId,
      attendeeId: attendee.id,
      attendeeEmail: attendee.email,
      whatsappNumber: attendee.whatsapp_number ?? null,
      eventDate: options.eventDate,
      eventTime: options.eventTime,
      themeId: options.themeId,
      settings: options.settings,
      reminders: options.reminders,
      includeConfirmation: false,
    });
  }
}

function getHoursBefore(reminder: ReminderRow): number | null {
  const raw = reminder.hours_before ?? reminder.hoursBefore;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;

  if (typeof raw === 'string') {
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) return parsed;
  }

  if (isReminderType(reminder.type)) return HOURS_BEFORE_BY_TYPE[reminder.type];
  return null;
}

function getReminderSendAt(
  eventDate: string | Date,
  eventTime: string,
  hoursBefore: number
): Date | null {
  const datePart = toDateOnlyString(eventDate);
  const timePart = String(eventTime).slice(0, 8);
  const eventDateTime = new Date(`${datePart}T${timePart}`);

  if (Number.isNaN(eventDateTime.getTime())) return null;

  return new Date(eventDateTime.getTime() - hoursBefore * 60 * 60 * 1000);
}

async function insertQueueItemIfMissing(
  executor: Queryable,
  params: {
    organizationId: string;
    eventId: string;
    attendeeId: string;
    attendeeEmail: string;
    templateType: ReminderType;
    themeId: string;
    whatsappNumber: string | null;
    sendAt: Date;
  }
): Promise<void> {
  await executor.query(
    `INSERT INTO email_queue
       (id, organization_id, event_id, attendee_id, attendee_email,
        template_type, email_theme_id, whatsapp_number, send_at, status)
     SELECT
       $1, $2, $3, $4, $5,
       $6::varchar, $7, $8, $9, 'pending'
     WHERE NOT EXISTS (
       SELECT 1
       FROM email_queue
       WHERE event_id = $3
         AND attendee_id = $4
         AND template_type = $6::varchar
     )`,
    [
      uuidv4(),
      params.organizationId,
      params.eventId,
      params.attendeeId,
      params.attendeeEmail,
      params.templateType,
      params.themeId,
      params.whatsappNumber,
      params.sendAt,
    ]
  );
}
