#!/bin/bash

# ReminderFlow Setup Script
# This script helps set up the development environment

set -e

echo "🚀 ReminderFlow Setup"
echo "===================="
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm"
    exit 1
fi

if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL client is not installed. You'll need PostgreSQL running."
    echo "   Install PostgreSQL or Docker to run the database locally."
fi

NODE_VERSION=$(node -v)
echo "✓ Node.js $NODE_VERSION"
echo "✓ npm $(npm -v)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✓ Dependencies installed"
echo ""

# Setup backend environment
echo "⚙️  Setting up backend..."
if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    echo "✓ Created backend/.env (please update with your values)"
else
    echo "✓ backend/.env already exists"
fi
echo ""

# Setup frontend environment
echo "⚙️  Setting up frontend..."
if [ ! -f "frontend/.env.local" ]; then
    cp frontend/.env.example frontend/.env.local
    echo "✓ Created frontend/.env.local"
else
    echo "✓ frontend/.env.local already exists"
fi
echo ""

# Database setup prompt
echo "🗄️  Database Setup"
echo "=================="
echo ""
echo "ReminderFlow requires PostgreSQL. You have two options:"
echo ""
echo "1. Use Docker (recommended for development)"
echo "   - Install Docker from https://www.docker.com"
echo "   - Run: docker run -d --name reminderflow-db -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:15"
echo ""
echo "2. Use existing PostgreSQL instance"
echo "   - Update DATABASE_URL in backend/.env"
echo "   - Make sure the database exists"
echo ""

# Attempt to detect PostgreSQL
if command -v psql &> /dev/null; then
    read -p "Would you like to initialize the database now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Running migrations..."
        npm run migrate --workspace=backend
        echo ""
        echo "Seeding demo data..."
        npm run seed --workspace=backend
        echo "✓ Database initialized with demo data"
        echo ""
    fi
fi

echo "✅ Setup Complete!"
echo ""
echo "Next steps:"
echo "==========="
echo ""
echo "1. Update environment variables (if needed):"
echo "   - backend/.env (DATABASE_URL, JWT_SECRET, SENDGRID_API_KEY)"
echo "   - frontend/.env.local (NEXT_PUBLIC_API_URL)"
echo ""
echo "2. Start development servers:"
echo "   npm run dev"
echo ""
echo "3. Open in browser:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend: http://localhost:3001"
echo ""
echo "4. Demo Account (after seeding):"
echo "   - Email: admin@techacademy.com"
echo "   - Password: Demo123!"
echo ""
echo "📖 For more information, see README.md"
echo ""
