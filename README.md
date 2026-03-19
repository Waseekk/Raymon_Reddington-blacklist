# Raymond Reddington

A full-stack AI chatbot that lets you converse with Raymond Reddington, the infamous Concierge of Crime from NBC's The Blacklist. Built with FastAPI, Next.js 14, and the Anthropic Claude API.

## Tech Stack

| Layer    | Technology                                      |
|----------|-------------------------------------------------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind   |
| Auth     | NextAuth v4 (Google + Facebook OAuth)           |
| Backend  | FastAPI (Python 3.11+)                          |
| Database | SQLite via SQLAlchemy 2.0                       |
| AI       | Anthropic Claude (claude-sonnet-4-6)            |
| RAG      | ChromaDB + sentence-transformers                |

## Project Structure

```
raymond_reddington/
├── backend/
│   ├── main.py              # FastAPI app, CORS, startup
│   ├── config.py            # Pydantic settings
│   ├── persona.py           # Reddington system prompt
│   ├── requirements.txt
│   ├── auth/
│   │   ├── dependencies.py  # get_current_user FastAPI dep
│   │   └── jwt_validator.py # HS256 JWT decode
│   ├── database/
│   │   ├── models.py        # User, Conversation, Message, UserUsage
│   │   └── engine.py        # SQLAlchemy engine & session
│   ├── routers/
│   │   ├── chat.py          # POST /api/chat (SSE streaming)
│   │   ├── conversations.py # CRUD /api/conversations
│   │   ├── usage.py         # GET /api/usage
│   │   └── settings.py      # GET/PATCH /api/settings (BYOAK)
│   └── services/
│       ├── claude_service.py  # AsyncAnthropic streaming
│       ├── rag_service.py     # ChromaDB lookup
│       └── rate_limiter.py    # Daily message limits
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx
    │   │   ├── page.tsx       # Home / login redirect
    │   │   ├── chat/page.tsx  # Chat page
    │   │   └── providers.tsx  # SessionProvider + Toaster
    │   ├── components/
    │   │   ├── ChatInterface.tsx
    │   │   ├── LoginPage.tsx
    │   │   ├── MessageBubble.tsx
    │   │   ├── ConversationSidebar.tsx
    │   │   ├── UserMenu.tsx
    │   │   ├── SettingsModal.tsx
    │   │   └── UsageBar.tsx
    │   └── lib/
    │       ├── auth.ts        # NextAuth config + rawToken
    │       └── api.ts         # Typed fetch functions
    └── public/
        └── reddington.jpg     # Place your Reddington image here
```

## Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- Anthropic API key
- Google OAuth credentials
- Facebook OAuth credentials (optional)

### Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Fill in your values in .env
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
# Fill in your values in .env.local
npm run dev
```

## Environment Variables

**backend/.env**
```
ANTHROPIC_API_KEY=         # Your Anthropic API key
NEXTAUTH_SECRET=           # Same secret as frontend
DATABASE_URL=sqlite:///./reddington.db
DAILY_MESSAGE_LIMIT=20
FRONTEND_URL=http://localhost:3000
ADMIN_EMAIL=               # Your admin email
```

**frontend/.env.local**
```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=           # Generate with: openssl rand -base64 32
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

## Quick Start

Run both servers at once (Windows):

```bash
start.bat
```

Open http://localhost:3000 in your browser.

## Features

- **Streaming chat** — SSE-based token-by-token streaming
- **RAG** — ChromaDB vector search over Reddington transcripts
- **OAuth** — Google and Facebook sign-in
- **Daily limits** — Configurable per-user message cap
- **BYOAK** — Users can provide their own Anthropic API key to bypass limits
- **Markdown rendering** — Assistant replies render lists, bold, code blocks
- **Dark theme** — Gold accents, Georgia serif, fully responsive
