'use client';
import { useState, useEffect, useRef } from 'react';
import { sendMessage, getMessages } from '../../lib/api';

export default function ChatMode({ sessionId, onSwitchToLive }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    (async () => {
      try { const data = await getMessages(sessionId); setMessages(data.messages || []); } catch (e) { console.warn('Load history failed:', e); }
    })();
  }, [sessionId]);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text, created_at: Date.now() }]);
    setLoading(true);
    try {
      const res = await sendMessage(text, sessionId);
      setMessages(prev => [...prev, { role: 'assistant', text: res.message.text, metadata: res.message, created_at: Date.now() }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', text: '⚠️ 连接失败，请稍后重试', created_at: Date.now() }]);
    }
    setLoading(false);
  };

  return (
    <div className="chat-container">
      <header className="chat-header">
        <div className="avatar-dot" />
        <span className="header-title">Claw Body</span>
        <button className="switch-btn" onClick={onSwitchToLive}>🎥 实时互动</button>
      </header>
      <div className="message-list">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            {msg.metadata?.type === 'proactive' && <span className="proactive-badge">💡 主动消息</span>}
            <div className="bubble">{msg.text}</div>
            {msg.metadata?.audioUrl && <audio src={msg.metadata.audioUrl} controls className="msg-audio" />}
            {msg.metadata?.videoUrl && <video src={msg.metadata.videoUrl} controls className="msg-video" playsInline />}
          </div>
        ))}
        {loading && <div className="message assistant"><div className="bubble typing"><span className="dot"/><span className="dot"/><span className="dot"/></div></div>}
        <div ref={scrollRef} />
      </div>
      <div className="input-bar">
        <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="说点什么..." className="chat-input" />
        <button onClick={handleSend} disabled={loading} className="send-btn">↑</button>
      </div>
    </div>
  );
}
