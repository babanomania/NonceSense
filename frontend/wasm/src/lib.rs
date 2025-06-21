use wasm_bindgen::prelude::*;
use sha2::{Digest, Sha256};

#[wasm_bindgen]
pub fn solve_pow(challenge: &str, difficulty: u32) -> String {
    let prefix = "0".repeat(difficulty as usize);
    for i in 0u64.. {
        let attempt = format!("{challenge}{i}");
        let hash = Sha256::digest(attempt.as_bytes());
        let hex = hex::encode(hash);
        if hex.starts_with(&prefix) {
            return i.to_string();
        }
    }
    "0".to_string()
}
