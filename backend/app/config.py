import os
from dotenv import load_dotenv

load_dotenv()

VALKEY_URL = os.getenv("VALKEY_URL", "redis://localhost:6379/0")
POW_DIFFICULTY = int(os.getenv("POW_DIFFICULTY", 4))
CHALLENGE_TTL = int(os.getenv("CHALLENGE_TTL", 120))
RATE_LIMIT = int(os.getenv("RATE_LIMIT", 10 ))
RATE_WINDOW = int(os.getenv("RATE_WINDOW", 60 ))
