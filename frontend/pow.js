let wasmReady = false;
let solveWasmPow = null;

const API_BASE = "${BACKEND_URL}";

const captchaContent = document.getElementById("captcha-content");

async function loadWasmSolver() {
  try {
    const wasmModule = await import("./pkg/pow_solver.js");
    await wasmModule.default(); // initialize WASM runtime
    solveWasmPow = wasmModule.solve_pow;
    wasmReady = true;
    console.log("✅ WASM solver loaded");
  } catch (err) {
    console.warn("⚠️ Failed to load WASM module. Falling back to JS.", err);
  }
}

async function jsSolver(challenge, difficulty) {
  const prefix = "0".repeat(difficulty);
  let nonce = 0;
  while (true) {
    const input = challenge + nonce;
    const buffer = new TextEncoder().encode(input);
    const digest = await crypto.subtle.digest("SHA-256", buffer);
    const hash = Array.from(new Uint8Array(digest))
      .map(b => b.toString(16).padStart(2, "0")).join("");
    if (hash.startsWith(prefix)) return nonce.toString();
    nonce++;
  }
}

function renderInitial() {
  captchaContent.innerHTML = `
    <div class="flex items-center space-x-4">
      <input id="robotCheck" type="checkbox" class="w-5 h-5 accent-blue-600 cursor-pointer" onclick="solveChallenge()" />
      <label for="robotCheck" class="text-gray-800 text-lg cursor-pointer">
        I'm not a robot
      </label>
    </div>
  `;
}

function renderSpinner() {
  captchaContent.innerHTML = `
    <div id="spinner" class="flex items-center justify-start">
      <svg class="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
      </svg>
      <span class="ml-2 text-md text-blue-600">Checking ...</span>
    </div>
  `;
}

function renderStatus(status, isSuccess) {
  if (isSuccess) {
    captchaContent.innerHTML = `
      <div id="status" class="flex items-center space-x-2 text-lg text-green-600">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-check-icon lucide-circle-check"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>
        <span>Verified</span>
      </div>
    `;
  } else {
    captchaContent.innerHTML = `
      <div id="status" class="flex items-center space-x-2 text-lg text-red-600">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-icon lucide-x"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
        <span>${status}</span>
      </div>
    `;
  }
}

async function solveChallenge() {
  const checkbox = document.getElementById("robotCheck");
  if (checkbox) checkbox.disabled = true;
  renderSpinner();

  try {
    const res = await fetch(`${API_BASE}/challenge`, { method: "POST" });
    const { challenge, difficulty } = await res.json();

    let nonce = "0";
    if (wasmReady && solveWasmPow) {
      nonce = solveWasmPow(challenge, difficulty);
    } else {
      nonce = await jsSolver(challenge, difficulty);
    }

    const verify = await fetch(`${API_BASE}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        challenge,
        nonce,
        hash_algo: "sha256"
      })
    });

    if (verify.status === 429) {
      renderStatus("Too many attempts. Please wait and try again.", false);
      renderInitial();
    } else {
      const result = await verify.json();

      if (result.message && result.message.includes("expired")) {
        renderStatus(result.message, false);
        setTimeout(renderInitial, 2000);
      } else if (result.success) {
        renderStatus("Verified", true);
      } else {
        renderStatus(result.message ? result.message : "Verification failed", false);
        setTimeout(renderInitial, 2000);
      }
    }
  } catch (err) {
    renderStatus("Error during verification", false);
    setTimeout(renderInitial, 2000);
    console.error(err);
  }

  checkbox.disabled = false;
}

function refreshChallenge() {
  checkbox.checked = false;
  checkbox.disabled = false;
  spinner.classList.add("hidden");
  status.textContent = "";
  status.className = "text-sm text-gray-600";
  refreshBtn.classList.add("hidden");
}

// Export to global scope so HTML onclick="..." works
window.solveChallenge = solveChallenge;
window.refreshChallenge = refreshChallenge;

window.addEventListener("DOMContentLoaded", () => {
  loadWasmSolver();
  renderInitial();
});
