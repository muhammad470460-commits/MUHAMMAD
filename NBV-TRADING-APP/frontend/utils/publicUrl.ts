// Permanent Canonical Public URL for the deployed NBV Trading App on Cloud Run
export const CANONICAL_PUBLIC_APP_URL =
  'https://ais-pre-hwdb6vnrpe3xfmrlqtne4v-464566012313.asia-southeast1.run.app';

/**
 * Returns a guaranteed public HTTPS base URL that works on any external mobile device.
 * Never returns localhost or internal aistudio.google.com frames.
 */
export function getPublicBaseUrl(): string {
  if (typeof window === 'undefined') {
    return CANONICAL_PUBLIC_APP_URL;
  }
  const host = window.location.host;
  // If accessed from inside Google AI Studio editor iframe, googleusercontent, or local test
  if (
    host.includes('aistudio.google.com') ||
    host.includes('google.com') ||
    host.includes('googleusercontent.com') ||
    host.startsWith('localhost') ||
    host.startsWith('127.0.0.1')
  ) {
    return CANONICAL_PUBLIC_APP_URL;
  }
  // If accessed directly on ais-pre or custom domain, use current origin
  return window.location.origin.replace(/\/+$/, '');
}

/**
 * Generates standard public invitation link: https://DOMAIN/register?ref=CODE
 */
export function buildReferralUrl(referralCode: string): string {
  const base = getPublicBaseUrl();
  const cleanCode = encodeURIComponent((referralCode || 'NBV777').trim());
  return `${base}/register?ref=${cleanCode}`;
}

/**
 * Professional Urdu + English bilingual invitation text for WhatsApp and Android share
 */
export function buildShareMessage(referralCode: string): string {
  const link = buildReferralUrl(referralCode);
  return `✨ NBV Trading App میں شمولیت اختیار کریں اور روزانہ 12.5% منافع کمائیں!\n\n📈 Join NBV Trading App — Secure Online Global Market Platform!\n💰 Daily Profit: Up to 12.53%\n⏳ Duration: 90 Days\n🎁 My Referral Code: ${referralCode}\n\n👇 نیچے دیے گئے پبلک لنک سے براہ راست رجسٹر ہوں:\n${link}`;
}
