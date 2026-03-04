const axios = require('axios');

class SevenVerseClient {
  constructor({ baseUrl, apiKey, characterId }) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.characterId = characterId;
    this.http = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    });
  }

  async listCharacters() {
    try { const { data } = await this.http.get('/api/v1/characters'); return data.characters || data.data || []; }
    catch (e) { console.error('[7verse] listCharacters:', e.message); return []; }
  }

  // Core: OpenClaw output → digital human action (voice + video)
  async chatToAction(text, emotion = 'neutral') {
    const { data } = await this.http.post('/api/v1/chat-do-action', {
      character_id: this.characterId, text, emotion,
      output_format: { audio: true, video: true },
    });
    return { audioUrl: data.audio_url || data.audioUrl || null, videoUrl: data.video_url || data.videoUrl || null, duration: data.duration || null, metadata: data.metadata || {} };
  }

  async startLiveSession(characterId) {
    const cid = characterId || this.characterId;
    const { data } = await this.http.post('/api/v1/live/session/start', {
      character_id: cid, mode: 'interactive',
      video_config: { resolution: '720p', fps: 25, codec: 'h264' },
    });
    return { liveSessionId: data.session_id || data.liveSessionId, streamUrl: data.stream_url || data.streamUrl, wsEndpoint: data.ws_endpoint || null, protocol: data.protocol || 'webrtc' };
  }

  async startLiveChat(characterId, text, emotion = 'neutral') {
    const cid = characterId || this.characterId;
    const { data } = await this.http.post('/api/v1/live/chat', { character_id: cid, text, emotion, stream: true });
    return { streamUrl: data.stream_url || data.streamUrl || null, taskId: data.task_id || null };
  }

  async stopLiveSession(sessionId) {
    await this.http.post('/api/v1/live/session/stop', { session_id: sessionId });
  }

  async checkStatus() {
    try { await this.http.get('/api/v1/health'); return 'connected'; } catch { return 'disconnected'; }
  }
}

module.exports = { SevenVerseClient };
