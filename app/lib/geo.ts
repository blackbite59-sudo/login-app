export interface GeoResult {
  country: string;
  city: string;
  lat: number | null;
  lon: number | null;
}

export async function getGeolocation(ip: string): Promise<GeoResult> {
  if (!ip || ip === '0.0.0.0' || ip === '127.0.0.1' || ip === '::1') {
    return { country: 'Local', city: 'Localhost', lat: null, lon: null };
  }

  try {
    const resp = await fetch(`http://ip-api.com/json/${ip}?fields=country,city,lat,lon,status`, {
      signal: AbortSignal.timeout(3000),
    });
    const data = await resp.json();
    if (data?.status === 'success') {
      return {
        country: data.country || '',
        city: data.city || '',
        lat: data.lat ?? null,
        lon: data.lon ?? null,
      };
    }
  } catch {}

  return { country: 'Unknown', city: 'Unknown', lat: null, lon: null };
}

export function extractNameFromEmail(email: string): string {
  const local = email.split('@')[0] || '';
  const cleaned = local.replace(/[._]/g, ' ').replace(/\d+/g, '').trim();
  if (!cleaned) return 'User';
  return cleaned.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const ip = forwarded.split(',')[0].trim();
    if (ip) return ip;
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp;
  return '0.0.0.0';
}
