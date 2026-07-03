# Local Development Guide - AWS Health Map V1

Complete guide for local development using Supabase local environment and Python virtual environment.

## 🎯 Why Local Development?

- **🔒 No external dependencies** - Everything runs on your machine
- **⚡ Faster iteration** - No network delays or API limits
- **🧪 Safe testing** - No risk of affecting production data
- **💰 Zero costs** - No usage of free tier limits during development
- **🔄 Easy reset** - Can reset database anytime

## 🛠️ Local Setup Steps

### Step 1: Python Environment Setup

```bash
cd versions/v1-free-supabase

# Linux/Mac
./scripts/setup-python-env.sh

# Windows
scripts\setup-python-env.bat

# Activate the virtual environment
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate     # Windows
```

### Step 2: Install Node.js Dependencies

```bash
npm install
```

### Step 3: Install Supabase CLI

```bash
npm install -g supabase
```

### Step 4: Start Local Supabase

```bash
# Initialize Supabase (if not already done)
supabase init

# Start local Supabase stack
supabase start
```

This will start:
- **PostgreSQL Database** on `localhost:54322`
- **Supabase Studio** on `http://localhost:54323`
- **API Server** on `http://localhost:54321`
- **Real-time Server** for subscriptions

### Step 5: Configure Local Environment

Create `.env.local` for local development:

```env
# Local Supabase configuration
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

# Development settings
VITE_APP_ENV=development
VITE_DEBUG_MODE=true
```

### Step 6: Run Database Migrations

```bash
# Apply migrations to local database
supabase db reset
```

### Step 7: Start Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` - your app is now running completely locally!

## 🧪 Local Testing

### Run All Tests Locally
```bash
# Full test suite
npm run test

# Individual categories
npm run test:unit
npm run test:integration
npm run test:e2e
```

### Access Local Supabase Studio
Visit `http://localhost:54323` to:
- View database tables and data
- Run SQL queries
- Monitor real-time subscriptions
- Check API logs

### Test Real-time Features
1. Open multiple browser tabs
2. Create test simulations in one tab
3. Watch real-time updates in other tabs

## 🔄 Development Workflow

### Daily Development
```bash
# Start your development session
source venv/bin/activate  # Activate Python env
supabase start           # Start local Supabase
npm run dev             # Start frontend

# When done
supabase stop           # Stop Supabase services
deactivate             # Deactivate Python env
```

### Reset Database
```bash
supabase db reset  # Resets to clean state with migrations
```

### View Logs
```bash
supabase logs        # View all service logs
supabase logs api    # View API logs only
supabase logs db     # View database logs only
```

## 🚀 Deploy When Ready

### Option A: Deploy to Production Supabase + GitHub Pages
1. Create production Supabase project
2. Update `.env.local` with production credentials
3. Run `npm run deploy`

### Option B: Keep Using Local for Demo
- Perfect for development and testing
- Can demo to others on your local network
- No external dependencies or costs

## 🎯 Benefits of This Approach

### For Development
- **Instant feedback** - No network delays
- **Unlimited testing** - No API rate limits
- **Full control** - Can modify database schema easily
- **Debugging** - Full access to logs and database

### For Testing
- **Isolated environment** - Tests don't affect production
- **Consistent state** - Can reset database between test runs
- **Fast execution** - No network overhead
- **Complete coverage** - Can test all features including real-time

### For Demos
- **Reliable** - No internet dependency
- **Fast** - Everything runs locally
- **Customizable** - Can pre-populate with demo data
- **Professional** - Full feature set available

## 🔧 Advanced Local Development

### Custom Test Data
```sql
-- Connect to local database and add test data
-- Access via Supabase Studio at http://localhost:54323

INSERT INTO aws_health_events (guid, title, description, pub_date, region_code, status) VALUES
('demo-1', 'Demo Issue in us-east-1', 'This is a demo issue for testing', NOW(), 'us-east-1', 'issue'),
('demo-2', 'Demo Outage in eu-west-1', 'This is a demo outage for testing', NOW(), 'eu-west-1', 'outage');
```

### Python Scripts for Data Management
```python
# Example: scripts/populate_demo_data.py
import os
from supabase import create_client, Client

url = "http://127.0.0.1:54321"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
supabase: Client = create_client(url, key)

# Add demo data
demo_events = [
    {
        "guid": "demo-event-1",
        "title": "Demo Service Issue in US East",
        "description": "Simulated service degradation for testing",
        "pub_date": "2024-09-27T10:00:00Z",
        "region_code": "us-east-1",
        "status": "issue"
    }
]

result = supabase.table("aws_health_events").insert(demo_events).execute()
print(f"Inserted {len(result.data)} demo events")
```

## 🎉 Ready for Production

When you're satisfied with local development:

1. **Create production Supabase project**
2. **Update environment variables**
3. **Deploy to GitHub Pages**
4. **Monitor usage in Supabase dashboard**

This approach gives you the best development experience with zero external dependencies and costs during development!