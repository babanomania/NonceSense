import pytest
import httpx
import hashlib
import blake3

BASE_URL = "http://noncesense-backend:8000"

def hash_data(data: str, algo: str = "sha256") -> str:
    if algo == "sha256":
        return hashlib.sha256(data.encode()).hexdigest()
    elif algo == "blake3":
        return blake3.blake3(data.encode()).hexdigest()
    else:
        raise ValueError("Unsupported hash algorithm")

def find_nonce(challenge: str, difficulty: int, algo: str) -> str:
    prefix = "0" * difficulty
    i = 0
    while True:
        nonce = str(i)
        digest = hash_data(challenge + nonce, algo)
        if digest.startswith(prefix):
            return nonce
        i += 1

@pytest.mark.parametrize("hash_algo", ["sha256", "blake3"])
def test_pow_challenge_and_verification(hash_algo):
    # Request challenge
    response = httpx.post(f"{BASE_URL}/challenge")
    assert response.status_code == 200

    data = response.json()
    challenge = data["challenge"]
    difficulty = data["difficulty"]
    assert isinstance(challenge, str) and len(challenge) > 0
    assert isinstance(difficulty, int) and difficulty > 0

    # Solve challenge
    nonce = find_nonce(challenge, difficulty, hash_algo)
    assert nonce is not None

    # Submit verification
    verify_response = httpx.post(f"{BASE_URL}/verify", json={
        "challenge": challenge,
        "nonce": nonce,
        "hash_algo": hash_algo
    })

    assert verify_response.status_code == 200
    verify_data = verify_response.json()
    assert verify_data["success"] is True
    assert "Valid" in verify_data["message"]
