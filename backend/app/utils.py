import hashlib
import blake3

def hash_data(data: str, algo: str = "sha256") -> str:
    if algo == "sha256":
        return hashlib.sha256(data.encode()).hexdigest()
    elif algo == "blake3":
        return blake3.blake3(data.encode()).hexdigest()
    else:
        raise ValueError("Unsupported hash algorithm")