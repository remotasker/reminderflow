# ReminderFlow Quick Start

Get ReminderFlow running in 5 minutes!

## Option 1: Automated Setup (Recommended)

### Step 1: Run Setup Script

```bash
chmod +x setup.sh
./setup.sh
```

This will:
- Check prerequisites
- Install all dependencies
- Create environment files
- Help with database setup

### Step 2: Start Database

If you don't have PostgreSQL running, use Docker:

```bash
docker run -d \
  --name reminderflow-db \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:15
```

### Step 3: Initialize Database

```bash
npm run migrate --workspace=backend
npm run seed --workspace=backend
```

### Step 4: Start Servers

```bash
npm run dev
```

Visit http://localhost:3000 and log in with:
- **Email**: admin@techacademy.com
- **Password**: Demo123!

---

## Option 2: Manual Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

**Backend** (`backend/.env`):
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/reminderflow
JWT_SECRET=my-secret-key
SENDGRID_API_KEY=your-sendgrid-key-here
SENDGRID_FROM_EMAIL=no-reply@reminderflow.app
NODE_ENV=development
PORT=3001
```

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Start PostgreSQL

```bash
# With Docker
docker run -d --name reminderflow-db -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:15

# Or use existing PostgreSQL installation
```

### 4. Initialize Database

```bash
npm run migrate --workspace=backend
npm run seed --workspace=backend
```

### 5. Start Development Servers

Terminal 1 - Backend:
```bash
npm run dev:backend
```

Terminal 2 - Frontend:
```bash
npm run dev:frontend
```

### 6. Open Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

---

## Demo Walkthrough

After logging in, here's what to try:

### 1. View Dashboard
- See metrics: Total Events, Attendees, Emails Sent
- View email activity chart

### 2. Create Event
- Go to Events → + New Event
- Fill in event details (title, date, time, timezone)
- Add meeting link (Zoom, Teams, Google Meet)
- Select reminder schedule (Confirmation, 24h, 1h, 10m)

### 3. Add Attendees
- Click "Attendees" on an event
- Add attendees manually or upload CSV
- CSV format: `name,email` (with header)

### 4. View Analytics
- Go to Analytics page
- See email performance metrics
- View open rate and click rate
- Check attendees per event

### 5. Calendar Integration
- On event details, use "Add to Calendar" buttons
- Add to Google Calendar, Outlook, or Apple Calendar

---

## Running Email Worker

To process queued emails every minute:

Terminal 3:
```bash
npm run worker --workspace=backend
```

This is required to actually send emails. Without it, emails will queue but not send.

---

## Common Issues

### Database Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution**: Start PostgreSQL or Docker
```bash
docker start reminderflow-db
# or
sudo service postgresql start
```

### Port Already in Use

If port 3000 or 3001 is in use:

```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or change port in environment
PORT=3002 npm run dev:backend
```

### SendGrid Not Configured

If emails aren't sending:

1. Get API key from https://sendgrid.com
2. Update `SENDGRID_API_KEY` in `backend/.env`
3. Verify sender email domain
4. Restart backend server

### Migration Errors

```bash
# Reset database (development only!)
dropdb reminderflow
createdb reminderflow
npm run migrate --workspace=backend
npm run seed --workspace=backend
```

---

## Next Steps

- Read [README.md](./README.md) for full documentation
- See [DEPLOYMENT.md](./DEPLOYMENT.md) for production setup
- Check [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for architecture details

---

## Need Help?

1. Check application logs
   ```bash
   npm run dev  # See console output
   ```

2. Check database
   ```bash
   psql postgresql://postgres:postgres@localhost:5432/reminderflow
   \dt  # List tables
   ```

3. Check API
   ```bash
   curl http://localhost:3001/api/health
   ```

---

Enjoy ReminderFlow! 🚀
