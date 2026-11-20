import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';

export const ADMIN_COOKIE_NAME = 'birthday_admin_token';
export const PROGRESS_COOKIE_NAME = 'birthday_gate_progress';

const FALLBACK_SECRET = crypto
  .createHash('sha256')
  .update(process.env.ADMIN_PASSWORD || 'romantic-birthday-dev-secret')
  .digest('hex');

function getJwtSecret(): string {
  return process.env.JWT_SECRET && process.env.JWT_SECRET.trim().length > 0
    ? process.env.JWT_SECRET.trim()
    : FALLBACK_SECRET;
}

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.trim().length > 0
    ? process.env.ADMIN_PASSWORD.trim()
    : 'love2026';
}

export function signAdminToken(): string {
  return jwt.sign({ role: 'admin', iat: Math.floor(Date.now() / 1000) }, getJwtSecret(), {
    expiresIn: '7d',
  });
}

export function verifyAdminToken(token: string): boolean {
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    return typeof decoded === 'object' && decoded !== null && decoded.role === 'admin';
  } catch {
    return false;
  }
}

export interface GateProgressPayload {
  gate1Passed: boolean;
  gate2Passed: boolean;
}

export function signProgressToken(progress: GateProgressPayload): string {
  return jwt.sign(
    {
      gate1Passed: Boolean(progress.gate1Passed),
      gate2Passed: Boolean(progress.gate2Passed),
    },
    getJwtSecret(),
    { expiresIn: '30d' }
  );
}

export function verifyProgressToken(token?: string): GateProgressPayload {
  if (!token) return { gate1Passed: false, gate2Passed: false };
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    if (typeof decoded === 'object' && decoded !== null) {
      return {
        gate1Passed: Boolean((decoded as GateProgressPayload).gate1Passed),
        gate2Passed: Boolean((decoded as GateProgressPayload).gate2Passed),
      };
    }
    return { gate1Passed: false, gate2Passed: false };
  } catch {
    return { gate1Passed: false, gate2Passed: false };
  }
}

// Sliding window rate limiter for login attempts
const loginAttempts = new Map<string, number[]>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

export function checkLoginRateLimit(ip: string): { allowed: boolean; retryAfterSec?: number } {
  const now = Date.now();
  const timestamps = (loginAttempts.get(ip) || []).filter((ts) => now - ts < WINDOW_MS);
  if (timestamps.length >= MAX_ATTEMPTS) {
    const oldest = timestamps[0];
    const retryAfterSec = Math.ceil((WINDOW_MS - (now - oldest)) / 1000);
    loginAttempts.set(ip, timestamps);
    return { allowed: false, retryAfterSec };
  }
  return { allowed: true };
}

export function recordFailedLogin(ip: string): void {
  const now = Date.now();
  const timestamps = (loginAttempts.get(ip) || []).filter((ts) => now - ts < WINDOW_MS);
  timestamps.push(now);
  loginAttempts.set(ip, timestamps);
}

export function clearFailedLogins(ip: string): void {
  loginAttempts.delete(ip);
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.[ADMIN_COOKIE_NAME];
  if (!token || !verifyAdminToken(token)) {
    res.status(401).json({ error: 'Unauthorized. Please sign in as admin.' });
    return;
  }
  next();
}
