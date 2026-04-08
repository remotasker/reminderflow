import { isPlainObject } from './validation';

export interface NotificationSettings {
  confirmationEmail: boolean;
  reminder24h:       boolean;
  reminder1h:        boolean;
  reminder10m:       boolean;
  failureAlerts:     boolean;
  weeklySummary:     boolean;
  // WhatsApp notification toggles — independent of email toggles
  whatsappConfirmation: boolean;
  whatsappReminder24h:  boolean;
  whatsappReminder1h:   boolean;
  whatsappReminder10m:  boolean;
}

export interface IntegrationSettings {
  sendgridApiKey:           string;
  sendgridFromEmail:        string;
  sendgridFromName:         string;
  googleAppsScriptWebhook:  string;
  // Twilio / WhatsApp
  twilioAccountSid:         string;
  twilioAuthToken:          string;
  twilioWhatsappFrom:       string; // e.g. "whatsapp:+14155238886"
  // Twilio Content Template SIDs — one per reminder type
  // Leave blank to fall back to a plain-text message body
  twilioTemplateConfirmation: string;
  twilioTemplate24h:          string;
  twilioTemplate1h:           string;
  twilioTemplate10m:          string;
}

export interface OrganizationProfileSettings {
  timezone:     string;
  fromName:     string;
  replyToEmail: string;
  billingEmail: string;
  taxId:        string;
}

export interface UserPreferenceSettings {
  notifyOnRegistration: boolean;
  weeklySummary:        boolean;
}

export interface OrganizationSettings {
  notifications: NotificationSettings;
  integrations:  IntegrationSettings;
  profile:       OrganizationProfileSettings;
}

export interface UserSettings {
  preferences: UserPreferenceSettings;
}

// ── Defaults ──────────────────────────────────────────────────────────────

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  confirmationEmail:    true,
  reminder24h:          true,
  reminder1h:           true,
  reminder10m:          false,
  failureAlerts:        true,
  weeklySummary:        false,
  whatsappConfirmation: false,
  whatsappReminder24h:  false,
  whatsappReminder1h:   false,
  whatsappReminder10m:  false,
};

export const DEFAULT_INTEGRATION_SETTINGS: IntegrationSettings = {
  sendgridApiKey:           '',
  sendgridFromEmail:        '',
  sendgridFromName:         '',
  googleAppsScriptWebhook:  '',
  twilioAccountSid:         '',
  twilioAuthToken:          '',
  twilioWhatsappFrom:       '',
  twilioTemplateConfirmation: '',
  twilioTemplate24h:          '',
  twilioTemplate1h:           '',
  twilioTemplate10m:          '',
};

export const DEFAULT_ORGANIZATION_PROFILE_SETTINGS: OrganizationProfileSettings = {
  timezone:     'Africa/Nairobi',
  fromName:     'Events Team',
  replyToEmail: '',
  billingEmail: '',
  taxId:        '',
};

export const DEFAULT_USER_PREFERENCE_SETTINGS: UserPreferenceSettings = {
  notifyOnRegistration: true,
  weeklySummary:        false,
};

// ── Helpers ───────────────────────────────────────────────────────────────

function asRecord(value: unknown): Record<string, unknown> {
  return isPlainObject(value) ? value : {};
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

// ── Getters ───────────────────────────────────────────────────────────────

export function getNotificationSettings(value: unknown): NotificationSettings {
  const root          = asRecord(value);
  const notifications = asRecord(root.notifications);
  const d             = DEFAULT_NOTIFICATION_SETTINGS;

  return {
    confirmationEmail:    asBoolean(notifications.confirmationEmail,    d.confirmationEmail),
    reminder24h:          asBoolean(notifications.reminder24h,          d.reminder24h),
    reminder1h:           asBoolean(notifications.reminder1h,           d.reminder1h),
    reminder10m:          asBoolean(notifications.reminder10m,          d.reminder10m),
    failureAlerts:        asBoolean(notifications.failureAlerts,        d.failureAlerts),
    weeklySummary:        asBoolean(notifications.weeklySummary,        d.weeklySummary),
    whatsappConfirmation: asBoolean(notifications.whatsappConfirmation, d.whatsappConfirmation),
    whatsappReminder24h:  asBoolean(notifications.whatsappReminder24h,  d.whatsappReminder24h),
    whatsappReminder1h:   asBoolean(notifications.whatsappReminder1h,   d.whatsappReminder1h),
    whatsappReminder10m:  asBoolean(notifications.whatsappReminder10m,  d.whatsappReminder10m),
  };
}

export function getIntegrationSettings(value: unknown): IntegrationSettings {
  const root         = asRecord(value);
  const integrations = asRecord(root.integrations);

  return {
    sendgridApiKey:           asString(integrations.sendgridApiKey),
    sendgridFromEmail:        asString(integrations.sendgridFromEmail),
    sendgridFromName:         asString(integrations.sendgridFromName),
    googleAppsScriptWebhook:  asString(integrations.googleAppsScriptWebhook),
    twilioAccountSid:         asString(integrations.twilioAccountSid),
    twilioAuthToken:          asString(integrations.twilioAuthToken),
    twilioWhatsappFrom:       asString(integrations.twilioWhatsappFrom),
    twilioTemplateConfirmation: asString(integrations.twilioTemplateConfirmation),
    twilioTemplate24h:          asString(integrations.twilioTemplate24h),
    twilioTemplate1h:           asString(integrations.twilioTemplate1h),
    twilioTemplate10m:          asString(integrations.twilioTemplate10m),
  };
}

export function getOrganizationProfileSettings(value: unknown): OrganizationProfileSettings {
  const root    = asRecord(value);
  const profile = asRecord(root.profile);
  const d       = DEFAULT_ORGANIZATION_PROFILE_SETTINGS;

  return {
    timezone:     asString(profile.timezone,     d.timezone),
    fromName:     asString(profile.fromName,     d.fromName),
    replyToEmail: asString(profile.replyToEmail),
    billingEmail: asString(profile.billingEmail),
    taxId:        asString(profile.taxId),
  };
}

export function getUserPreferenceSettings(value: unknown): UserPreferenceSettings {
  const root        = asRecord(value);
  const preferences = asRecord(root.preferences);
  const d           = DEFAULT_USER_PREFERENCE_SETTINGS;

  return {
    notifyOnRegistration: asBoolean(preferences.notifyOnRegistration, d.notifyOnRegistration),
    weeklySummary:        asBoolean(preferences.weeklySummary,        d.weeklySummary),
  };
}

// ── Merge helpers ─────────────────────────────────────────────────────────

export function mergeOrganizationSettings(
  current: unknown,
  updates: Partial<OrganizationSettings>
): OrganizationSettings {
  return {
    notifications: updates.notifications
      ? { ...getNotificationSettings(current), ...updates.notifications }
      : getNotificationSettings(current),
    integrations: updates.integrations
      ? { ...getIntegrationSettings(current), ...updates.integrations }
      : getIntegrationSettings(current),
    profile: updates.profile
      ? { ...getOrganizationProfileSettings(current), ...updates.profile }
      : getOrganizationProfileSettings(current),
  };
}

export function mergeUserSettings(current: unknown, updates: Partial<UserSettings>): UserSettings {
  return {
    preferences: updates.preferences
      ? { ...getUserPreferenceSettings(current), ...updates.preferences }
      : getUserPreferenceSettings(current),
  };
}

// ── Email type enabled check ──────────────────────────────────────────────

export function isEmailTypeEnabled(settings: unknown, templateType: string): boolean {
  const n = getNotificationSettings(settings);
  switch (templateType) {
    case 'confirmation': return n.confirmationEmail;
    case '24h':          return n.reminder24h;
    case '1h':           return n.reminder1h;
    case '10m':          return n.reminder10m;
    default:             return true;
  }
}

// ── WhatsApp type enabled check ───────────────────────────────────────────

export function isWhatsAppTypeEnabled(settings: unknown, templateType: string): boolean {
  const n = getNotificationSettings(settings);
  switch (templateType) {
    case 'confirmation': return n.whatsappConfirmation;
    case '24h':          return n.whatsappReminder24h;
    case '1h':           return n.whatsappReminder1h;
    case '10m':          return n.whatsappReminder10m;
    default:             return false;
  }
}