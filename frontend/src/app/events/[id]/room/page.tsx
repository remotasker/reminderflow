'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { generateToken } from '@/hooks/useDaily';

const DailyVideoRoom = dynamic(() => import('@/components/DailyVideoRoom'), { ssr: false });

interface Props {
  params: { id: string };
}

export default function OrganizerRoomPage({ params }: Props) {
  const router = useRouter();
  const [tokenInfo, setTokenInfo] = useState<{ token: string; roomUrl: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { token, roomName } = await generateToken(params.id, true);
        // Build the room URL from the room name
        const roomUrl = `https://daily.co/${roomName}`;
        setTokenInfo({ token, roomUrl });
      } catch (err: any) {
        setError(err.message || 'Failed to get meeting token');
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id]);

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#0d0d1a', color: '#e0e0f0',
        fontFamily: 'Inter, sans-serif', flexDirection: 'column', gap: 16
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          border: '4px solid #6366f1', borderTopColor: 'transparent',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p>Setting up your room…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#0d0d1a', color: '#e0e0f0',
        fontFamily: 'Inter, sans-serif', flexDirection: 'column', gap: 12
      }}>
        <span style={{ fontSize: '2.5rem' }}>⚠️</span>
        <h3 style={{ margin: 0 }}>Could not join room</h3>
        <p style={{ color: '#a0a0c0', textAlign: 'center', maxWidth: 360 }}>{error}</p>
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button
            onClick={() => router.push(`/events/${params.id}/edit`)}
            style={{
              background: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
              color: '#e0e0f0', borderRadius: 8, padding: '10px 20px',
              cursor: 'pointer', fontSize: '0.9rem'
            }}
          >
            Back to Event
          </button>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#6366f1', border: 'none', color: '#fff',
              borderRadius: 8, padding: '10px 20px', cursor: 'pointer',
              fontSize: '0.9rem', fontWeight: 600
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!tokenInfo) return null;

  return (
    <DailyVideoRoom
      roomUrl={tokenInfo.roomUrl}
      token={tokenInfo.token}
      isOwner
      onLeave={() => router.push(`/events/${params.id}/edit`)}
    />
  );
}
