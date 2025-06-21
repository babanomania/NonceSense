import React, { useState } from "react";

type Props = {
  apiUrl: string;
  onVerify: (result: { challenge: string; nonce: string }) => void;
};

export const NonceCaptcha: React.FC<Props> = ({ apiUrl, onVerify }) => {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const solveCaptcha = async () => {
    setStatus("");
    setLoading(true);

    try {
      const res = await fetch(`${apiUrl}/challenge`, { method: "POST" });
      const { challenge, difficulty } = await res.json();

      const prefix = "0".repeat(difficulty);
      let nonce = 0;

      while (true) {
        const input = challenge + nonce;
        const buffer = new TextEncoder().encode(input);
        const digest = await crypto.subtle.digest("SHA-256", buffer);
        const hash = Array.from(new Uint8Array(digest))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        if (hash.startsWith(prefix)) break;
        nonce++;
      }

      const verify = await fetch(`${apiUrl}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challenge,
          nonce: nonce.toString(),
          hash_algo: "sha256",
        }),
      });

      const result = await verify.json();

      if (result.success) {
        setStatus("Verified");
        onVerify({ challenge, nonce: nonce.toString() });
      } else {
        setStatus(`Error: ${result.message ? result.message : "Verification failed"}`);
      }
    } catch (err) {
      console.error(err);
      setStatus("Error: Error during verification.");
    }

    setLoading(false);
  };

  const VerifiedIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lucide lucide-circle-check-icon lucide-circle-check"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );

  const ErrorIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lucide lucide-x-icon lucide-x"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );

  const SpinnerIcon = () => (
    <svg
      className="animate-spin h-5 w-5 text-blue-600"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v8z"
      ></path>
    </svg>
  );

  return (
    <div className="bg-white rounded-md shadow w-96 p-4">
      {loading ? (
        <div id="spinner" className="flex items-center justify-start">
          <SpinnerIcon />
          <span className="ml-2 text-md text-blue-600">Checking ...</span>
        </div>
      ) : status ? (
        <div id="status" className="text-lg text-left text-blue-600">
          {status === "Verified" ? (
            <div className="flex items-center space-x-2 text-green-600">
              <VerifiedIcon />
              <span>{status}</span>
            </div>
          ) : status.startsWith("Error") ? (
            <div className="flex items-center space-x-2 text-red-600">
              <ErrorIcon />
              <span>{status}</span>
            </div>
          ) : (
            status
          )}
        </div>
      ) : (
        <div className="flex items-center space-x-4">
          <input
            id="robotCheck"
            type="checkbox"
            className="w-5 h-5 accent-blue-600 cursor-pointer"
            onClick={() => solveCaptcha()}
          />
          <label
            htmlFor="robotCheck"
            className="text-gray-800 text-lg cursor-pointer"
          >
            I'm not a robot
          </label>
        </div>
      )}
      <div className="mt-4 flex justify-between items-end text-xs text-gray-500">
        <div className="flex items-center space-x-1">
          <span className="text-gray-500 text-[10px]">NonceSense</span>
        </div>
        <span className="text-gray-400 text-[10px]">Privacy - Terms</span>
      </div>
    </div>
  );
};
