# VexTracker AI

An AI-driven child vaccination management platform: parent/doctor/admin
dashboards, a deterministic vaccination scheduling engine, QR-based dose
verification, and a Groq-powered RAG assistant that answers questions only
from a verified local knowledge base.

## Repository structure

- `frontend/`: React + Vite + Tailwind client
- `backend/`: FastAPI application (MongoDB via Beanie/Motor)
- `.env.example`: environment variable template

## Prerequisites

- Node.js 18+
- Python 3.11+
- A MongoDB instance (local `mongod`, Docker, or a free MongoDB Atlas cluster)
- A free Groq API key from https://console.groq.com/keys (optional -- the
  assistant falls back to a safe message if `GROQ_API_KEY` is blank)

## Environment setup

```bash
cp .env.example .env
```

Then edit `.env`: set `MONGODB_URI`/`MONGODB_DB_NAME` for your Mongo instance,
generate a `JWT_SECRET` (`python -c "import secrets; print(secrets.token_urlsafe(32))"`),
and paste your Groq key.

**Never commit `.env`** -- it's already in `.gitignore`.

## Backend

```bash
cd backend
python -m venv .venv
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
# macOS/Linux
# source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Runs on http://localhost:8000 -- check http://localhost:8000/health once it's
up. Run tests with `pytest` from inside `backend/`.

**Important:** create your own `.venv` on each machine you run this on; never
copy a `.venv` folder between machines (see Portability notes below).

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on the Vite default port, typically http://localhost:5173.

## Portability notes

- `.venv/`, `node_modules/`, `__pycache__/`, and `.pytest_cache/` are in
  `.gitignore` and should never be zipped or committed -- they're
  machine-specific (a `.venv` built on Windows will not run on macOS/Linux,
  or even on a different Windows machine, since it hardcodes absolute paths).
  Anyone setting this up runs `pip install -r requirements.txt` /
  `npm install` themselves to build their own.
- Each machine needs its own `.env` with its own secrets -- copy
  `.env.example`, don't copy `.env`.

## Current status

Auth (JWT + role-based access for parent/doctor/admin), the scheduling
engine, parent/doctor/admin routes, the Groq-backed AI assistant, and the
notification-reminder logic are implemented and covered by unit tests. ML
demand-forecasting/missed-dose-risk models are stubbed in
`app/services/ml_models.py` for further development.
