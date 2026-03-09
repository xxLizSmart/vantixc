# Exeness Trading Platform - Setup Guide

Welcome to Exeness Trading Platform! This guide will help you set up and configure the platform.

## Latest Enhancements

### New Visual Features
- **Live Price Ticker**: Real-time crypto price updates scrolling at the top
- **Particle Background**: Animated particle network with connecting lines
- **Confetti Effects**: Celebration animation on winning trades
- **Trading Statistics**: Personal trading metrics dashboard showing total trades, win rate, P&L, and best trade
- **Leaderboard**: Top 10 traders ranked by total assets with special badges
- **Notifications**: Toast-style notifications for trade outcomes
- **Enhanced Animations**: Smooth transitions, hover effects, and gradient backgrounds throughout
- **Grid Overlay**: Subtle grid pattern on landing page hero section
- **Glowing Buttons**: Shadow effects and rotating icons on interactive elements
- **Sticky Navigation**: Fixed navigation bar with live price ticker

### User Experience Improvements
- **Auto-refreshing Data**: Trading stats and leaderboard update automatically
- **Visual Feedback**: Instant notifications for all trading outcomes
- **Responsive Design**: All new components work seamlessly on all devices
- **Premium Feel**: Gradient effects, shadows, and micro-animations throughout

## Features Implemented

### Core Pages
- **Landing Page**: Beautiful animated homepage with features, FAQ, and call-to-action
- **Dashboard**: User portfolio overview with asset balances and transaction history
- **Trading Page**: Real-time crypto trading with TradingView charts and 7 duration options (30s-210s)
- **KYC Verification**: Complete identity verification system with document upload
- **Deposit Page**: Multi-network crypto deposits (TRC20, ERC20, ETH) with proof upload
- **Withdraw Page**: Secure withdrawals for USDT, ETH, USDC, and BTC
- **Coin Swapper**: Instant cryptocurrency exchange between supported coins
- **Profile Page**: User settings with avatar upload and username customization
- **Admin Panel**: Complete administrative control with multiple management tabs

### Key Features
- Multi-language support (16 languages including English, Spanish, French, Chinese, Korean, Japanese, etc.)
- Multi-currency display (15 major currencies with automatic conversion)
- Real-time TradingView charts integration
- Secure authentication with Supabase
- File upload system for KYC, deposits, and avatars
- Comprehensive transaction tracking
- Admin controls for deposits, withdrawals, KYC approvals, trade settings, and user management

### Trading System
- **BUY/SELL** trading options
- **7 Duration Options**: 30s, 60s, 90s, 120s, 150s, 180s, 210s
- **Configurable Win/Loss Percentages** (admin can modify)
- **Minimum Capital Requirements** per duration
- **Real-time Trade Execution** with live chart display
- **Trade History Tracking**

## Initial Setup

### 1. Storage Bucket Setup

You need to create a storage bucket in Supabase for file uploads:

1. Go to your Supabase Dashboard → Storage
2. Create a new bucket called **"documents"**
3. Make it **public**
4. The bucket will store:
   - KYC verification documents
   - Deposit proof images
   - User avatars

### 2. Create Admin User

To create your first admin user, follow these steps:

1. Sign up for a new account through the platform
2. Go to your Supabase Dashboard → SQL Editor
3. Run this query (replace with your user's email):

```sql
-- Make a user an admin
UPDATE profiles
SET is_admin = true
WHERE id = (
  SELECT id FROM auth.users
  WHERE email = 'your-admin-email@example.com'
);
```

Alternatively, you can update the profile directly using the user's ID:

```sql
UPDATE profiles
SET is_admin = true
WHERE id = 'user-uuid-here';
```

### 3. Give Initial Funds (Optional for Testing)

To add test funds to a user account:

```sql
UPDATE profiles
SET
  usdt_balance = 10000,
  btc_balance = 1,
  eth_balance = 10,
  usdc_balance = 5000
WHERE id = 'user-uuid-here';
```

## Platform Usage

### For Users

1. **Sign Up**: Create an account with email and password
2. **Complete KYC**: Submit verification documents (takes 3-6 hours for review)
3. **Deposit Funds**: Send crypto to provided wallet addresses with proof
4. **Start Trading**: Choose duration, amount, and BUY/SELL direction
5. **Withdraw Profits**: Request withdrawals to your wallet

### For Admins

The Admin Panel provides complete control over:

1. **User Management**
   - View all users
   - Edit user balances for all cryptocurrencies
   - Monitor user activity

2. **Trade Control**
   - View all trades
   - Set trade outcomes (Normal, Win All, Lose All)
   - Monitor trading activity

3. **Deposit Management**
   - Review deposit requests
   - View payment proofs
   - Approve or reject deposits

4. **Withdrawal Management**
   - Review withdrawal requests
   - Approve or reject withdrawals
   - Monitor wallet addresses

5. **KYC Management**
   - Review identity documents
   - View user information
   - Approve or reject verifications

6. **Trade Settings**
   - Modify win percentages for each duration
   - Modify loss percentages for each duration
   - Adjust minimum capital requirements

## Wallet Addresses

The platform uses these wallet addresses for deposits:

- **USDT TRC20**: TKXd6PzVVCGCs4h3SvJCD9fWfVwgurrr95
- **ETH, USDC, ERC20**: 0x68Da8dc93E7cd2f1d1D73AdA266Cb9849Dc16e5a

## Trade Duration Settings

Default settings (admin can modify):

| Duration | Min Capital | Win % | Loss % |
|----------|-------------|-------|--------|
| 30s      | 100 USDT    | 20%   | 70%    |
| 60s      | 1000 USDT   | 25%   | 70%    |
| 90s      | 5000 USDT   | 30%   | 70%    |
| 120s     | 7000 USDT   | 35%   | 70%    |
| 150s     | 10000 USDT  | 40%   | 70%    |
| 180s     | 20000 USDT  | 45%   | 70%    |
| 210s     | 50000 USDT  | 50%   | 70%    |

## Security Features

- Row Level Security (RLS) enabled on all tables
- Secure authentication with Supabase
- File upload restrictions by folder and user
- Admin-only access controls
- Encrypted password storage
- Protected API endpoints

## Design

- **Dark Theme**: #474646 background with elegant gold accents
- **Color Scheme**: White, Gray, and Gold for premium look
- **Fully Responsive**: Works on mobile, tablet, and desktop
- **Smooth Animations**: Fade-ins, slide-ups, and transitions throughout
- **Professional UI**: Clean, modern, and production-ready

## Support

For questions or issues:
- Check user transaction history in Dashboard
- Review admin panel for pending actions
- Ensure storage bucket is properly configured
- Verify environment variables are set correctly

---

**Exeness Trading Platform** - The Future of Crypto Trading
