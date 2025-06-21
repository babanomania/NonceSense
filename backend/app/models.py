from pydantic import BaseModel

class ChallengeResponse(BaseModel):
    challenge: str
    difficulty: int
    expires_in: int

class VerifyRequest(BaseModel):
    challenge: str
    nonce: str
    hash_algo: str

class VerifyResponse(BaseModel):
    success: bool
    message: str