import { createHash } from "node:crypto";

export function hashApiKey(plaintext: string): string {
  return createHash("sha256").update(plaintext, "utf8").digest("hex");
}

export function toIso(d: Date): string {
  return d.toISOString();
}
