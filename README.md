# 🤖 Claw Body

> Give OpenClaw a body — a real-time digital human avatar powered by 7verse.

**OpenClaw = Brain 🧠** | **7verse Character = Body 🤖**

```
┌─────────────────────┐
│   Mobile Web App    │
│  ┌───────┬────────┐ │
│  │ Chat  │  Live  │ │
│  │Mode A │ Mode B │ │
│  └───┬───┴───┬────┘ │
└──────┼───────┼──────┘
       │REST   │WebSocket
┌──────▼───────▼──────┐
│   Bridge Server     │
│  Node.js + SQLite   │
└──┬─────────────┬────┘
   ▼             ▼
┌────────┐  ┌────────┐
│OpenClaw│  │ 7verse │
│ Think  │  │ Video  │
│Remember│  │ Voice  │
│ Tools  │  │Emotion │
└────────┘  └────────┘
```

## Modes
- **📱 Mode A: Async Chat** — iMessage-style dark UI, proactive messages, history
- **🎥 Mode B: Live Interactive** — Full-screen video, mic button, real-time speech + expressions

## Quick Start
```bash
git clone https://github.com/Vivix-AI/claw-body.git && cd claw-body
cp .env.example .env  # edit with your keys
cd src/bridge && npm install && node server.js
# new terminal:
cd src/web && npm install && npm run dev
# Open http://localhost:3002
```

## As OpenClaw Skill
```bash
cp -r src/skill/ ~/.openclaw/skills/claw-body/
# or: clawhub install claw-body
```

## TODO
- [ ] Align 7verse API with Apifox docs
- [ ] Browser STT for voice input
- [ ] WebRTC video streaming
- [ ] PWA support
- [ ] Auth layer
- [ ] Publish to ClawHub

## License
MIT — [Vivix AI](https://github.com/Vivix-AI)
