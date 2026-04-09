'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { generatePublicToken } from '@/hooks/useDaily';

const DailyVideoRoom = dynamic(() => import('@/components/DailyVideoRoom'), { ssr: false });

interface Props {
  params: { eventId: string };
}

interface TokenInfo {
  token: string;
  roomUrl: string;
}

export default function PublicJoinPage({ params }: Props) {
  const [displayName, setDisplayName] = useState('');
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [left, setLeft] = useState(false);

  const join = async () => {
    if (!displayName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const { token, roomName } = await generatePublicToken(params.eventId, displayName.trim());
      setTokenInfo({ token, roomUrl: `https://daily.co/${roomName}` });
    } catch (err: any) {
      setError(err.message || 'Failed to join. The room may not be available.');
    } finally {
      setLoading(false);
    }
  };

  if (left) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <span style={{ fontSize: '3rem' }}>👋</span>
          <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#e0e0f0' }}>You've left the meeting</h2>
          <p style={{ color: '#a0a0c0', margin: 0, textAlign: 'center' }}>
            Thanks for joining! You can close this tab.
          </p>
          <button onClick={() => { setLeft(false); setTokenInfo(null); }} style={btnStyle}>
            Rejoin Room
          </button>
        </div>
      </div>
    );
  }

  if (tokenInfo) {
    return (
      <DailyVideoRoom
        roomUrl={tokenInfo.roomUrl}
        token={tokenInfo.token}
        isOwner={false}
        onLeave={() => setLeft(true)}
      />
    );
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: '2rem' }}>📹</span>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.4rem', color: '#e0e0f0', fontWeight: 700 }}>
              Join Meeting
            </h1>
            <p style={{ margin: 0, color: '#a0a0c0', fontSize: '0.85rem' }}>
              Powered by ReminderFlow
            </p>
          </div>
        </div>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '12px 0' }} />

        <label style={labelStyle}>Your Name</label>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && join()}
          placeholder="Enter your name…"
          style={inputStyle}
          autoFocus
        />

        {error && (
          <p style={{ color: '#f87171', fontSize: '0.85rem', margin: '4px 0 0', textAlign: 'center' }}>
            {error}
          </p>
        )}

        <button onClick={join} disabled={!displayName.trim() || loading} style={{
          ...btnStyle,
          opacity: !displayName.trim() || loading ? 0.6 : 1,
          cursor: !displayName.trim() || loading ? 'not-allowed' : 'pointer',
        }}>
          {loading ? 'Connecting…' : '🚀 Join Room'}
        </button>

        <p style={{ color: '#666', fontSize: '0.75rem', textAlign: 'center', margin: '8px 0 0' }}>
          By joining you agree to allow camera and microphone access.
        </p>
      </div>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #0d0d1a 0%, #1a1a35 100%)',
  padding: 24,
  fontFamily: "'Inter', sans-serif",
};

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 20,
  padding: '36px 40px',
  width: '100%',
  maxWidth: 420,
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  fontWeight: 600,
  color: '#c0c0e0',
  marginBottom: -8,
};

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 10,
  color: '#e0e0f0',
  padding: '12px 16px',
  fontSize: '0.95rem',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

const btnStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  border: 'none',
  borderRadius: 10,
  color: '#fff',
  padding: '13px',
  fontSize: '0.95rem',
  fontWeight: 700,
  cursor: 'pointer',
  width: '100%',
  letterSpacing: '0.02em',
  transition: 'transform 0.15s, box-shadow 0.15s',
  boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
};
