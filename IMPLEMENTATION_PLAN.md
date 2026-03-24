# ReminderFlow Implementation Plan

## Project Overview
ReminderFlow is a multi-tenant SaaS platform for automating reminder emails for webinars, meetings, and online events. Organizations can create events, upload attendees, schedule reminders, and automatically send emails via SendGrid.

## Technology Stack
- **Frontend**: Next.js + React (TypeScript)
- **Backend**: Node.js + Express (TypeScript)
- **Database**: PostgreSQL
- **Email Service**: SendGrid API
- **UI Framework**: Tailwind CSS

## Project Structure
```
reminderflow/
├── frontend/           # Next.js app
│   ├── src/
│   │   ├── app/       # App router
│   │   ├── components/
│   │   ├── pages/
│   │   ├── lib/       # Utilities, API client
│   │   └── styles/
│   ├── package.json
│   └── next.config.js
├── backend/           # Express API
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── services/
│   │   ├── workers/
│   │   ├── utils/
│   │   └── server.ts
│   ├── migrations/    # Database migrations
│   ├── seeds/         # Seed data
│   ├── package.json
│   └── .env.example
├── database/
│   ├── schema.sql     # Database schema
│   └── migrations/
├── docs/
│   └── DEPLOYMENT.md  # Setup & deployment instructions
├── docker-compose.yml # Local dev environment
└── README.md          # Project root README
```

## Database Schema

### Tables
1. **organizations** - Company accounts
2. **users** - Team members with roles
3. **events** - Webinars, meetings to send reminders for
4. **attendees** - People attending events
5. **reminders** - Reminder schedule for events
6. **email_templates** - Email templates with variables
7. **email_queue** - Queue of emails to send
8. **email_logs** - Tracking of sent emails

### Key Relationships
- Organization → Users (one-to-many)
- Organization → Events (one-to-many)
- Event → Attendees (one-to-many)
- Event → Reminders (one-to-many)
- Event → Email Templates (one-to-many, default templates)
- Email Queue → Event, Organization, Attendee
- Email Logs → Organization, Event, Attendee

## Implementation Phases

### Phase 1: Core Infrastructure
1. Initialize Next.js frontend project
2. Initialize Express backend
3. Set up PostgreSQL database
4. Create database schema and migrations
5. Set up environment variables
6. Configure CORS and basic middleware

### Phase 2: Authentication & Authorization
1. Create users and organizations tables
2. Implement JWT-based authentication (login/signup)
3. Add organization isolation middleware
4. Create role-based access control (admin, manager)
5. Add auth UI (login, signup, logout)

### Phase 3: Dashboard & Core UI
1. Create main dashboard layout with sidebar navigation
2. Implement dashboard metrics (total events, attendees, emails sent)
3. Create analytics chart (simple line/bar chart)
4. Add responsive design

### Phase 4: Event Management
1. Create events API (CRUD)
2. Build event creation form
3. Implement event list view with search/filter
4. Add event details view
5. Implement reminder schedule selection

### Phase 5: Attendee Management
1. Create attendees API (CRUD)
2. Build CSV upload functionality
3. Create manual attendee entry form
4. Build attendee list view
5. Add bulk import with validation

### Phase 6: Email System
1. Create email templates (confirmation, 24h, 1h, 10min)
2. Build template editor UI
3. Create email queue table
4. Implement queue management endpoints
5. Set up template variable substitution

### Phase 7: SendGrid Integration
1. Configure SendGrid API key
2. Create SendGrid service with email sending
3. Implement HTML email formatting
4. Set up sender address configuration
5. Add error handling and retries

### Phase 8: Background Worker
1. Create email queue processor service
2. Implement 1-minute interval check
3. Add batch email sending
4. Update queue status (pending → sent/failed)
5. Add logging and monitoring

### Phase 9: Email Tracking
1. Create email_logs table schema
2. Implement tracking pixel for opens
3. Create redirect links for click tracking
4. Build tracking endpoints
5. Add analytics calculation from logs

### Phase 10: Analytics Page
1. Create analytics dashboard
2. Display total emails sent, open rate, click rate
3. Show attendees per event statistics
4. Create simple charts (Chart.js or similar)
5. Add date range filtering

### Phase 11: Calendar Integration
1. Generate iCalendar (.ics) files
2. Create "Add to Calendar" links for Google Calendar
3. Create "Add to Calendar" for Outlook
4. Create "Add to Calendar" for Apple Calendar

### Phase 12: Demo Data & Testing
1. Create seed scripts
2. Generate demo organization (Tech Academy)
3. Create demo event (AI & Cybersecurity Webinar)
4. Add 10 sample attendees
5. Pre-populate reminder schedule

### Phase 13: Deployment & Documentation
1. Write environment setup guide
2. Create deployment instructions
3. Document API endpoints
4. Create user guide
5. Add development setup instructions

## Key Features Details

### Authentication Flow
- Signup with email/password
- Email verification (optional, can be skipped for demo)
- Login with JWT token storage
- Logout functionality
- Role-based dashboard (admin sees all users, managers see own data)

### Event Reminder Schedule
When creating an event, users select which reminders to send:
1. Confirmation email (immediately after signup)
2. 24 hours before event
3. 1 hour before event
4. 10 minutes before event

System automatically creates entries in email_queue for each attendee.

### Email Template Variables
Templates support substitution of:
- `{{name}}` - Attendee name
- `{{event_title}}` - Event title
- `{{event_date}}` - Event date (formatted)
- `{{event_time}}` - Event time (formatted)
- `{{meeting_link}}` - Zoom/Teams/Meet link

### Multi-Tenant Isolation
- All queries include `WHERE organization_id = :org_id`
- Middleware checks user's organization on each request
- API responses filtered by organization
- Users can only see their organization's data

## API Endpoints (Backend)

### Auth
- POST /api/auth/signup
- POST /api/auth/login
- POST /api/auth/logout
- POST /api/auth/refresh

### Events
- GET /api/events
- POST /api/events
- GET /api/events/:id
- PUT /api/events/:id
- DELETE /api/events/:id

### Attendees
- GET /api/events/:eventId/attendees
- POST /api/events/:eventId/attendees
- POST /api/events/:eventId/attendees/bulk-upload
- DELETE /api/attendees/:id

### Email Queue & Logs
- GET /api/email-queue
- GET /api/email-logs
- POST /api/email-logs/track-open (pixel endpoint)
- POST /api/email-logs/track-click (redirect endpoint)

### Templates
- GET /api/templates
- POST /api/templates
- PUT /api/templates/:id
- GET /api/templates/defaults

### Analytics
- GET /api/analytics/metrics
- GET /api/analytics/email-stats
- GET /api/analytics/events-stats

## Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/reminderflow
JWT_SECRET=your-secret-key
SENDGRID_API_KEY=your-sendgrid-key
SENDGRID_FROM_EMAIL=no-reply@reminderflow.app
NODE_ENV=development
PORT=3001
```

## Deliverables

1. **Complete Backend API** - All endpoints functional with proper error handling
2. **Complete Frontend UI** - Responsive design, all features accessible
3. **Database** - Schema, migrations, seed data
4. **Background Worker** - Email queue processor running every minute
5. **Documentation** - Setup, deployment, and usage guides
6. **Demo Data** - Pre-configured organization and event

## Success Criteria

- Users can sign up and log in
- Organizations are completely isolated
- Events can be created with reminder schedules
- Attendees can be uploaded via CSV or manual entry
- Emails queue automatically based on schedule
- Background worker sends emails every minute
- Dashboard shows real metrics and analytics
- Email tracking works (opens and clicks)
- Application can be deployed with provided instructions
