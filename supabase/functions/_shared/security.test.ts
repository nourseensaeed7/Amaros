// Self-check: node --experimental-strip-types supabase/functions/_shared/security.test.ts
import assert from "node:assert/strict";
import { bookingToken, verifyBookingToken, esc, isUploadPath, signedContractPath } from "./security.ts";

const t = await bookingToken("s3cret", 42);
assert.equal(t.length, 64);
assert.equal(await verifyBookingToken("s3cret", 42, t), true);
assert.equal(await verifyBookingToken("s3cret", 43, t), false, "token must not work for another id");
assert.equal(await verifyBookingToken("other", 42, t), false, "token must depend on the secret");
assert.equal(await verifyBookingToken("s3cret", 42, undefined), false);
assert.equal(await verifyBookingToken("s3cret", 42, "0".repeat(64)), false);

assert.equal(esc(`<img src=x onerror="a()">&'`), "&lt;img src=x onerror=&quot;a()&quot;&gt;&amp;&#39;");
assert.equal(esc(null), "");

assert.equal(isUploadPath("id_front/0b9f0c1e-6a1d-4f7e-9a51-2a3c4d5e6f70.jpg", "id_front"), true);
assert.equal(isUploadPath("id_front/id_front_1700000000.jpg", "id_front"), false);
assert.equal(isUploadPath("../contracts/x.pdf", "id_front"), false);
assert.equal(isUploadPath("id_back/0b9f0c1e-6a1d-4f7e-9a51-2a3c4d5e6f70.jpg", "id_front"), false);

assert.equal(signedContractPath(7), "7/Mietvertrag_000007_signed.pdf");
console.log("security.ts self-check: all assertions passed");
