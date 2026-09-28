import os
from pathlib import Path

from dotenv import load_dotenv

# Check both backend/.env and project root .env
for p in [Path(__file__).resolve().parents[2] / ".env", Path(__file__).resolve().parents[3] / ".env"]:
    if p.exists():
        load_dotenv(p)
        break

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "vextracker")
JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-me")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")

