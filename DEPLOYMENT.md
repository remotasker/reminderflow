# ReminderFlow Deployment Guide

Complete instructions for deploying ReminderFlow to production.

## Prerequisites

- PostgreSQL 12+ (managed or self-hosted)
- Node.js 18+ runtime
- SendGrid account with API key
- Git repository

## Local Development Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd reminderflow
npm install
```

### 2. Environment Configuration

**Backend** (`backend/.env`):
```env
DATABASE_URL=postgresql://user:password@localhost:5432/reminderflow
JWT_SECRET=your-very-secret-key-change-this
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=no-reply@reminderflow.app
NODE_ENV=development
PORT=3001
```

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Initialize Database

```bash
npm run migrate --workspace=backend
npm run seed --workspace=backend
```

### 4. Start Development Servers

```bash
npm run dev
```

Then open:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## Production Deployment

### Option 1: Deploy on Heroku

#### Backend

1. **Create Heroku app**
   ```bash
   heroku create reminderflow-api
   ```

2. **Add PostgreSQL addon**
   ```bash
   heroku addons:create heroku-postgresql:standard-0 --app reminderflow-api
   ```

3. **Set environment variables**
   ```bash
   heroku config:set \
     JWT_SECRET="your-production-secret" \
     SENDGRID_API_KEY="SG.xxx" \
     SENDGRID_FROM_EMAIL="no-reply@reminderflow.app" \
     NODE_ENV="production" \
     --app reminderflow-api
   ```

4. **Create Procfile** (`Procfile`):
   ```
   web: npm run build --workspace=backend && npm start --workspace=backend
   worker: npm run worker --workspace=backend
   ```

5. **Deploy**
   ```bash
   git push heroku main
   ```

6. **Run migrations**
   ```bash
   heroku run npm run migrate --workspace=backend --app reminderflow-api
   heroku run npm run seed --workspace=backend --app reminderflow-api
   ```

#### Frontend (Vercel)

1. **Connect repository to Vercel**
2. **Set build settings:**
   - Build Command: `npm run build --workspace=frontend`
   - Output Directory: `frontend/.next`
   - Environment: Set `NEXT_PUBLIC_API_URL` to your API URL

3. **Deploy**
   - Vercel will auto-deploy on push

### Option 2: Deploy on AWS (EC2 + RDS)

#### 1. RDS PostgreSQL Setup

```bash
# Create RDS instance in AWS Console
# Get endpoint: reminderflow-db.xxxx.rds.amazonaws.com
# Create database: reminderflow
```

#### 2. EC2 Instance Setup

```bash
# SSH into EC2 instance
ssh -i key.pem ec2-user@your-instance

# Update system
sudo yum update -y

# Install Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18

# Install PostgreSQL client
sudo yum install postgresql-devel -y

# Clone repository
git clone <repo-url>
cd reminderflow

# Install dependencies
npm install
```

#### 3. Configure Environment

```bash
# Create .env files
cat > backend/.env << 'EOF'
DATABASE_URL=postgresql://user:password@reminderflow-db.xxxx.rds.amazonaws.com:5432/reminderflow
JWT_SECRET=your-production-secret
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=no-reply@reminderflow.app
NODE_ENV=production
PORT=3001
EOF

cat > frontend/.env.local << 'EOF'
NEXT_PUBLIC_API_URL=https://api.reminderflow.com
EOF
```

#### 4. Run Migrations

```bash
npm run migrate --workspace=backend
npm run seed --workspace=backend
```

#### 5. Setup PM2 Process Manager

```bash
npm install -g pm2

# Start backend
pm2 start npm --name "reminderflow-api" -- run start --workspace=backend

# Start worker
pm2 start npm --name "reminderflow-worker" -- run worker --workspace=backend

# Save PM2 config
pm2 save

# Enable startup
pm2 startup
```

#### 6. Setup Frontend

```bash
# Build frontend
npm run build --workspace=frontend

# Use PM2 to serve or set up Nginx
pm2 start "npm start --workspace=frontend" --name "reminderflow-frontend"
```

#### 7. Setup Nginx Reverse Proxy

```bash
sudo yum install nginx -y

sudo tee /etc/nginx/conf.d/reminderflow.conf > /dev/null << 'EOF'
upstream backend {
    server 127.0.0.1:3001;
}

upstream frontend {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name api.reminderflow.com;

    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name reminderflow.com;

    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

sudo systemctl start nginx
sudo systemctl enable nginx
```

#### 8. SSL with Let's Encrypt

```bash
sudo yum install certbot python3-certbot-nginx -y

sudo certbot --nginx -d reminderflow.com -d api.reminderflow.com
```

### Option 3: Deploy with Docker

#### Create Docker Compose

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: reminderflow
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: reminderflow
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://reminderflow:${DB_PASSWORD}@postgres:5432/reminderflow
      JWT_SECRET: ${JWT_SECRET}
      SENDGRID_API_KEY: ${SENDGRID_API_KEY}
      SENDGRID_FROM_EMAIL: no-reply@reminderflow.app
      NODE_ENV: production
    ports:
      - "3001:3001"
    depends_on:
      - postgres

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    environment:
      NEXT_PUBLIC_API_URL: http://backend:3001
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
```

#### Backend Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY backend/package*.json ./

RUN npm install

COPY backend/src ./src
COPY backend/tsconfig.json ./

RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
```

#### Frontend Dockerfile

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY frontend/package*.json ./

RUN npm install

COPY frontend . .

RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["npm", "start"]
```

#### Deploy with Docker

```bash
docker-compose up -d
```

## Post-Deployment Checklist

### 1. Security

- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Enable HTTPS/SSL on all domains
- [ ] Set up firewall rules
- [ ] Enable database backups
- [ ] Configure CORS properly in backend

### 2. SendGrid

- [ ] Verify sender email domain
- [ ] Enable event webhooks (optional)
- [ ] Set up DKIM/SPF records
- [ ] Configure bounce handling

### 3. Monitoring

- [ ] Set up error logging (Sentry, LogRocket)
- [ ] Enable database monitoring
- [ ] Set up uptime monitoring
- [ ] Configure alerts

### 4. Database

- [ ] Enable automated backups
- [ ] Configure read replicas (optional)
- [ ] Set up connection pooling
- [ ] Monitor query performance

### 5. Email Worker

- [ ] Ensure worker process is running
- [ ] Monitor worker logs
- [ ] Set up restarts on failure
- [ ] Configure email retry logic

## Scaling Considerations

### Database
- Use connection pooling (pgBouncer)
- Enable read replicas for analytics
- Index frequently queried fields

### Email Worker
- Run multiple worker instances
- Use job queue (Bull, RabbitMQ) for production
- Implement rate limiting per organization

### Frontend
- Enable CDN caching
- Optimize images
- Use static site generation where possible

### Backend
- Load balance with multiple instances
- Cache frequently accessed data
- Use Redis for session management

## Troubleshooting

### Database Connection Issues

```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check logs
journalctl -u postgresql -n 50
```

### Email Not Sending

1. Check SendGrid API key
2. Verify sender domain SPF/DKIM
3. Check email queue status
4. Review worker logs
5. Check SendGrid Activity dashboard

### High Memory Usage

```bash
# Monitor Node.js processes
pm2 monit

# Restart processes
pm2 restart all
```

## Maintenance

### Regular Tasks

1. **Weekly**: Check email logs and queue status
2. **Monthly**: Review analytics and performance
3. **Quarterly**: Update dependencies
4. **Annually**: Security audit and penetration testing

### Backup Strategy

```bash
# Backup database
pg_dump $DATABASE_URL > backup.sql

# Restore from backup
psql $DATABASE_URL < backup.sql
```

## Support

For deployment issues:
1. Check logs: `pm2 logs` or `docker logs`
2. Review error messages
3. Consult AWS/Heroku documentation
4. Check SendGrid status page

---

Questions? Open an issue on GitHub or contact support@reminderflow.app
