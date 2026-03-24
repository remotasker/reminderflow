# ReminderFlow

A multi-tenant SaaS platform for scheduling and automating reminder emails for webinars, meetings, and online events.

## Features

- 🏢 **Multi-tenant Architecture** - Fully isolated organizations and data
- 🔐 **Authentication** - Email/password with JWT tokens and role-based access
- 📅 **Event Management** - Create events with dates, times, meeting links, and timezone support
- 👥 **Attendee Management** - Add attendees manually or via CSV upload
- 📧 **Email Automation** - Automatic reminder emails (confirmation, 24h, 1h, 10min)
- 📊 **Analytics** - Track email opens, clicks, and engagement metrics
- 🔗 **Calendar Integration** - Add to Google Calendar, Outlook, Apple Calendar
- 📈 **Dashboard** - Real-time metrics and email activity charts
- 🚀 **SendGrid Integration** - Professional email delivery

## Tech Stack

- **Frontend**: Next.js 14 + React 18 + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL
- **Email**: SendGrid API
- **Charts**: Chart.js

## Project Structure

```
reminderflow/
├── frontend/              # Next.js application
├── backend/               # Express API
├── IMPLEMENTATION_PLAN.md # Detailed implementation plan
├── README.md             # This file
└── .env.example          # Environment variables
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 12+
- SendGrid API key (optional, for email sending)

### Installation

1. **Install Dependencies**

```bash
npm install
```

2. **Set Up Environment Variables**

Create `.env` files in both frontend and backend directories:

**backend/.env:**
```bash
cp backend/.env.example backend/.env
# Edit backend/.env and set:
# - DATABASE_URL
# - JWT_SECRET
# - SENDGRID_API_KEY (optional)
# - SENDGRID_FROM_EMAIL
```

**frontend/.env.local:**
```bash
cp frontend/.env.example frontend/.env.local
# Edit frontend/.env.local and set:
# - NEXT_PUBLIC_API_URL=http://localhost:3001
```

3. **Set Up Database**

```bash
# Run migrations
npm run migrate --workspace=backend

# Seed with demo data
npm run seed --workspace=backend
```

4. **Start Development Servers**

```bash
# Start both frontend and backend
npm run dev

# Or start separately:
npm run dev:frontend  # http://localhost:3000
npm run dev:backend   # http://localhost:3001
```

## Demo Account

After seeding, you can log in with:

- **Email**: admin@techacademy.com
- **Password**: Demo123!

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Sign in

### Events
- `GET /api/events` - List events
- `POST /api/events` - Create event
- `GET /api/events/:id` - Get event details
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

### Attendees
- `GET /api/attendees/:eventId` - List attendees
- `POST /api/attendees/:eventId` - Add attendee
- `POST /api/attendees/:eventId/bulk-upload` - Upload CSV
- `DELETE /api/attendees/:id` - Remove attendee

### Analytics
- `GET /api/analytics/metrics` - Dashboard metrics
- `GET /api/analytics/email-stats` - Email statistics
- `GET /api/analytics/events-stats` - Event statistics
- `GET /api/analytics/timeline` - Email activity timeline

### Email Tracking
- `GET /api/email/track-pixel/:trackingId` - Track opens (pixel)
- `GET /api/email/track-click/:trackingId` - Track clicks

## Email Worker

The email queue worker processes pending emails every minute:

```bash
npm run worker --workspace=backend
```

The worker:
- Checks email queue every 60 seconds
- Sends emails when `send_at` time is reached
- Updates status (pending → sent/failed)
- Handles retries and error logging

## File Structure

### Backend
```
backend/
├── src/
│   ├── server.ts              # Express app setup
│   ├── routes/                # API route handlers
│   │   ├── auth.ts
│   │   ├── events.ts
│   │   ├── attendees.ts
│   │   ├── analytics.ts
│   │   └── email.ts
│   ├── middleware/            # Express middleware
│   │   └── auth.ts
│   ├── services/              # Business logic
│   │   └── sendgrid.ts
│   ├── utils/                 # Utilities
│   │   └── auth.ts
│   ├── database/              # Database layer
│   │   ├── db.ts
│   │   ├── schema.sql
│   │   ├── migrate.ts
│   │   └── seed.ts
│   └── workers/               # Background jobs
│       └── emailWorker.ts
├── tsconfig.json
└── package.json
```

### Frontend
```
frontend/
├── src/
│   ├── app/                   # Next.js app router
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── events/page.tsx
│   │   ├── events/[id]/attendees/page.tsx
│   │   └── analytics/page.tsx
│   ├── components/            # React components
│   │   ├── Layout.tsx
│   │   ├── AuthForm.tsx
│   │   └── CalendarLinks.tsx
│   ├── lib/                   # Utilities
│   │   ├── api.ts            # Axios client
│   │   └── calendar.ts        # Calendar integration
│   └── styles/
│       └── globals.css
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

## Database Schema

### Core Tables
- **organizations** - Company accounts
- **users** - Team members with roles
- **events** - Webinars and meetings
- **attendees** - Event participants
- **reminders** - Reminder schedules
- **email_templates** - Email templates
- **email_queue** - Emails to send
- **email_logs** - Sent email tracking
- **email_click_logs** - Click tracking

## Multi-Tenant Isolation

All queries include organization_id filtering:
- Users can only access their organization's data
- API middleware checks user's organization
- All tables have organization_id foreign key

## Email Templates

Default templates with variable substitution:
- `{{name}}` - Attendee name
- `{{event_title}}` - Event title
- `{{event_date}}` - Event date (formatted)
- `{{event_time}}` - Event time
- `{{meeting_link}}` - Meeting URL

## Features by Component

### Dashboard
- Total events, attendees, emails sent
- Upcoming events count
- 30-day email activity chart

### Events
- Create/edit/delete events
- Set timezone and meeting link
- Configure reminder schedule
- View attendee count

### Attendees
- Add single attendee
- CSV bulk upload (name, email)
- Delete attendees
- Auto-generate email queue entries

### Analytics
- Email status distribution (pie chart)
- Attendees per event (bar chart)
- Email activity timeline (line chart)
- Open rate, click rate, metrics

### Calendar Integration
- Google Calendar link
- Outlook calendar link
- Apple Calendar (.ics download)

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment instructions.

## Contributing

This is a demo/template project. Feel free to fork and customize for your needs.

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.

---

Built with ❤️ by ReminderFlow Team
