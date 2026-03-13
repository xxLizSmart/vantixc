# Database Setup Guide

## Quick Setup (5 minutes)

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in / create an account
2. Click **New Project**
3. Enter project name: `vantixc`
4. Set a database password (save it somewhere safe)
5. Choose a region close to your users
6. Click **Create new project** and wait ~2 minutes

### 2. Get your credentials

1. Go to your project dashboard → **Settings** → **API**
2. Copy:
   - **Project URL** (e.g. `https://xxxxxxxxxxxx.supabase.co`)
   - **anon public** key (under Project API keys)

### 3. Configure environment

Edit `.env.local` in the project root:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run the database migration

Option A — Supabase Dashboard (recommended):
1. Go to your project dashboard → **SQL Editor**
2. Click **New query**
3. Copy the contents of `supabase/migrations/20260309000000_complete_schema_aligned.sql`
4. Paste into the SQL editor and click **Run**

Option B — Supabase CLI:
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project (find project-ref in Settings → General)
supabase link --project-ref your-project-ref

# Push the migration
supabase db push
```

### 5. Create your first admin user

1. Sign up through the app at `/auth`
2. Go to your Supabase dashboard → **SQL Editor**
3. Run:

```sql
UPDATE profiles
SET is_admin = true
WHERE id = (
  SELECT id FROM auth.users
  WHERE email = 'your-admin-email@example.com'
);
```

### 6. Restart the dev server

The dev server will automatically reload when `.env.local` changes.
If not, restart:
```bash
npm run dev
```

---

## What the migration creates

- **profiles** — User accounts with crypto balances (BTC, ETH, USDC, USDT, XRP, SOL)
- **kyc_verifications** — Identity verification documents
- **deposits** — Deposit requests with admin approval workflow
- **withdrawals** — Withdrawal requests with admin approval workflow
- **trades** — Binary options trading records
- **trade_settings** — Configurable win/loss percentages per duration (30-210s)
- **crypto_prices** — Live price data for the ticker
- **transactions** — Full audit ledger
- **wallets** — Multi-currency wallet records
- **user_settings** — Per-user preferences
- Row Level Security on all tables
- Automatic profile creation on user signup (trigger)
- Seed data: 8 crypto prices, 7 trade duration settings
