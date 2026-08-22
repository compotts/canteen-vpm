import {
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

const KEY_LENGTH = 64;
const ALPHABET = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, KEY_LENGTH);
  return `scrypt$${salt.toString("base64url")}$${derived.toString("base64url")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, saltPart, hashPart] = stored.split("$");
  if (scheme !== "scrypt" || !saltPart || !hashPart) return false;

  const expected = Buffer.from(hashPart, "base64url");
  const derived = scryptSync(
    password,
    Buffer.from(saltPart, "base64url"),
    expected.length
  );
  return timingSafeEqual(derived, expected);
}

export function generatePassword(length = 14): string {
  const bytes = randomBytes(length);
  let result = "";
  for (const byte of bytes) result += ALPHABET[byte % ALPHABET.length];
  return result;
}

export function constantTimeEquals(a: string, b: string): boolean {
  return timingSafeEqual(
    createHash("sha256").update(a).digest(),
    createHash("sha256").update(b).digest()
  );
}
