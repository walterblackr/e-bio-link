// Generación y verificación de tokens HMAC para acciones de booking (magic links)
import crypto from 'crypto';

const SECRET = process.env.BOOKING_ACTION_SECRET || process.env.ADMIN_SECRET_KEY;
if (!SECRET) {
  throw new Error('BOOKING_ACTION_SECRET (o ADMIN_SECRET_KEY) debe estar definido en las variables de entorno');
}

const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 días

export function generateActionToken(
  bookingId: string | number,
  action: 'confirm' | 'reject'
): { token: string; ts: number } {
  const ts = Math.floor(Date.now() / 1000);
  const token = crypto
    .createHmac('sha256', SECRET!)
    .update(`${bookingId}:${action}:${ts}`)
    .digest('base64url');
  return { token, ts };
}

export function verifyActionToken(
  bookingId: string | number,
  action: string,
  token: string,
  ts: number
): boolean {
  if (!['confirm', 'reject'].includes(action)) return false;
  const age = Math.floor(Date.now() / 1000) - ts;
  if (age > TOKEN_TTL_SECONDS || age < 0) return false;
  try {
    const expected = crypto
      .createHmac('sha256', SECRET!)
      .update(`${bookingId}:${action}:${ts}`)
      .digest('base64url');
    const expectedBuf = Buffer.from(expected);
    const tokenBuf = Buffer.from(token);
    if (expectedBuf.length !== tokenBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, tokenBuf);
  } catch {
    return false;
  }
}
