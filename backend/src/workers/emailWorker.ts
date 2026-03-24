import * as dotenv from 'dotenv';
import { query } from '../database/db';
import { sendEmailFromQueue } from '../services/sendgrid';

dotenv.config();

/**
 * Process email queue every minute
 */
async function processEmailQueue(): Promise<void> {
  try {
    // Find pending emails that are ready to send
    const queueResult = await query(
      `SELECT eq.id, eq.organization_id, eq.event_id, eq.attendee_id, eq.attendee_email, eq.template_type,
              a.name, e.title, e.event_date, e.event_time, e.meeting_link
       FROM email_queue eq
       JOIN attendees a ON eq.attendee_id = a.id
       JOIN events e ON eq.event_id = e.id
       WHERE eq.status = 'pending' AND eq.send_at <= CURRENT_TIMESTAMP
       LIMIT 100`
    );
    
    if (queueResult.rows.length === 0) {
      console.log(`[${new Date().toISOString()}] No pending emails to send`);
      return;
    }
    
    console.log(`[${new Date().toISOString()}] Processing ${queueResult.rows.length} emails...`);
    
    for (const row of queueResult.rows) {
      try {
        // Format date and time
        const eventDate = new Date(row.event_date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        const eventTime = row.event_time;
        
        // Send email
        const result = await sendEmailFromQueue(
          row.id,
          row.organization_id,
          row.event_id,
          row.attendee_id,
          row.attendee_email,
          row.name,
          row.template_type,
          row.title,
          eventDate,
          eventTime,
          row.meeting_link || ''
        );
        
        if (result.success) {
          console.log(`✓ Email sent to ${row.attendee_email} (${row.template_type})`);
        } else {
          console.error(`✗ Failed to send email to ${row.attendee_email}: ${result.error}`);
        }
      } catch (error) {
        console.error(`Error processing queue item ${row.id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error processing email queue:', error);
  }
}

/**
 * Start worker - check every minute
 */
async function startWorker(): Promise<void> {
  console.log('Starting email queue worker...');
  
  // Process immediately on start
  await processEmailQueue();
  
  // Then process every minute
  setInterval(processEmailQueue, 60 * 1000);
  
  console.log('Email queue worker started (checks every 60 seconds)');
}

// Start worker if this file is run directly
if (require.main === module) {
  startWorker().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { processEmailQueue, startWorker };
