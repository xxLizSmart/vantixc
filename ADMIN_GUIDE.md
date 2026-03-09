# Admin Panel Guide

## Accessing the Admin Panel

When logged in as an admin user, you'll see an "Admin Panel" link in the navigation menu. Click it to access the admin dashboard.

## Admin Features

### 1. Users Tab
- View all registered users
- Edit user balances for BTC, ETH, USDC, USDT, XRP, and SOL
- See admin status for each user

### 2. Trades Tab
- Monitor all user trades in real-time
- View trade details: user, type (BUY/SELL), amount, and outcome
- Control trade outcomes (Normal, Force All Wins, Force All Losses)

### 3. Deposits Tab
- Review pending deposit requests
- View deposit amount, network, and proof
- Approve or reject deposits
- Approved deposits automatically credit user accounts

### 4. Withdrawals Tab
- Review pending withdrawal requests
- View withdrawal amount, currency, and wallet address
- Approve or reject withdrawals
- Rejected withdrawals automatically refund user accounts

### 5. KYC Tab
- Review pending KYC verification requests
- View user submitted information:
  - Full name, phone number, country
  - Full address and ID number
  - Front and back ID photos
- Approve or reject KYC requests
- Approved KYC automatically updates user verification status

### 6. Settings Tab
- Configure trade settings for different durations (30s - 210s)
- Set minimum capital requirements
- Adjust win and loss percentages

## Making a User an Admin

To grant admin access to a user, run this SQL query in your Supabase dashboard:

```sql
UPDATE profiles
SET is_admin = true
WHERE username = 'USERNAME_HERE';
```

Or by user ID:

```sql
UPDATE profiles
SET is_admin = true
WHERE id = 'USER_ID_HERE';
```

## Security Notes

- Only users with `is_admin = true` in the profiles table can access the admin panel
- Admin actions are protected by Row Level Security (RLS) policies
- All admin operations are logged and auditable
- Non-admin users attempting to access the panel will see "Access Denied"
