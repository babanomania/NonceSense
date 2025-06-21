# 🧠 NonceSense

**NonceSense** is a Proof-of-Work (PoW) CAPTCHA that uses cryptographic puzzles instead of image-based tests. Designed for bots to hate and devs to love — it’s fast, lightweight, and privacy-respecting.

> _"Because common sense doesn’t work on bots — so we use nonce sense."_ 🔐

---

## 🔧 Tech Stack

- ⛓️ **Python** backend with **FastAPI**
- 🔐 **SHA256** / **BLAKE3** hashing
- 🌐 REST API for challenge issuance and verification
- 💾 **Valkey** (Redis-compatible open source fork) for temporary challenge tracking
- 💡 **WASM**-powered PoW solver on the frontend

---

## ⚙️ How It Works

1. Client requests a challenge from the API
2. Server returns a challenge string + required difficulty
3. Client finds a nonce such that  
   `hash(challenge + nonce)` starts with `n` zeroes
4. Server verifies the hash and grants access if valid

---

## 🚀 Quickstart

### 🐍 Backend (FastAPI)

```bash
git clone https://github.com/babanomania/NonceSense.git
cd noncesense/backend

python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run API server
uvicorn app.main:app --reload
````

### 🗄 Valkey (instead of Redis)

Install and run Valkey:

```bash
docker run -p 6379:6379 valkey/valkey
```

Configure your `.env` or `config.py`:

```python
VALKEY_URL = "redis://localhost:6379/0"
```

*Valkey uses the same protocol and Python clients as Redis, so no code changes needed.*

---

## 📬 API Endpoints

### 🔑 `POST /challenge`

Returns a new challenge:

```json
{
  "challenge": "a1f2c5e9...",
  "difficulty": 4,
  "expires_in": 120
}
```

### ✅ `POST /verify`

Submit your solution:

```json
{
  "challenge": "a1f2c5e9...",
  "nonce": "000438",
  "hash_algo": "sha256"
}
```

Response:

```json
{
  "success": true,
  "message": "Valid solution."
}
```

---

## 💻 Frontend (WASM Solver)

Client computes PoW in-browser using:

* WebAssembly (Rust or AssemblyScript)
* Fallback to JavaScript for unsupported browsers
* Nonce discovery loop with hash feedback

---

## 🔮 Roadmap

* [ ] Dynamic difficulty scaling
* [ ] Challenge expiration feedback
* [ ] Plug-in frontend widget (React/Vue/Svelte)
* [ ] Offline verification for serverless use cases

---

## 📄 License

MIT License — use it freely, break bots peacefully.

---

## ✨ Credits

Created by [Shouvik Basu](https://github.com/babanomania)
Built with Python, hash power, and a whole lot of **NonceSense**.
