import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[2] / ".env")

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "vextracker")
JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-me")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
