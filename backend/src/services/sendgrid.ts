import sgMail from '@sendgrid/mail';

export interface SendEmailOptions {
  apiKey?: string | null;
  fromEmail?: string | null;
  fromName?: string | null;
  replyTo?: string | null;
}

let activeApiKey = '';

function resolveApiKey(override?: string | null): string {
  return (override || process.env.SENDGRID_API_KEY || '').trim();
}

function ensureApiKey(apiKeyOverride?: string | null): string | null {
  const apiKey = resolveApiKey(apiKeyOverride);
  if (!apiKey) return null;

  if (apiKey !== activeApiKey) {
    sgMail.setApiKey(apiKey);
    activeApiKey = apiKey;
  }

  return apiKey;
}

export async function sendEmailFromQueue(
  queueId: string,
  toEmail: string,
  subject: string,
  htmlContent: string,
  options: SendEmailOptions = {}
): Promise<{ success: boolean; error?: string }> {
  try {
    const apiKey = ensureApiKey(options.apiKey);
    if (!apiKey) {
      return { success: false, error: 'SendGrid API key is not configured' };
    }

    const fromEmail = (options.fromEmail || process.env.SENDGRID_FROM_EMAIL || '').trim();
    if (!fromEmail) {
      return { success: false, error: 'SendGrid sender email is not configured' };
    }

    const fromName = (options.fromName || process.env.SENDGRID_FROM_NAME || '').trim();
    const replyTo = (options.replyTo || '').trim();

    await sgMail.send({
      to: toEmail,
      from: fromName ? { email: fromEmail, name: fromName } : fromEmail,
      ...(replyTo ? { replyTo } : {}),
      subject,
      html: htmlContent,
      customArgs: { queueId },
    });

    return { success: true };
  } catch (error: any) {
    const errorMessage = error.response?.body?.errors?.[0]?.message || error.message || 'Unknown SendGrid error';
    return { success: false, error: errorMessage };
  }
}
