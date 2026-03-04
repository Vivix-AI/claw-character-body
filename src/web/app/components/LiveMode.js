'use client';
import { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../../lib/ws';

export default function LiveMode({ sessionId, onSwitchToChat }) {
  const [messages, setMessages] = useState([]);
  const [subtitle, setSubtitle] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [inputText, setInputText] = useState('');
  const [liveStream, setLiveStream] = useState(null);
  const videoRef = useRef(null);

  const { send, connected } = useWebSocket(sessionId, (data) => {
    if (data.type === 'response' || data.type === 'proactive') {
      setSubtitle(data.text);
      setMessages(prev => [...prev.slice(-20), { role: 'assistant', text: data.text, timestamp: data.timestamp }]);
      if (data.stream?.streamUrl) setLiveStream(data.stream.streamUrl);
      setTimeout(() => setSubtitle(''), 5000);
    } else if (data.type === 'live_started') {
      setLiveStream(data.streamUrl);
    }
  });

  useEffect(() => {
    if (connected) send({ type: 'start_live' });
    return () => { if (connected) send({ type: 'stop_live' }); };
  }, [connected]);

  const handleTextSend = () => {
    if (!inputText.trim()) return;
    send({ type: 'chat', text: inputText.trim() });
    setMessages(prev => [...prev, { role: 'user', text: inputText.trim(), timestamp: Date.now() }]);
    setInputText('');
  };

  return (
    <div className="live-container">
      <div className="video-area">
        {liveStream ? (
          <video ref={videoRef} src={liveStream} autoPlay playsInline className="live-video" />
        ) : (
          <div className="video-placeholder"><div className="placeholder-avatar">🤖</div><p>{connected ? '正在连接数字人...' : '连接中...'}</p></div>
        )}
        {subtitle && <div className="subtitle-overlay">{subtitle}</div>}
      </div>
      <div className="live-top-bar">
        <button className="back-btn" onClick={onSwitchToChat}>← 聊天</button>
        <span className={`status-dot ${connected ? 'online' : 'offline'}`} />
      </div>
      <div className="side-messages">
        {messages.slice(-5).map((m, i) => (
          <div key={i} className={`side-msg ${m.role}`}>{m.text.slice(0, 60)}{m.text.length > 60 ? '...' : ''}</div>
        ))}
      </div>
      <div className="live-bottom">
        {showInput ? (
          <div className="mini-input-bar">
            <input value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleTextSend()} placeholder="输入文字..." className="mini-input" autoFocus />
            <button onClick={handleTextSend} className="mini-send">↑</button>
            <button onClick={() => setShowInput(false)} className="mini-close">✕</button>
          </div>
        ) : (
          <div className="live-controls">
            <button className="kbd-btn" onClick={() => setShowInput(true)}>⌨️</button>
            <button className={`mic-btn ${isListening ? 'active' : ''}`} onClick={() => setIsListening(!isListening)}>🎤</button>
            <button className="end-btn" onClick={onSwitchToChat}>⏹</button>
          </div>
        )}
      </div>
    </div>
  );
}
