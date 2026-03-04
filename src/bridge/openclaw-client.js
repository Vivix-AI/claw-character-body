const axios = require('axios');

class OpenClawClient {
  constructor({ url, apiKey }) {
    this.url = url.replace(/\/$/, '');
    this.http = axios.create({
      baseURL: this.url, timeout: 90000,
      headers: { 'Content-Type': 'application/json', ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}) },
    });
  }

  async chat(text, sessionId = 'default') {
    const { data } = await this.http.post('/api/message', { message: text, sessionId });
    const replyText = data.content || data.message || data.text || JSON.stringify(data);
    return { text: replyText, emotion: this.inferEmotion(replyText), raw: data };
  }

  inferEmotion(text) {
    const t = text.toLowerCase();
    if (/😂|哈哈|笑|funny|lol|搞笑/.test(t)) return 'happy';
    if (/😢|难过|抱歉|sorry|sad/.test(t)) return 'sad';
    if (/😮|wow|天哪|amazing/.test(t)) return 'surprised';
    if (/🤔|想想|think|hmm/.test(t)) return 'thinking';
    if (/❤️|喜欢|love|爱/.test(t)) return 'love';
    if (/😡|生气|angry/.test(t)) return 'angry';
    if (/🎉|恭喜|太好了/.test(t)) return 'excited';
    return 'neutral';
  }

  async checkStatus() {
    try { await this.http.get('/api/status'); return 'connected'; } catch { return 'disconnected'; }
  }
}

module.exports = { OpenClawClient };
