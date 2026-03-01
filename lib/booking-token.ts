// Generación y verificación de tokens HMAC para acciones de booking (magic links)
import crypto from 'crypto';

const SECRET =
  process.env.BOOKING_ACTION_SECRET ||
  process.env.ADMIN_SECRET_KEY ||
  'fallback-dev-secret';

export function generateActionToken(
  bookingId: string | number,
  action: 'confirm' | 'reject'
): string {
  return crypto
    .createHmac('sha256', SECRET)
    .update(`${bookingId}:${action}`)
    .digest('base64url');
}

export function verifyActionToken(
  bookingId: string | number,
  action: string,
  token: string
): boolean {
  if (!['confirm', 'reject'].includes(action)) return false;
  try {
    const expected = generateActionToken(bookingId, action as 'confirm' | 'reject');
    const expectedBuf = Buffer.from(expected);
    const tokenBuf = Buffer.from(token);
    if (expectedBuf.length !== tokenBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, tokenBuf);
  } catch {
    return false;
  }
}
