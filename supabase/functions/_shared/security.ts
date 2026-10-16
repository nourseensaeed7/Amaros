// supabase/functions/_shared/security.ts
//
// Small helpers shared by the edge functions. No remote imports, so this file
// also runs under Node for the self-check in security.test.ts.

const enc = new TextEncoder();

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Booking token: proves the caller is the browser that created this reservation.
// Derived from a server-only secret, so no extra DB column is needed.
export const bookingToken = (secret: string, reservationId: unknown) =>
  hmacHex(secret, `booking:${reservationId}`);

export async function verifyBookingToken(secret: string, reservationId: unknown, token: unknown) {
  if (typeof token !== "string" || token.length !== 64) return false;
  const expected = await bookingToken(secret, reservationId);
  let diff = 0; // constant-time compare
  for (let i = 0; i < 64; i++) diff |= expected.charCodeAt(i) ^ token.charCodeAt(i);
  return diff === 0;
}

// Escape user-supplied text before putting it into email HTML.
export const esc = (v: unknown) =>
  String(v ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

// Upload paths the browser may reference: "<folder>/<uuid>.<ext>" in the files bucket.
export const isUploadPath = (p: unknown, folder: string) =>
  typeof p === "string" && new RegExp(`^${folder}/[0-9a-f-]{36}\\.[a-z0-9]{1,5}$`, "i").test(p);

export const signedContractPath = (reservationId: number) =>
  `${reservationId}/Mietvertrag_${String(reservationId).padStart(6, "0")}_signed.pdf`;
