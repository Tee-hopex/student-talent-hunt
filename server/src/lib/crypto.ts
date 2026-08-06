import crypto from "node:crypto";
import { env } from "../config/env";

// AES-256-GCM, app-level encryption for sensitive fields and files.
// Key is a 32-byte secret from ENCRYPTION_KEY (hex). Swapping this for a
// KMS-backed key later only requires changing getKey().

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // recommended for GCM

function getKey(): Buffer {
  return Buffer.from(env.ENCRYPTION_KEY, "hex");
}

/** Encrypts a UTF-8 string field. Output format: iv:authTag:ciphertext (base64, colon-joined). */
export function encryptField(plainText: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString("base64"), authTag.toString("base64"), encrypted.toString("base64")].join(":");
}

/** Decrypts a string produced by encryptField. */
export function decryptField(payload: string): string {
  const [ivB64, authTagB64, dataB64] = payload.split(":");
  if (!ivB64 || !authTagB64 || !dataB64) {
    throw new Error("Malformed encrypted payload");
  }
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(authTagB64, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

/** Encrypts a file buffer. Returns iv + authTag prefixed onto the ciphertext so it's self-contained on disk. */
export function encryptBuffer(input: Buffer): Buffer {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(input), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]);
}

/** Decrypts a buffer produced by encryptBuffer. */
export function decryptBuffer(input: Buffer): Buffer {
  const iv = input.subarray(0, IV_LENGTH);
  const authTag = input.subarray(IV_LENGTH, IV_LENGTH + 16);
  const data = input.subarray(IV_LENGTH + 16);
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(data), decipher.final()]);
}

/** One-way hash for voter dedup keys / IP fingerprints — not reversible, salted with server secret. */
export function hashIdentifier(value: string): string {
  return crypto.createHmac("sha256", getKey()).update(value).digest("hex");
}
