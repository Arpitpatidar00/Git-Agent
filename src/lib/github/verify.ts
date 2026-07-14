import crypto from "crypto";

/**
 * Verifies the HMAC SHA-256 signature of a GitHub webhook payload.
 * Pure function (Tier 1) — no I/O, easy to unit test.
 *
 * @param payload   - The raw request body string
 * @param signature - The X-Hub-Signature-256 header value (e.g., "sha256=abc123...")
 * @param secret    - The webhook secret used to sign the payload
 * @returns true if the signature is valid, false otherwise
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  if (!signature || !secret) {
    return false;
  }

  const sigParts = signature.split("=");
  if (sigParts.length !== 2 || sigParts[0] !== "sha256") {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload, "utf8")
    .digest("hex");

  const sigBuffer = Buffer.from(sigParts[1], "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");

  if (sigBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
}
