<div align="center">

# SQLWizard

**Talk to your database in plain English.**

An AI-powered SQL agent that connects to any SQL database and lets you query it using natural language — no SQL knowledge required.

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.128-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![LangChain](https://img.shields.io/badge/LangChain-1.2-1C3C3C?logo=langchain&logoColor=white)](https://langchain.com)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [LLM Provider Configuration](#llm-provider-configuration)
- [RAG Pipeline](#rag-pipeline)
- [Safety Model](#safety-model)
- [Deployment](#deployment)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

SQLwizaard is a full-stack application that bridges the gap between non-technical users and SQL databases. Users connect their own database (PostgreSQL, MySQL, SQLite, or any SQLAlchemy-compatible source), optionally upload domain-specific documents (PDFs or text files) for extra context, and then ask questions in plain English. A LangChain-powered SQL agent translates those questions into safe, **read-only** SQL, executes them against the connected database, and returns a human-readable answer.

Each user gets isolated **Playgrounds** — self-contained environments tied to a specific database connection, vector namespace, and context — making it easy to manage multiple databases and knowledge bases from a single account.

---

## Features

| Feature | Description |
|---------|-------------|
| 🗣️ **Natural Language Querying** | Ask questions in plain English; the agent generates and executes SQL behind the scenes |
| 🔗 **Multi-Database Support** | Connect to PostgreSQL, MySQL, SQLite, or any SQLAlchemy-compatible database via connection URL |
| 📄 **Document Ingestion (RAG)** | Upload PDFs and text files to give the agent domain knowledge about your schema and business terms |
| 🔒 **Read-Only by Design** | The agent's system prompt restricts it to `SELECT` statements only — no inserts, updates, or deletes |
| 🎯 **Playground Isolation** | Each playground has its own database connection, Pinecone namespace, and context |
| 🔐 **GitHub OAuth** | Authentication via GitHub OAuth with signed JWT session tokens |
| 🤖 **Multi-LLM Support** | Swap between Groq (Llama 3.3 70B), OpenAI (GPT-4o), or Anthropic (Claude 3.5 Sonnet) with one env var |
| 🧩 **Vector Search (Pinecone)** | Uploaded documents are chunked, embedded locally, and stored in Pinecone for semantic retrieval |
| 🎨 **Modern React UI** | Dark-themed frontend built with Tailwind CSS, Radix UI primitives, and Framer Motion animations |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React + Vite)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐   │
│  │ Landing  │  │Dashboard │  │   New    │  │  Playground   │   │
│  │  Page    │  │  Page    │  │Playground│  │  (Chat + RAG) │   │
│  └──────────┘  └──────────┘  └──────────┘  └───────────────┘   │
│                         │ Axios + JWT                           │
└─────────────────────────┼───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Backend (FastAPI + Python)                   │
│                                                                  │
│  ┌──────────┐  ┌───────────────┐  ┌──────────────────────────┐  │
│  │  Auth    │  │  Playground   │  │      /ask Endpoint       │  │
│  │ (GitHub  │  │  CRUD API     │  │                          │  │
│  │  OAuth)  │  │               │  │  ┌────────────────────┐  │  │
│  └──────────┘  └───────────────┘  │  │  LangChain SQL     │  │  │
│                                    │  │  Agent (read-only) │  │  │
│                                    │  └────────┬───────────┘  │  │
│                                    └───────────┼──────────────┘  │
│                                                │                 │
│  ┌─────────────────────┐       ┌───────────────┼──────────┐     │
│  │  PostgreSQL (App)   │       │        User's Database   │     │
│  │  Users, Playgrounds │       │  (Queried via SQLAlchemy) │     │
│  └─────────────────────┘       └──────────────────────────┘     │
│                                                                  │
│  ┌─────────────────────┐       ┌──────────────────────────┐     │
│  │  Pinecone (Vector)  │◄──────│  Document Ingestion      │     │
│  │  Semantic Search    │       │  (PDF/TXT → Chunks →     │     │
│  └─────────────────────┘       │   Embeddings → Upsert)   │     │
│                                └──────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **FastAPI** | Async Python web framework serving the REST API |
| **LangChain / LangGraph** | Orchestration for the SQL agent and its tools |
| **SQLAlchemy** | Connects to both the app's own database and each user's connected database |
| **Pinecone** | Managed vector store for document embeddings, one namespace per playground |
| **Sentence Transformers** | Local embedding model (`all-MiniLM-L6-v2`, 384-dim) — no external API call needed for embeddings |
| **python-jose** | JWT creation and verification |
| **pypdf** | PDF text extraction during ingestion |
| **httpx** | Async HTTP client for the GitHub OAuth exchange |
| **Gunicorn + Uvicorn** | ASGI server for production |

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18 + TypeScript** | UI framework with functional components and hooks |
| **Vite** | Dev server and build tool |
| **Tailwind CSS** | Utility-first styling |
| **Framer Motion** | Animations and transitions |
| **Radix UI** | Accessible primitives (tabs, select, toast, radio group, etc.) |
| **Lucide React** | Icon set |
| **Axios** | HTTP client with JWT-aware requests |
| **React Router v6** | Client-side routing |

---

## Project Structure

```
sqlwizard/
├── backend/
│   ├── app.py                 # FastAPI app — all routes (auth, playgrounds, ask, ingest)
│   ├── SQLAgent.py             # Model loading, SQL agent creation, question answering
│   ├── auth.py                 # GitHub OAuth flow + JWT issuing/verification
│   ├── database_models.py      # SQLAlchemy models (User, Playground) + engine/session setup
│   ├── vectordb.py             # Pinecone integration — embed, upsert, retrieve, delete namespace
│   ├── prompt.py                # System prompt builder (schema + user context + doc context)
│   ├── check.py                 # Utility to verify API key / provider configuration
│   ├── test_endpoints.py        # Interactive script that exercises every endpoint
│   ├── requirements.txt
│   ├── render.yaml              # Render.com deployment config
│   └── .example.env             # Template for backend environment variables
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx                     # Root component with routing
│   │   ├── main.tsx                    # React entry point
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx         # Public marketing/landing page
│   │   │   ├── AuthCallbackPage.tsx    # Handles the GitHub OAuth redirect + token
│   │   │   ├── DashboardPage.tsx       # Lists and manages the user's playgrounds
│   │   │   ├── NewPlaygroundPage.tsx   # Form to create a playground (name, DB URL, context)
│   │   │   └── PlaygroundPage.tsx      # Chat interface + document ingestion panel
│   │   ├── components/
│   │   │   ├── ChatInterface.tsx       # Chat UI: message history + question input
│   │   │   ├── IngestPanel.tsx         # File upload / context editing panel
│   │   │   ├── TetrisLoading.tsx       # Animated loading indicator
│   │   │   └── ui/                     # Reusable primitives (button, toast, select, etc.)
│   │   ├── services/api.ts             # Axios client for auth, playgrounds, ask, ingest
│   │   ├── hooks/
│   │   │   ├── useAuth.ts              # Auth/session state
│   │   │   └── usePlaygrounds.ts       # Playground list fetching
│   │   ├── layouts/AppLayout.tsx       # Authenticated shell (sidebar/header)
│   │   ├── lib/utils.ts                # Small helpers (e.g. `cn`)
│   │   └── types/index.ts              # Shared TypeScript API types
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── vercel.json                     # Vercel SPA rewrite rules
│   └── .env                            # VITE_API_URL
│
└── .gitignore
```

---

## Getting Started

### Prerequisites

- **Python 3.10+**
- **Node.js 18+** (npm or pnpm)
- **PostgreSQL** — for the app's own users/playgrounds database
- **Pinecone account** — free tier is enough ([pinecone.io](https://www.pinecone.io/))
- **GitHub OAuth App** — for login ([create one here](https://github.com/settings/developers))
- **At least one LLM API key** — Groq, OpenAI, or Anthropic

### Backend Setup

```bash
cd backend

# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .example.env .env
# then edit .env with real values — see Environment Variables below

# Run the dev server
python app.py
# or
uvicorn app:app --port 5000 --reload
```

The backend starts at **http://localhost:5000**. SQLAlchemy creates the `users` and `playgrounds` tables automatically on first run.

### Frontend Setup

```bash
cd frontend

npm install
# or: pnpm install

echo "VITE_API_URL=http://localhost:5000" > .env

npm run dev
```

The frontend starts at **http://localhost:5173**.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | — | PostgreSQL URL for the app's own database (users, playgrounds) |
| `GITHUB_CLIENT_ID` | ✅ | — | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | ✅ | — | GitHub OAuth app client secret |
| `JWT_SECRET` | ✅ | — | Secret used to sign JWTs — set a long random value in production |
| `LLM_PROVIDER` | ❌ | `groq` | One of `groq`, `openai`, `anthropic` |
| `LLM_MODEL` | ❌ | provider default | Overrides the default model for the chosen provider |
| `GROQ_API_KEY` | ⚡ | — | Required if `LLM_PROVIDER=groq` |
| `OPENAI_API_KEY` | ⚡ | — | Required if `LLM_PROVIDER=openai` |
| `ANTHROPIC_API_KEY` | ⚡ | — | Required if `LLM_PROVIDER=anthropic` |
| `PINECONE_API_KEY` | ✅ | — | Pinecone API key for document embeddings |
| `PINECONE_INDEX` | ❌ | `sql-agent` | Pinecone index name (created automatically if missing) |
| `FRONTEND_URL` | ❌ | `http://localhost:5173` | Used to build the OAuth redirect back to the frontend |

> ⚡ = Required only for the currently selected `LLM_PROVIDER`.

### Frontend (`frontend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | ❌ | `http://127.0.0.1:5000` | Base URL of the backend API |

---

## API Reference

All authenticated routes expect an `Authorization: Bearer <JWT>` header.

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/auth/login` | ❌ | Redirects to GitHub's OAuth authorization page |
| `GET` | `/auth/callback?code=<code>` | ❌ | Exchanges the code for a token, creates/fetches the user, redirects to the frontend with a JWT |
| `GET` | `/me` | ✅ | Returns the current user's `id`, `username`, `avatar_url` |

### Playgrounds
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/playground/new` | ✅ | Creates a playground. Body: `{ name, db_url, context? }`. Verifies the DB connection before saving |
| `GET` | `/playground/list` | ✅ | Lists the user's playgrounds |
| `GET` | `/playground/{id}` | ✅ | Gets one playground's details |
| `DELETE` | `/playground/{id}` | ✅ | Deletes a playground and its Pinecone namespace |

### Querying
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/ask` | ✅ | Body: `{ question, playground_id }`. Returns `{ answer, playground }` |

### Document Ingestion
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/ingest` | ✅ | Multipart form: `playground_id`, `context`, `files` (PDF/TXT). Returns `{ ingested, namespace }` |

### Health
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | ❌ | Returns `{ status: "ok", model: { model, provider } }` |

---

## LLM Provider Configuration

Set `LLM_PROVIDER` in `backend/.env` to pick a provider; each has a sensible default model that can be overridden with `LLM_MODEL`.

| Provider | `LLM_PROVIDER` | Default Model | Required Key |
|----------|-----------------|---------------|--------------|
| **Groq** | `groq` | `llama-3.3-70b-versatile` | `GROQ_API_KEY` |
| **OpenAI** | `openai` | `gpt-4o` | `OPENAI_API_KEY` |
| **Anthropic** | `anthropic` | `claude-3-5-sonnet-20241022` | `ANTHROPIC_API_KEY` |

All models are initialized with `temperature=0` for consistent, deterministic SQL generation.

---

## RAG Pipeline

The retrieval-augmented generation pipeline gives the agent extra context about business terminology and schema nuances that isn't obvious from column names alone.

1. **Upload** — a PDF or text file is sent to `/ingest` along with the playground ID.
2. **Extract** — PDFs are parsed with `pypdf`; text files are decoded directly.
3. **Chunk** — text is split into overlapping chunks with LangChain's `RecursiveCharacterTextSplitter`.
4. **Embed** — each chunk is embedded locally with `sentence-transformers/all-MiniLM-L6-v2` (384 dimensions, no API call).
5. **Store** — embeddings are upserted into Pinecone under the playground's own namespace.
6. **Retrieve** — at query time, the question is embedded and the most similar chunks are pulled back.
7. **Augment** — the retrieved chunks and any user-supplied context are folded into the agent's system prompt alongside the live database schema.

---

## Safety Model

The SQL agent's prompt (see `SQLAgent.py` / `prompt.py`) explicitly instructs the model to:

- Only ever run `SELECT` queries — never `INSERT`, `UPDATE`, `DELETE`, `DROP`, or other write operations.
- Answer strictly from tool results rather than fabricating data.
- Say so explicitly when it can't find an answer, instead of guessing.

This is a prompt-level safeguard rather than a hard database permission — for production use, it's still recommended to connect with a database role that only has read access.

---

## Deployment

### Backend — Render

A `render.yaml` is included for one-click deployment to [Render](https://render.com):

```yaml
services:
  - type: web
    name: fastapi-app
    env: python
    plan: free
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn app:app --host 0.0.0.0 --port $PORT
```

Set all required environment variables in the Render dashboard.

### Frontend — Vercel

A `vercel.json` handles SPA routing:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Steps:**
1. Connect the `frontend/` directory to Vercel.
2. Build command: `npm run build`
3. Output directory: `dist`
4. Set `VITE_API_URL` to your deployed backend URL.

### GitHub OAuth Setup

When deploying, update your GitHub OAuth App:
- **Homepage URL** → your frontend URL
- **Authorization callback URL** → `https://<your-backend-url>/auth/callback`

---

## Testing

An interactive test runner walks through every endpoint:

```bash
cd backend
python test_endpoints.py
```

It exercises, in order: health check, auth login redirect, `/me`, creating a playground, listing playgrounds, fetching a playground, ingesting a document, asking a question, and deleting a playground.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push the branch: `git push origin feat/your-feature`
5. Open a Pull Request

---

<div align="center">
  <sub>Built with LangChain, FastAPI, and React</sub>
</div>
