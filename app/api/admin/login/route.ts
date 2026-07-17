import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { createToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const username = (formData.get('username') as string || '').trim();
    const password = formData.get('password') as string || '';

    if (!username || !password) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    const db = getDb();
    const user = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username) as any;

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const token = createToken(username);
    const response = NextResponse.json({ status: 'ok', redirect: '/admin/dashboard' });
    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 86400,
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
