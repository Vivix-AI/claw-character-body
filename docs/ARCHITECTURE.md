# 🏗️ Claw Character Body — Technical Architecture

## Core Concept

> "Give AI a body."

Traditional AI assistants are text-in, text-out. Claw Body adds a **visual, audible, emotional presence** — a digital human that you can see and hear, driven 24/7 by OpenClaw's intelligence.

```
┌──────────────────────────────────────────────────┐
│                   USER DEVICE                     │
│                  (Mobile Web)                     │
│                                                   │
│   ┌───────────────────┬───────────────────────┐  │
│   │    📱 Mode A      │      🎥 Mode B        │  │
│   │   Async Chat      │   Live Interactive    │  │
│   │                   │                       │  │
│   │  iMessage-style   │  Full-screen video    │  │
│   │  message bubbles  │  Digital human face   │  │
│   │  audio snippets   │  Real-time lip sync   │  │
│   │  proactive msgs   │  Voice conversation   │  │
│   │                   │  Subtitle overlay     │  │
│   └────────┬──────────┴──────────┬────────────┘  │
│            │ REST API            │ WebSocket      │
└────────────┼─────────────────────┼────────────────┘
             │                     │
             ▼                     ▼
┌────────────────────────────────────────────────────┐
│              🔗 BRIDGE SERVER                       │
│              (Node.js + Express)                    │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │              Request Router                  │   │
│  │   REST endpoints ← → WebSocket handlers     │   │
│  └──────┬──────────────────────────┬───────────┘   │
│         │                          │               │
│  ┌──────▼──────┐          ┌───────▼────────┐      │
│  │  OpenClaw   │          │   7verse       │      │
│  │  Client     │          │   Client       │      │
│  │             │          │                │      │
│  │ • chat()    │          │ • chatToAction │      │
│  │ • emotion   │          │ • startLive    │      │
│  │   inference │          │ • stopLive     │      │
│  └──────┬──────┘          └───────┬────────┘      │
│         │                          │               │
│  ┌──────▼──────────────────────────▼───────────┐   │
│  │            Session Manager                   │   │
│  │  • SQLite persistence                        │   │
│  │  • WebSocket session tracking                │   │
│  │  • Broadcast to connected clients            │   │
│  └─────────────────────────────────────────────┘   │
└─────┬────────────────────────────────┬─────────────┘
      │                                │
      ▼                                ▼
┌──────────────┐              ┌──────────────────┐
│   🧠 OpenClaw │              │   🤖 7verse       │
│   Gateway    │              │   Character API  │
│              │              │                  │
│  • LLM      │              │  • Text-to-Video │
│  • Memory   │              │  • Text-to-Audio │
│  • Tools    │              │  • Lip Sync      │
│  • Skills   │              │  • Emotions      │
│  • Heartbeat│              │  • Live Stream   │
│              │              │                  │
│  POST /api/  │              │  POST /api/v1/   │
│    message   │              │  chat-do-action  │
└──────────────┘              └──────────────────┘
```

## Component Details

### 1. Bridge Server (`src/bridge/`)

The central nervous system. All communication flows through here.

**Why a Bridge?**
- Keeps API keys server-side (never exposed to frontend)
- Enables message persistence across sessions
- Handles emotion inference before passing to 7verse
- Manages WebSocket connections for real-time mode
- Single point for monitoring/logging

**Key modules:**

| File | Responsibility |
|------|---------------|
| `server.js` | Express HTTP + WebSocket server, route definitions |
| `openclaw-client.js` | OpenClaw Gateway integration + emotion inference |
| `7verse-client.js` | 7verse Character API wrapper |
| `db.js` | SQLite schema + CRUD for sessions & messages |

**Emotion Inference Pipeline:**
```
OpenClaw text response
  → Regex pattern matching (emoji + keywords)
  → Emotion label: happy | sad | surprised | thinking | love | angry | excited | neutral
  → Passed to 7verse as emotion parameter
  → Digital human renders matching facial expression
```

### 2. Web Frontend (`src/web/`)

Mobile-first Next.js application with two interaction modes.

**Mode A: Async Chat**
- iMessage-style dark UI
- User sends text → gets reply with optional audio/video
- Proactive messages (OpenClaw initiates) marked with 💡
- Full conversation history from SQLite
- "Switch to Live" button in header

**Mode B: Live Interactive**
- Full-screen digital human video stream
- Large mic button (center) for voice input
- Keyboard toggle for text input
- Real-time subtitle overlay on video
- Semi-transparent side message stream
- WebSocket for low-latency communication

**State Management:**
- React `useState` for UI state
- `localStorage` for session ID persistence
- Custom `useWebSocket` hook with auto-reconnect

### 3. OpenClaw Integration

OpenClaw serves as the AI brain:
- **Thinking** — LLM-powered reasoning and conversation
- **Memory** — Cross-session context retention
- **Tools** — web search, calculations, etc.
- **Personality** — Defined by SOUL.md
- **Proactive behavior** — Heartbeat-triggered messages

Communication: `POST /api/message` with `{message, sessionId}`

### 4. 7verse Integration

7verse provides the digital human body:
- **chat-do-action** — Text + emotion → audio + video clip
- **Live session** — Real-time video stream with speech
- **Character selection** — Multiple digital human personas

⚠️ **API paths are currently estimated.** Pending alignment with actual Apifox documentation.

### 5. Data Persistence

SQLite with two tables:

```sql
sessions
  ├── id (TEXT PK)
  ├── character_id (TEXT)
  ├── created_at (INTEGER)
  └── updated_at (INTEGER)

messages
  ├── id (INTEGER PK AUTOINCREMENT)
  ├── session_id (TEXT FK → sessions)
  ├── role ('user' | 'assistant')
  ├── text (TEXT)
  ├── metadata (JSON — emotion, audioUrl, videoUrl, type)
  └── created_at (INTEGER)
```

## As OpenClaw Skill

The `src/skill/` directory is a standalone OpenClaw Skill:

```bash
# Install as skill
cp -r src/skill/ ~/.openclaw/skills/claw-body/

# Or via ClawHub (future)
clawhub install claw-body
```

When loaded, OpenClaw knows it has a body and can:
- Send messages that get rendered as digital human speech
- Push proactive messages that the avatar delivers
- Check body status via health endpoint

## Security Considerations

- API keys stored in `.env`, never committed (`.gitignore`)
- Bridge server handles all authentication
- No direct frontend ↔ API communication
- SQLite file stored in `data/` (gitignored)
- CORS enabled but should be restricted in production

## Deployment Options

| Component | Recommended | Alternative |
|-----------|-------------|-------------|
| Bridge | Railway / Fly.io | VPS, Docker |
| Web | Vercel | Netlify, Docker |
| Database | SQLite (local) | PostgreSQL (multi-instance) |
| Domain | `live.7verse.ai` | Any custom domain |

## Scaling Considerations

Current architecture is **single-instance**. For scaling:
1. Replace SQLite → PostgreSQL
2. Add Redis for WebSocket session sharing across instances
3. Load balancer with sticky sessions for WebSocket
4. CDN for static assets (Vercel handles this)
