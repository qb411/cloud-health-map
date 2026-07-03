# AWS Health Map V1 - Setup Guide

Complete setup guide for the free Supabase-powered AWS Health Monitor.

## 🎯 Overview

This guide will help you set up the AWS Health Map V1 with:
- **Frontend**: React + TypeScript deployed to GitHub Pages (free)
- **Database**: Supabase PostgreSQL (free tier: 500MB, 2GB bandwidth)
- **Real-time**: Supabase subscriptions for live updates
- **Testing**: Comprehensive automation framework

## 📋 Prerequisites

1. **Node.js 18+** - [Download here](https://nodejs.org/)
2. **Python 3.11+** - [Download here](https://python.org/)
3. **Git** - [Download here](https://git-scm.com/)
4. **Supabase Account** - [Sign up free](https://supabase.com/)
5. **GitHub Account** - [Sign up free](https://github.com/) (for deployment)

## 🚀 Step-by-Step Setup

### Step 1: Clone and Navigate

```bash
git clone <your-repo-url>
cd cloud-health-map/versions/v1-free-supabase
```

### Step 2: Python Environment Setup

```bash
# Linux/Mac
./scripts/setup-python-env.sh

# Windows
scripts\setup-python-env.bat
```

This will:
- Create a Python virtual environment
- Install required Python packages
- Set up development tools

### Step 3: Node.js Dependencies

```bash
npm install
```

### Step 4: Supabase Project Setup

#### 4.1 Create Supabase Project
1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Click "New Project"
3. Choose organization and enter project details:
   - **Name**: `aws-health-map-v1`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
4. Wait for project creation (2-3 minutes)

#### 4.2 Get Project Credentials
1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **Anon public key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

#### 4.3 Configure Environment Variables
```bash
# Copy the environment template
cp .env.example .env.local

# Edit .env.local with your values
nano .env.local  # or use your preferred editor
```

Update `.env.local`:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 5: Database Setup

#### 5.1 Install Supabase CLI
```bash
npm install -g supabase
```

#### 5.2 Link to Your Project
```bash
supabase login
supabase link --project-ref your-project-id
```

#### 5.3 Run Database Migrations
```bash
supabase db push
```

This will create:
- `aws_health_events` table for RSS events
- `region_status` table for current region status
- `test_simulations` table for development testing
- Proper indexes and Row Level Security policies

### Step 6: Verify Setup

#### 6.1 Run Tests
```bash
# Full test suite
npm run test

# Individual test categories
npm run test:unit
npm run test:integration
npm run test:e2e
```

#### 6.2 Start Development Server
```bash
npm run dev
```

Visit `http://localhost:5173` to see your application.

#### 6.3 Check Database Connection
Look for the green dot next to "Database connected" in the UI.

## 🚀 Deployment to GitHub Pages

### Step 1: Configure Repository
1. Push your code to GitHub
2. Go to repository **Settings** → **Pages**
3. Set source to "GitHub Actions"

### Step 2: Deploy
```bash
npm run deploy
```

Your app will be available at: `https://yourusername.github.io/cloud-health-map/`

## 🧪 Testing Framework

### Available Test Commands
```bash
npm run test              # Full CI/CD test suite
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only
npm run test:e2e          # End-to-end tests only
npm run validate          # Quick validation
```

### Browser Test Runner
Visit: `http://localhost:5173/tests/test-runner.html`

## 🔧 Configuration Options

### Environment Variables
```env
# Required
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional
VITE_APP_ENV=development
VITE_DEBUG_MODE=true
VITE_AWS_RSS_URL=https://status.aws.amazon.com/rss/all.rss
VITE_CORS_PROXY_URL=https://api.allorigins.win/get?url=
VITE_REFRESH_INTERVAL_NORMAL=600000
VITE_REFRESH_INTERVAL_ERROR=300000
VITE_MAX_EVENTS_DISPLAY=50
```

### Supabase Free Tier Limits
- **Database**: 500MB storage
- **Bandwidth**: 2GB/month
- **Real-time**: Unlimited connections
- **API Requests**: Unlimited

## 🐛 Troubleshooting

### Common Issues

#### 1. Database Connection Failed
- Check `.env.local` has correct Supabase URL and key
- Verify Supabase project is active
- Check network connectivity

#### 2. Build Errors
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 3. Migration Errors
```bash
# Reset local database
supabase db reset

# Push migrations again
supabase db push
```

#### 4. Python Environment Issues
```bash
# Remove and recreate virtual environment
rm -rf venv
./scripts/setup-python-env.sh
```

### Getting Help

1. **Check Logs**: Look at browser console and network tab
2. **Test Database**: Run `npm run test:integration`
3. **Verify Environment**: Check all environment variables are set
4. **Supabase Dashboard**: Check project status and logs

## 📊 Monitoring and Maintenance

### Database Usage Monitoring
1. Go to Supabase Dashboard → **Settings** → **Usage**
2. Monitor storage and bandwidth usage
3. Set up alerts for approaching limits

### Performance Optimization
- Events older than 7 days are automatically cleaned up
- Database queries are optimized with proper indexing
- Real-time subscriptions are limited to prevent overuse

## 🔄 Updating

### Update Dependencies
```bash
npm update
pip install -r requirements.txt --upgrade
```

### Update Database Schema
1. Create new migration file in `supabase/migrations/`
2. Run `supabase db push`

## 🎉 Success!

Your AWS Health Map V1 is now running with:
- ✅ Free Supabase database with real-time updates
- ✅ GitHub Pages deployment
- ✅ Comprehensive testing framework
- ✅ Professional monitoring capabilities

The application will automatically:
- Fetch AWS RSS feeds every 10 minutes
- Store events in your Supabase database
- Update all connected clients in real-time
- Handle simulations for testing purposes

Enjoy monitoring AWS health status with zero ongoing costs!