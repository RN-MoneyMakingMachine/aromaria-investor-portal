import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

export type ShareMode = "view" | "download";

export type ShareTokenPayload = {
  fileId: string;
  mode: ShareMode;
  exp: number;
};

export type DecodeResult =
  | { ok: true; payload: ShareTokenPayload }
  | { ok: false; reason: "malformed" | "bad_signature" | "expired" };

const DEFAULT_TTL_HOURS = 168;

function ttlMs(): number {
  const raw = process.env.SHARE_LINK_TTL_HOURS;
  const hours = raw ? Number(raw) : DEFAULT_TTL_HOURS;
  if (!Number.isFinite(hours) || hours <= 0) {
    return DEFAULT_TTL_HOURS * 60 * 60 * 1000;
  }
  return hours * 60 * 60 * 1000;
}

function getSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET is not set; cannot sign share links.");
  }
  return secret;
}

function base64UrlEncode(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(input: string): Buffer {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return Buffer.from(b64, "base64");
}

function sign(payloadB64: string): string {
  return base64UrlEncode(
    createHmac("sha256", getSecret()).update(payloadB64).digest(),
  );
}

export function mintShareToken(fileId: string, mode: ShareMode): string {
  const payload: ShareTokenPayload = {
    fileId,
    mode,
    exp: Date.now() + ttlMs(),
  };
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  return `${payloadB64}.${sign(payloadB64)}`;
}

export function decodeShareToken(token: string): DecodeResult {
  const parts = token.split(".");
  if (parts.length !== 2) return { ok: false, reason: "malformed" };
  const [payloadB64, sigB64] = parts;

  const expected = base64UrlDecode(sign(payloadB64));
  const provided = base64UrlDecode(sigB64);
  if (
    expected.length !== provided.length ||
    !timingSafeEqual(expected, provided)
  ) {
    return { ok: false, reason: "bad_signature" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(base64UrlDecode(payloadB64).toString("utf8"));
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (
    !parsed ||
    typeof parsed !== "object" ||
    typeof (parsed as ShareTokenPayload).fileId !== "string" ||
    typeof (parsed as ShareTokenPayload).exp !== "number" ||
    ((parsed as ShareTokenPayload).mode !== "view" &&
      (parsed as ShareTokenPayload).mode !== "download")
  ) {
    return { ok: false, reason: "malformed" };
  }
  const payload = parsed as ShareTokenPayload;
  if (payload.exp < Date.now()) {
    return { ok: false, reason: "expired" };
  }
  return { ok: true, payload };
}
