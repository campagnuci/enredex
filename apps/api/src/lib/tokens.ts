import { createHash, randomBytes } from "node:crypto";

export function generateToken(): string {
  return randomBytes(48).toString("base64url");
}

/** Tokens are stored hashed (sha256) so a DB leak doesn't leak sessions. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
