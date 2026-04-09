'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import DailyIframe, { DailyCall, DailyParticipant } from '@daily-co/daily-js';

interface Props {
  roomUrl: string;
  token: string;
  isOwner?: boolean;
  onLeave?: () => void;
}

interface Participant {
  session_id: string;
  user_name: string;
  video: boolean;
  audio: boolean;
  local: boolean;
}

export default function DailyVideoRoom({ roomUrl, token, isOwner = false, onLeave }: Props) {
  const callRef = useRef<DailyCall | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<{ from: string; text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  const refreshParticipants = useCallback((call: DailyCall) => {
    const pmap = call.participants();
    setParticipants(
      Object.values(pmap).map((p: DailyParticipant) => ({
        session_id: p.session_id,
        user_name: p.user_name || (p.local ? 'You' : 'Participant'),
        video: p.tracks?.video?.state === 'playable' || (p.local && p.video),
        audio: p.audio,
        local: p.local,
      }))
    );
  }, []);

  useEffect(() => {
    const call = DailyIframe.createCallObject({ audioSource: true, videoSource: true });
    callRef.current = call;

    call.on('joined-meeting', () => {
      setJoined(true);
      setError(null);
      refreshParticipants(call);
    });

    call.on('participant-joined', () => refreshParticipants(call));
    call.on('participant-updated', () => refreshParticipants(call));
    call.on('participant-left', () => refreshParticipants(call));
    call.on('track-started', () => refreshParticipants(call));
    call.on('track-stopped', () => refreshParticipants(call));

    call.on('app-message', (evt) => {
      if (evt?.data?.type === 'chat') {
        setMessages((prev) => [...prev, { from: evt.data.from ?? 'Participant', text: evt.data.text }]);
      }
    });

    call.on('error', (err) => {
      console.error('Daily error:', err);
      setError('Connection error. Please check your network and try again.');
    });

    call.join({ url: roomUrl, token }).catch((err) => {
      setError(err.message || 'Failed to join room');
    });

    return () => {
      call.destroy();
    };
  }, [roomUrl, token, refreshParticipants]);

  // Attach video tracks to video elements
  useEffect(() => {
    if (!callRef.current || !joined) return;
    const call = callRef.current;
    const pmap = call.participants();

    videoRefs.current.forEach((el, sessionId) => {
      const participant = pmap[sessionId];
      if (!participant) return;
      const track = participant.local
        ? participant.tracks?.video?.persistentTrack
        : participant.tracks?.video?.persistentTrack;
      if (track && el) {
        el.srcObject = new MediaStream([track]);
      }
    });
  }, [participants, joined]);

  const toggleCam = () => {
    callRef.current?.setLocalVideo(!camOn);
    setCamOn((v) => !v);
  };

  const toggleMic = () => {
    callRef.current?.setLocalAudio(!micOn);
    setMicOn((v) => !v);
  };

  const toggleScreen = async () => {
    if (!sharing) {
      await callRef.current?.startScreenShare();
      setSharing(true);
    } else {
      await callRef.current?.stopScreenShare();
      setSharing(false);
    }
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    callRef.current?.sendAppMessage({ type: 'chat', from: 'You', text: chatInput }, '*');
    setMessages((prev) => [...prev, { from: 'You', text: chatInput }]);
    setChatInput('');
  };

  const leave = () => {
    callRef.current?.leave();
    onLeave?.();
  };

  if (error && !joined) {
    return (
      <div className="video-room-error">
        <div className="error-card">
          <span className="error-icon">⚠️</span>
          <h3>Could not join the room</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  if (!joined) {
    return (
      <div className="video-room-loading">
        <div className="loading-card">
          <div className="pulse-ring" />
          <p>Connecting to video room…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="video-room">
      {/* Participant grid */}
      <div className={`participant-grid grid-${Math.min(participants.length, 4)}`}>
        {participants.map((p) => (
          <div key={p.session_id} className={`participant-tile ${p.local ? 'local' : ''}`}>
            <video
              ref={(el) => {
                if (el) videoRefs.current.set(p.session_id, el);
                else videoRefs.current.delete(p.session_id);
              }}
              autoPlay
              playsInline
              muted={p.local}
              className="participant-video"
            />
            {!p.video && (
              <div className="no-video-overlay">
                <span className="avatar-letter">{p.user_name.charAt(0).toUpperCase()}</span>
              </div>
            )}
            <div className="participant-label">
              <span>{p.local ? 'You' : p.user_name}</span>
              {!p.audio && <span className="muted-icon">🔇</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Chat sidebar */}
      {chatOpen && (
        <aside className="chat-sidebar">
          <div className="chat-header">
            <span>Chat</span>
            <button className="close-chat" onClick={() => setChatOpen(false)}>✕</button>
          </div>
          <div className="chat-messages">
            {messages.length === 0 && <p className="no-msgs">No messages yet.</p>}
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.from === 'You' ? 'own' : ''}`}>
                <span className="msg-from">{m.from}</span>
                <span className="msg-text">{m.text}</span>
              </div>
            ))}
          </div>
          <div className="chat-input-row">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendChat()}
              placeholder="Type a message…"
            />
            <button onClick={sendChat}>Send</button>
          </div>
        </aside>
      )}

      {/* Controls bar */}
      <div className="controls-bar">
        <div className="controls-left">
          <span className="participant-count">
            👥 {participants.length} participant{participants.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="controls-center">
          <button
            className={`control-btn ${!micOn ? 'off' : ''}`}
            onClick={toggleMic}
            title={micOn ? 'Mute mic' : 'Unmute mic'}
          >
            {micOn ? '🎙️' : '🔇'}
          </button>
          <button
            className={`control-btn ${!camOn ? 'off' : ''}`}
            onClick={toggleCam}
            title={camOn ? 'Turn off camera' : 'Turn on camera'}
          >
            {camOn ? '📹' : '📷'}
          </button>
          {isOwner && (
            <button
              className={`control-btn ${sharing ? 'active' : ''}`}
              onClick={toggleScreen}
              title={sharing ? 'Stop sharing' : 'Share screen'}
            >
              🖥️
            </button>
          )}
          <button
            className={`control-btn ${chatOpen ? 'active' : ''}`}
            onClick={() => setChatOpen((v) => !v)}
            title="Toggle chat"
          >
            💬
          </button>
          <button className="control-btn leave-btn" onClick={leave} title="Leave room">
            📵 Leave
          </button>
        </div>
        <div className="controls-right" />
      </div>

      <style>{`
        .video-room {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100vh;
          background: #0d0d1a;
          color: #e0e0f0;
          font-family: 'Inter', sans-serif;
          position: relative;
        }
        .participant-grid {
          flex: 1;
          display: grid;
          gap: 8px;
          padding: 16px;
          overflow: hidden;
        }
        .grid-1 { grid-template-columns: 1fr; }
        .grid-2 { grid-template-columns: 1fr 1fr; }
        .grid-3 { grid-template-columns: 1fr 1fr 1fr; }
        .grid-4 { grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; }
        .participant-tile {
          position: relative;
          background: #1a1a2e;
          border-radius: 12px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid transparent;
        }
        .participant-tile.local { border-color: #6366f1; }
        .participant-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .no-video-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #1e1e35;
        }
        .avatar-letter {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          font-weight: 700;
          color: #fff;
        }
        .participant-label {
          position: absolute;
          bottom: 10px;
          left: 10px;
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(0,0,0,0.55);
          backdrop-filter: blur(6px);
          border-radius: 20px;
          padding: 3px 10px;
          font-size: 0.78rem;
          font-weight: 500;
        }
        .muted-icon { font-size: 0.85rem; }
        /* Controls */
        .controls-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #13132a;
          border-top: 1px solid rgba(255,255,255,0.06);
          padding: 12px 24px;
        }
        .controls-center { display: flex; gap: 10px; align-items: center; }
        .control-btn {
          background: #1e1e35;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          color: #e0e0f0;
          padding: 10px 14px;
          cursor: pointer;
          font-size: 1.1rem;
          transition: background 0.2s, transform 0.1s;
        }
        .control-btn:hover { background: #2a2a45; transform: translateY(-1px); }
        .control-btn.off { background: #3f1515; border-color: #e53e3e; }
        .control-btn.active { background: #1e3a5f; border-color: #3b82f6; }
        .leave-btn {
          background: #e53e3e;
          border-color: #c53030;
          font-size: 0.9rem;
          padding: 10px 18px;
          font-weight: 600;
        }
        .leave-btn:hover { background: #c53030; }
        .participant-count { font-size: 0.85rem; color: #a0a0c0; }
        /* Chat */
        .chat-sidebar {
          position: absolute;
          right: 0;
          top: 0;
          bottom: 68px;
          width: 300px;
          background: #13132a;
          border-left: 1px solid rgba(255,255,255,0.08);
          display: flex;
          flex-direction: column;
        }
        .chat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          font-weight: 600;
        }
        .close-chat { background: none; border: none; color: #a0a0c0; cursor: pointer; font-size: 1rem; }
        .chat-messages { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
        .no-msgs { color: #666; font-size: 0.85rem; text-align: center; margin-top: 20px; }
        .chat-msg { display: flex; flex-direction: column; gap: 2px; }
        .chat-msg.own { align-items: flex-end; }
        .msg-from { font-size: 0.72rem; color: #8888aa; }
        .msg-text {
          background: #1e1e35;
          border-radius: 10px;
          padding: 6px 12px;
          font-size: 0.85rem;
          max-width: 85%;
          word-break: break-word;
        }
        .chat-msg.own .msg-text { background: #3730a3; }
        .chat-input-row {
          display: flex;
          gap: 6px;
          padding: 10px;
          border-top: 1px solid rgba(255,255,255,0.08);
        }
        .chat-input-row input {
          flex: 1;
          background: #1e1e35;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: #e0e0f0;
          padding: 8px 12px;
          font-size: 0.85rem;
          outline: none;
        }
        .chat-input-row button {
          background: #6366f1;
          border: none;
          border-radius: 8px;
          color: #fff;
          padding: 8px 14px;
          cursor: pointer;
          font-size: 0.82rem;
          font-weight: 600;
        }
        /* Loading / Error states */
        .video-room-loading, .video-room-error {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100vh;
          background: #0d0d1a;
        }
        .loading-card, .error-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          color: #e0e0f0;
          font-family: 'Inter', sans-serif;
        }
        .pulse-ring {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          border: 4px solid #6366f1;
          border-top-color: transparent;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .error-icon { font-size: 2.5rem; }
        .error-card h3 { margin: 0; font-size: 1.2rem; }
        .error-card p { color: #a0a0c0; margin: 0; text-align: center; }
        .error-card button {
          background: #6366f1;
          border: none;
          border-radius: 8px;
          color: #fff;
          padding: 10px 24px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 600;
          margin-top: 8px;
        }
      `}</style>
    </div>
  );
}
