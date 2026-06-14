/**
 * Hashes a PIN string using SHA-256 via the WebCrypto API.
 * Returns a hex string. Never stores the raw PIN.
 */
export async function hashPin(pin: string): Promise<string> {
  const encoded = new TextEncoder().encode(pin);
  const buffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
