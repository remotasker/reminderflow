import * as sgMail from '@sendgrid/mail';
import { query } from '../database/db';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'no-reply@reminderflow.app';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

interface EmailTemplate {
  subject: string;
  html: string;
}

/**
 * Get default email template
 */
function getDefaultTemplate(type: string): EmailTemplate {
  const templates: { [key: string]: EmailTemplate } = {
    confirmation: {
      subject: 'Event Confirmation - {{event_title}}',
      html: `
        <h2>Event Confirmation</h2>
        <p>Hi {{name}},</p>
        <p>Thank you for registering for <strong>{{event_title}}</strong>.</p>
        <p><strong>Event Details:</strong></p>
        <ul>
          <li>Date: {{event_date}}</li>
          <li>Time: {{event_time}}</li>
          {{#meeting_link}}<li><a href="{{meeting_link}}">Join Meeting</a></li>{{/meeting_link}}
        </ul>
        <p>Best regards,<br>ReminderFlow Team</p>
      `
    },
    '24h': {
      subject: 'Reminder: {{event_title}} is tomorrow!',
      html: `
        <h2>Event Reminder</h2>
        <p>Hi {{name}},</p>
        <p>This is a reminder that <strong>{{event_title}}</strong> is happening tomorrow!</p>
        <p><strong>Event Details:</strong></p>
        <ul>
          <li>Date: {{event_date}}</li>
          <li>Time: {{event_time}}</li>
          {{#meeting_link}}<li><a href="{{meeting_link}}">Join Meeting</a></li>{{/meeting_link}}
        </ul>
        <p>See you soon!<br>ReminderFlow Team</p>
      `
    },
    '1h': {
      subject: 'Reminder: {{event_title}} starts in 1 hour!',
      html: `
        <h2>Event Starting Soon</h2>
        <p>Hi {{name}},</p>
        <p><strong>{{event_title}}</strong> starts in 1 hour!</p>
        <p><strong>Event Details:</strong></p>
        <ul>
          <li>Time: {{event_time}}</li>
          {{#meeting_link}}<li><a href="{{meeting_link}}">Join Meeting</a></li>{{/meeting_link}}
        </ul>
        <p>See you shortly!<br>ReminderFlow Team</p>
      `
    },
    '10m': {
      subject: 'Reminder: {{event_title}} starts in 10 minutes!',
      html: `
        <h2>Event Starting Very Soon</h2>
        <p>Hi {{name}},</p>
        <p><strong>{{event_title}}</strong> is starting in just 10 minutes!</p>
        {{#meeting_link}}<p><a href="{{meeting_link}}">Click here to join</a></p>{{/meeting_link}}
        <p>ReminderFlow Team</p>
      `
    }
  };
  
  return templates[type] || templates.confirmation;
}

/**
 * Substitute template variables
 */
function substituteVariables(template: string, variables: { [key: string]: string }): string {
  let result = template;
  
  // Simple variable substitution
  Object.keys(variables).forEach(key => {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), variables[key]);
    // Remove conditional blocks if variable is empty
    result = result.replace(new RegExp(`{{#${key}}}.*?{{/${key}}}`, 'gs'), '');
  });
  
  return result;
}

/**
 * Send email
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  try {
    if (!SENDGRID_API_KEY) {
      console.warn('SendGrid API key not configured');
      return false;
    }
    
    await sgMail.send({
      to,
      from: FROM_EMAIL,
      subject,
      html,
      replyTo: 'support@reminderflow.app',
    });
    
    console.log(`Email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Send email from queue item
 */
export async function sendEmailFromQueue(
  queueId: string,
  organizationId: string,
  eventId: string,
  attendeeId: string,
  attendeeEmail: string,
  attendeeName: string,
  templateType: string,
  eventTitle: string,
  eventDate: string,
  eventTime: string,
  meetingLink: string
): Promise<{ success: boolean; trackingId?: string; error?: string }> {
  try {
    // Get template
    const templateResult = await query(
      'SELECT subject, html_content FROM email_templates WHERE organization_id = $1 AND type = $2',
      [organizationId, templateType]
    );
    
    let template = getDefaultTemplate(templateType);
    if (templateResult.rows.length > 0) {
      template = {
        subject: templateResult.rows[0].subject,
        html: templateResult.rows[0].html_content,
      };
    }
    
    // Substitute variables
    const variables = {
      name: attendeeName,
      event_title: eventTitle,
      event_date: eventDate,
      event_time: eventTime,
      meeting_link: meetingLink,
    };
    
    const subject = substituteVariables(template.subject, variables);
    const html = substituteVariables(template.html, variables);
    
    // Create email log entry
    const trackingId = Math.random().toString(36).substring(2, 15);
    
    await query(
      `INSERT INTO email_logs (id, organization_id, event_id, attendee_id, queue_id, recipient_email, template_type, sent_at, tracking_id)
       VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, $7)`,
      [organizationId, eventId, attendeeId, queueId, attendeeEmail, templateType, trackingId]
    );
    
    // Add tracking pixel to HTML
    const trackingPixel = `<img src="${process.env.API_URL || 'http://localhost:3001'}/api/email/track-pixel/${trackingId}" width="1" height="1" alt="" style="display:none;" />`;
    const htmlWithTracking = html + trackingPixel;
    
    // Send email
    const success = await sendEmail(attendeeEmail, subject, htmlWithTracking);
    
    if (success) {
      // Update queue status
      await query(
        'UPDATE email_queue SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['sent', queueId]
      );
    } else {
      // Update queue status to failed
      await query(
        'UPDATE email_queue SET status = $1, attempt_count = attempt_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['failed', queueId]
      );
      return { success: false, error: 'Failed to send email' };
    }
    
    return { success: true, trackingId };
  } catch (error) {
    console.error('Error sending email from queue:', error);
    
    // Update queue status
    await query(
      'UPDATE email_queue SET status = $1, attempt_count = attempt_count + 1, last_error = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      ['failed', String(error), queueId]
    );
    
    return { success: false, error: String(error) };
  }
}

export { getDefaultTemplate, substituteVariables };
