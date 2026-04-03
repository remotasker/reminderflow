import { isPlainObject } from './validation';

export interface NotificationSettings {
  confirmationEmail: boolean;
  reminder24h: boolean;
  reminder1h: boolean;
  reminder10m: boolean;
  failureAlerts: boolean;
  weeklySummary: boolean;
}

export interface IntegrationSettings {
  sendgridApiKey: string;
  sendgridFromEmail: string;
  sendgridFromName: string;
  googleAppsScriptWebhook: string;
}

export interface OrganizationProfileSettings {
  timezone: string;
  fromName: string;
  replyToEmail: string;
  billingEmail: string;
  taxId: string;
}

export interface UserPreferenceSettings {
  notifyOnRegistration: boolean;
  weeklySummary: boolean;
}

export interface OrganizationSettings {
  notifications: NotificationSettings;
  integrations: IntegrationSettings;
  profile: OrganizationProfileSettings;
}

export interface UserSettings {
  preferences: UserPreferenceSettings;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  confirmationEmail: true,
  reminder24h: true,
  reminder1h: true,
  reminder10m: false,
  failureAlerts: true,
  weeklySummary: false,
};

export const DEFAULT_INTEGRATION_SETTINGS: IntegrationSettings = {
  sendgridApiKey: '',
  sendgridFromEmail: '',
  sendgridFromName: '',
  googleAppsScriptWebhook: '',
};

export const DEFAULT_ORGANIZATION_PROFILE_SETTINGS: OrganizationProfileSettings = {
  timezone: 'Africa/Nairobi',
  fromName: 'Events Team',
  replyToEmail: '',
  billingEmail: '',
  taxId: '',
};

export const DEFAULT_USER_PREFERENCE_SETTINGS: UserPreferenceSettings = {
  notifyOnRegistration: true,
  weeklySummary: false,
};

function asRecord(value: unknown): Record<string, unknown> {
  return isPlainObject(value) ? value : {};
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

export function getNotificationSettings(value: unknown): NotificationSettings {
  const root = asRecord(value);
  const notifications = asRecord(root.notifications);

  return {
    confirmationEmail: asBoolean(notifications.confirmationEmail, DEFAULT_NOTIFICATION_SETTINGS.confirmationEmail),
    reminder24h: asBoolean(notifications.reminder24h, DEFAULT_NOTIFICATION_SETTINGS.reminder24h),
    reminder1h: asBoolean(notifications.reminder1h, DEFAULT_NOTIFICATION_SETTINGS.reminder1h),
    reminder10m: asBoolean(notifications.reminder10m, DEFAULT_NOTIFICATION_SETTINGS.reminder10m),
    failureAlerts: asBoolean(notifications.failureAlerts, DEFAULT_NOTIFICATION_SETTINGS.failureAlerts),
    weeklySummary: asBoolean(notifications.weeklySummary, DEFAULT_NOTIFICATION_SETTINGS.weeklySummary),
  };
}

export function getIntegrationSettings(value: unknown): IntegrationSettings {
  const root = asRecord(value);
  const integrations = asRecord(root.integrations);

  return {
    sendgridApiKey: asString(integrations.sendgridApiKey),
    sendgridFromEmail: asString(integrations.sendgridFromEmail),
    sendgridFromName: asString(integrations.sendgridFromName),
    googleAppsScriptWebhook: asString(integrations.googleAppsScriptWebhook),
  };
}

export function getOrganizationProfileSettings(value: unknown): OrganizationProfileSettings {
  const root = asRecord(value);
  const profile = asRecord(root.profile);

  return {
    timezone: asString(profile.timezone, DEFAULT_ORGANIZATION_PROFILE_SETTINGS.timezone),
    fromName: asString(profile.fromName, DEFAULT_ORGANIZATION_PROFILE_SETTINGS.fromName),
    replyToEmail: asString(profile.replyToEmail),
    billingEmail: asString(profile.billingEmail),
    taxId: asString(profile.taxId),
  };
}

export function getUserPreferenceSettings(value: unknown): UserPreferenceSettings {
  const root = asRecord(value);
  const preferences = asRecord(root.preferences);

  return {
    notifyOnRegistration: asBoolean(preferences.notifyOnRegistration, DEFAULT_USER_PREFERENCE_SETTINGS.notifyOnRegistration),
    weeklySummary: asBoolean(preferences.weeklySummary, DEFAULT_USER_PREFERENCE_SETTINGS.weeklySummary),
  };
}

export function mergeOrganizationSettings(
  current: unknown,
  updates: Partial<OrganizationSettings>
): OrganizationSettings {
  const nextNotifications = updates.notifications
    ? { ...getNotificationSettings(current), ...updates.notifications }
    : getNotificationSettings(current);
  const nextIntegrations = updates.integrations
    ? { ...getIntegrationSettings(current), ...updates.integrations }
    : getIntegrationSettings(current);
  const nextProfile = updates.profile
    ? { ...getOrganizationProfileSettings(current), ...updates.profile }
    : getOrganizationProfileSettings(current);

  return {
    notifications: nextNotifications,
    integrations: nextIntegrations,
    profile: nextProfile,
  };
}

export function mergeUserSettings(current: unknown, updates: Partial<UserSettings>): UserSettings {
  const nextPreferences = updates.preferences
    ? { ...getUserPreferenceSettings(current), ...updates.preferences }
    : getUserPreferenceSettings(current);

  return {
    preferences: nextPreferences,
  };
}

export function isEmailTypeEnabled(settings: unknown, templateType: string): boolean {
  const notifications = getNotificationSettings(settings);

  switch (templateType) {
    case 'confirmation':
      return notifications.confirmationEmail;
    case '24h':
      return notifications.reminder24h;
    case '1h':
      return notifications.reminder1h;
    case '10m':
      return notifications.reminder10m;
    default:
      return true;
  }
}
