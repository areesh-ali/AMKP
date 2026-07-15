import { createHash, createHmac } from "node:crypto";

/**
 * Hash Tenant API keys at rest.
 * When `AMKP_API_KEY_PEPPER` is set, uses HMAC-SHA256(pepper, key);
 * otherwise SHA-256(key) for backward-compatible local/dev (no pepper).
 * Changing the pepper invalidates all existing key hashes — rotate keys after.
 */
export function hashApiKey(plaintext: string): string {
  const pepper = process.env.AMKP_API_KEY_PEPPER?.trim() ?? "";
  if (pepper.length > 0) {
    return createHmac("sha256", pepper).update(plaintext, "utf8").digest("hex");
  }
  return createHash("sha256").update(plaintext, "utf8").digest("hex");
}

export function toIso(d: Date): string {
  return d.toISOString();
}
