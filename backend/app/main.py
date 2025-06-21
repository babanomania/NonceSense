import time, random, string
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.models import ChallengeResponse, VerifyRequest, VerifyResponse
from app.utils import hash_data
from app import config
import valkey

valkey_client = valkey.Valkey.from_url(config.VALKEY_URL)
app = FastAPI()

# Enable CORS for all origins (you can restrict it later)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting configuration
def check_rate_limit(ip: str):
    key = f"rl:{ip}"
    count = valkey_client.get(key)
    if count is None:
        valkey_client.setex(key, config.RATE_WINDOW, 1)
        return
    if int(count) >= config.RATE_LIMIT:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    valkey_client.incr(key)


def get_dynamic_difficulty(ip: str) -> int:
    key = f"success:{ip}"
    count = valkey_client.get(key)
    if count and int(count) > 5:
        return config.POW_DIFFICULTY + 1
    return config.POW_DIFFICULTY


@app.post("/challenge", response_model=ChallengeResponse)
def generate_challenge(request: Request):
    ip = request.client.host
    check_rate_limit(ip)

    difficulty = get_dynamic_difficulty(ip)
    challenge = ''.join(random.choices(string.ascii_letters + string.digits, k=16))
    key = f"pow:{challenge}"
    valkey_client.setex(key, config.CHALLENGE_TTL, "1")
    return ChallengeResponse(
        challenge=challenge,
        difficulty=difficulty,
        expires_in=config.CHALLENGE_TTL
    )


@app.post("/verify", response_model=VerifyResponse)
def verify_solution(req: VerifyRequest, request: Request):
    ip = request.client.host
    check_rate_limit(ip)

    key = f"pow:{req.challenge}"
    if not valkey_client.exists(key):
        return VerifyResponse(success=False, message="⚠️ This challenge has expired. Please refresh and try again.")

    try:
        full_input = req.challenge + req.nonce
        hashed = hash_data(full_input, req.hash_algo)
        if hashed.startswith("0" * config.POW_DIFFICULTY):
            valkey_client.delete(key)
            valkey_client.incr(f"success:{ip}")
            valkey_client.expire(f"success:{ip}", 120)
            return VerifyResponse(success=True, message="Valid solution.")
        else:
            return VerifyResponse(success=False, message="Invalid PoW solution")
    except Exception as e:
        return VerifyResponse(success=False, message=str(e))
