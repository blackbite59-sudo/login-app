'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    try {
      const res = await fetch('/api/admin/login', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        router.push('/admin/dashboard');
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#111',
      fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
    }}>
      <div style={{
        background: '#1a1a1a',
        borderRadius: 16,
        padding: 48,
        width: 400,
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, background: '#1a73e8',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </div>
          <h1 style={{ color: '#e8eaed', fontSize: 24, fontWeight: 500, margin: 0 }}>Admin Panel</h1>
          <p style={{ color: '#9aa0a6', fontSize: 14, marginTop: 4 }}>Enter your credentials</p>
        </div>

        {error && (
          <div style={{
            background: '#5f2121', color: '#f28b82', padding: '10px 16px',
            borderRadius: 8, fontSize: 13, marginBottom: 20, textAlign: 'center',
          }}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ color: '#9aa0a6', fontSize: 13, display: 'block', marginBottom: 6 }}>Username</label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              style={{
                width: '100%', height: 48, borderRadius: 10, border: '1px solid #333',
                background: '#222', color: '#e8eaed', padding: '0 16px', fontSize: 15, outline: 'none', boxSizing: 'border-box',
              }}
              placeholder="admin"
              required
              autoFocus
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ color: '#9aa0a6', fontSize: 13, display: 'block', marginBottom: 6 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{
                width: '100%', height: 48, borderRadius: 10, border: '1px solid #333',
                background: '#222', color: '#e8eaed', padding: '0 16px', fontSize: 15, outline: 'none', boxSizing: 'border-box',
              }}
              placeholder="admin123"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', height: 48, borderRadius: 999, border: 'none',
              background: loading ? '#444' : '#1a73e8', color: '#fff',
              fontSize: 15, fontWeight: 500, cursor: loading ? 'default' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
