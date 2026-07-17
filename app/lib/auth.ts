import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'keylogger-admin-secret-change-in-production';

export function createToken(username: string): string {
  return jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): { username: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { username: string };
  } catch {
    return null;
  }
}

export function getTokenFromRequest(req: NextRequest): string | null {
  const cookie = req.cookies.get('admin_token')?.value;
  return cookie || null;
}

export function requireAdmin(req: NextRequest): { username: string } | null {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  return verifyToken(token);
}
