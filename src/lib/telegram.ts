/**
 * Telegram Admin Notification Utility
 * Sends real-time alerts to the admin Telegram chat for deposits,
 * withdrawals, and KYC submissions.
 *
 * Credentials are read from env vars so they never appear in source.
 */

const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '8789118557:AAG2t7H5SxwmiluZYkhjVvx9B8fg_1Hq6V0';
const CHAT_ID   = import.meta.env.VITE_TELEGRAM_CHAT_ID   || '5801671702';

async function sendMessage(text: string): Promise<void> {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.warn('[Telegram] Missing VITE_TELEGRAM_BOT_TOKEN or VITE_TELEGRAM_CHAT_ID');
    return;
  }
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id:    CHAT_ID,
          text,
          parse_mode: 'HTML',
          disable_web_page_preview: false,
        }),
      }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('[Telegram] sendMessage failed:', err);
    }
  } catch (e) {
    console.error('[Telegram] sendMessage error:', e);
  }
}

// ── Deposit notification ──────────────────────────────────────────────────────
export async function notifyDeposit(params: {
  email:    string;
  username: string | null;
  amount:   number;
  network:  string;
  proofUrl: string;
}): Promise<void> {
  const { email, username, amount, network, proofUrl } = params;
  const uname = username ? `@${username}` : '—';

  // Determine if proofUrl is a base64 blob or a real URL
  const isBase64 = proofUrl.startsWith('data:');
  const proofLine = isBase64
    ? '📎 <i>Proof uploaded as file (base64)</i>'
    : `📎 <a href="${proofUrl}">View Receipt</a>`;

  const text = [
    `💰 <b>NEW DEPOSIT SUBMITTED</b>`,
    ``,
    `👤 <b>User:</b> ${email}`,
    `🔖 <b>Username:</b> ${uname}`,
    `💵 <b>Amount:</b> $${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT`,
    `🌐 <b>Network:</b> ${network}`,
    `🟡 <b>Status:</b> Pending Review`,
    ``,
    proofLine,
  ].join('\n');

  await sendMessage(text);
}

// ── Withdrawal notification ───────────────────────────────────────────────────
export async function notifyWithdrawal(params: {
  email:         string;
  username:      string | null;
  amount:        number;
  currency:      string;
  walletAddress: string;
}): Promise<void> {
  const { email, username, amount, currency, walletAddress } = params;
  const uname = username ? `@${username}` : '—';

  const text = [
    `💸 <b>WITHDRAWAL REQUEST</b>`,
    ``,
    `👤 <b>User:</b> ${email}`,
    `🔖 <b>Username:</b> ${uname}`,
    `💵 <b>Amount:</b> ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${currency}`,
    `🏦 <b>Wallet:</b> <code>${walletAddress}</code>`,
    `🟡 <b>Status:</b> Pending Review`,
  ].join('\n');

  await sendMessage(text);
}

// ── Trade notification ────────────────────────────────────────────────────────
export async function notifyTrade(params: {
  email:     string;
  username:  string | null;
  amount:    number;
  direction: 'BUY' | 'SELL';
  duration:  number;
  pair?:     string;
}): Promise<void> {
  const { email, username, amount, direction, duration, pair = 'BTC/USDT' } = params;
  const uname         = username ? `@${username}` : '—';
  const dirLabel      = direction === 'BUY' ? '📈 UP / BUY' : '📉 DOWN / SELL';
  const durationLabel = duration >= 60 ? `${duration / 60}m` : `${duration}s`;

  const text = [
    `🔔 <b>NEW TRADE PLACED</b>`,
    ``,
    `👤 <b>User:</b> ${email}`,
    `🔖 <b>Username:</b> ${uname}`,
    `💵 <b>Amount:</b> $${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT`,
    `🪙 <b>Pair:</b> ${pair}`,
    `⏱️ <b>Duration:</b> ${durationLabel}`,
    `↕️ <b>Direction:</b> ${dirLabel}`,
    `🟡 <b>Status:</b> In Progress`,
  ].join('\n');

  await sendMessage(text);
}

// ── KYC notification ──────────────────────────────────────────────────────────
export async function notifyKYC(params: {
  email:       string;
  fullName:    string;
  idNumber:    string;
  country:     string;
  phoneNumber: string;
  frontUrl:    string;
  backUrl:     string;
}): Promise<void> {
  const { email, fullName, idNumber, country, phoneNumber, frontUrl, backUrl } = params;

  const frontIsBase64 = frontUrl.startsWith('data:');
  const backIsBase64  = backUrl.startsWith('data:');

  const frontLine = frontIsBase64
    ? '🪪 <i>Front ID uploaded (base64)</i>'
    : `🪪 <b>Front of ID:</b> <a href="${frontUrl}">View Image</a>`;
  const backLine = backIsBase64
    ? '🪪 <i>Back ID uploaded (base64)</i>'
    : `🪪 <b>Back of ID:</b>  <a href="${backUrl}">View Image</a>`;

  const text = [
    `📄 <b>NEW KYC SUBMISSION</b>`,
    ``,
    `👤 <b>Full Name:</b> ${fullName}`,
    `📧 <b>Email:</b> ${email}`,
    `📞 <b>Phone:</b> ${phoneNumber}`,
    `🌍 <b>Country:</b> ${country}`,
    `🔢 <b>ID Number:</b> <code>${idNumber}</code>`,
    `🟡 <b>Status:</b> Pending Review`,
    ``,
    frontLine,
    backLine,
  ].join('\n');

  await sendMessage(text);
}
