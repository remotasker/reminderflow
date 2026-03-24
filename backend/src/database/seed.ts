import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { query, closePool } from './db';
import { hashPassword } from '../utils/auth';

dotenv.config();

async function seed(): Promise<void> {
  try {
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      console.error('Error: DATABASE_URL environment variable is not set!');
      console.error('\nPlease create backend/.env with:');
      console.error('DATABASE_URL=postgresql://postgres:postgres@localhost:5432/reminderflow');
      process.exit(1);
    }

    console.log('Starting database seed...');
    
    // Create organization
    const organizationId = uuidv4();
    const orgName = 'Tech Academy';
    const slug = 'tech-academy-' + organizationId.substring(0, 8);
    
    await query(
      'INSERT INTO organizations (id, name, slug) VALUES ($1, $2, $3)',
      [organizationId, orgName, slug]
    );
    console.log('✓ Organization created:', orgName);
    
    // Create user
    const userId = uuidv4();
    const email = 'admin@techacademy.com';
    const passwordHash = await hashPassword('Demo123!');
    
    await query(
      'INSERT INTO users (id, organization_id, email, password_hash, full_name, role) VALUES ($1, $2, $3, $4, $5, $6)',
      [userId, organizationId, email, passwordHash, 'Admin User', 'admin']
    );
    console.log('✓ User created:', email);
    
    // Create event
    const eventId = uuidv4();
    const eventDate = new Date();
    eventDate.setDate(eventDate.getDate() + 30); // 30 days from now
    const eventDateStr = eventDate.toISOString().split('T')[0];
    const eventTime = '14:00';
    
    await query(
      `INSERT INTO events (id, organization_id, title, description, event_date, event_time, timezone, meeting_link, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        eventId,
        organizationId,
        'AI & Cybersecurity Webinar',
        'Join us for an in-depth discussion on the latest trends in AI and Cybersecurity. Learn from industry experts and network with professionals.',
        eventDateStr,
        eventTime,
        'America/New_York',
        'https://zoom.us/j/123456789',
        userId
      ]
    );
    console.log('✓ Event created:', 'AI & Cybersecurity Webinar');
    
    // Create reminders
    const reminderTypes = ['confirmation', '24h', '1h', '10m'];
    const hoursBefore = [0, 24, 1, 0.167];
    
    for (let i = 0; i < reminderTypes.length; i++) {
      await query(
        `INSERT INTO reminders (id, event_id, type, hours_before)
         VALUES ($1, $2, $3, $4)`,
        [uuidv4(), eventId, reminderTypes[i], hoursBefore[i]]
      );
    }
    console.log('✓ Reminders created:', reminderTypes.join(', '));
    
    // Create sample attendees
    const sampleAttendees = [
      { name: 'John Smith', email: 'john.smith@example.com' },
      { name: 'Sarah Johnson', email: 'sarah.johnson@example.com' },
      { name: 'Michael Brown', email: 'michael.brown@example.com' },
      { name: 'Emily Davis', email: 'emily.davis@example.com' },
      { name: 'David Wilson', email: 'david.wilson@example.com' },
      { name: 'Jessica Martinez', email: 'jessica.martinez@example.com' },
      { name: 'Robert Garcia', email: 'robert.garcia@example.com' },
      { name: 'Lisa Anderson', email: 'lisa.anderson@example.com' },
      { name: 'James Taylor', email: 'james.taylor@example.com' },
      { name: 'Maria Thomas', email: 'maria.thomas@example.com' },
    ];
    
    for (const attendee of sampleAttendees) {
      const attendeeId = uuidv4();
      
      await query(
        'INSERT INTO attendees (id, event_id, name, email) VALUES ($1, $2, $3, $4)',
        [attendeeId, eventId, attendee.name, attendee.email]
      );
      
      // Create email queue entries for each reminder
      for (let i = 0; i < reminderTypes.length; i++) {
        const sendTime = new Date(eventDate.getTime() - hoursBefore[i] * 60 * 60 * 1000);
        
        await query(
          `INSERT INTO email_queue (id, organization_id, event_id, attendee_id, attendee_email, template_type, send_at, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [uuidv4(), organizationId, eventId, attendeeId, attendee.email, reminderTypes[i], sendTime, 'pending']
        );
      }
    }
    console.log('✓ Created 10 sample attendees with queued reminders');
    
    // Create default email templates
    const templates = [
      {
        type: 'confirmation',
        subject: 'Event Confirmation - {{event_title}}',
        html: `<h2>Event Confirmation</h2><p>Hi {{name}},</p><p>Thank you for registering for <strong>{{event_title}}</strong>.</p><p><strong>Event Details:</strong></p><ul><li>Date: {{event_date}}</li><li>Time: {{event_time}}</li><li><a href="{{meeting_link}}">Join Meeting</a></li></ul><p>Best regards,<br>Tech Academy Team</p>`
      },
      {
        type: '24h',
        subject: 'Reminder: {{event_title}} is tomorrow!',
        html: `<h2>Event Reminder</h2><p>Hi {{name}},</p><p>This is a reminder that <strong>{{event_title}}</strong> is happening tomorrow!</p><p><strong>Event Details:</strong></p><ul><li>Date: {{event_date}}</li><li>Time: {{event_time}}</li><li><a href="{{meeting_link}}">Join Meeting</a></li></ul><p>See you soon!<br>Tech Academy Team</p>`
      },
      {
        type: '1h',
        subject: 'Reminder: {{event_title}} starts in 1 hour!',
        html: `<h2>Event Starting Soon</h2><p>Hi {{name}},</p><p><strong>{{event_title}}</strong> starts in 1 hour!</p><ul><li>Time: {{event_time}}</li><li><a href="{{meeting_link}}">Join Meeting</a></li></ul><p>See you shortly!<br>Tech Academy Team</p>`
      },
      {
        type: '10m',
        subject: 'Reminder: {{event_title}} starts in 10 minutes!',
        html: `<h2>Event Starting Very Soon</h2><p>Hi {{name}},</p><p><strong>{{event_title}}</strong> is starting in just 10 minutes!</p><p><a href="{{meeting_link}}">Click here to join</a></p><p>Tech Academy Team</p>`
      }
    ];
    
    for (const template of templates) {
      await query(
        `INSERT INTO email_templates (id, organization_id, type, subject, html_content)
         VALUES ($1, $2, $3, $4, $5)`,
        [uuidv4(), organizationId, template.type, template.subject, template.html]
      );
    }
    console.log('✓ Email templates created');
    
    console.log('\n=== SEED COMPLETE ===');
    console.log('\nTest Account:');
    console.log(`Email: ${email}`);
    console.log('Password: Demo123!');
    console.log('\nEvent Details:');
    console.log(`Title: AI & Cybersecurity Webinar`);
    console.log(`Date: ${eventDateStr}`);
    console.log(`Time: ${eventTime}`);
    console.log(`Attendees: ${sampleAttendees.length} (with queued emails)`);
    
  } catch (error) {
    console.error('Seed error:', error);
    throw error;
  } finally {
    await closePool();
  }
}

seed().then(() => {
  console.log('\n✓ Database seeded successfully!');
  process.exit(0);
}).catch(error => {
  console.error('\n✗ Seed failed:', error);
  process.exit(1);
});
