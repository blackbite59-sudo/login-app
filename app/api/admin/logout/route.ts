import { NextResponse } from 'next/server';

export async function GET() {
  const response = NextResponse.redirect(new URL('/admin/login', 'http://localhost'));
  response.cookies.set('admin_token', '', { httpOnly: true, path: '/', maxAge: 0 });
  return response;
}
