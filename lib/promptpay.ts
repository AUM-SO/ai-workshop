// PromptPay QR payload (EMVCo merchant-presented QR, Thai QR Payment spec).
// Safe to import in client components.

function field(id: string, value: string) {
  return `${id}${String(value.length).padStart(2, "0")}${value}`;
}

/** CRC-16/CCITT-FALSE, as the EMVCo spec requires for tag 63. */
function crc16(data: string) {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Builds the string to encode in a PromptPay QR.
 * @param id mobile number (0XXXXXXXXX) or 13-digit national / tax id
 * @param amount baht; omit for an open amount
 */
export function promptPayPayload(id: string, amount?: number) {
  const digits = id.replace(/\D/g, "");
  // Mobile numbers become 0066 + number without the leading 0, padded to 13 digits.
  const target = digits.length === 13 ? field("02", digits) : field("01", `0066${digits.replace(/^0/, "")}`.padStart(13, "0"));
  const merchant = field("29", field("00", "A000000677010111") + target);
  const parts = [
    field("00", "01"),
    field("01", amount ? "12" : "11"), // 12 = one-time QR with an amount
    merchant,
    field("53", "764"), // THB
    amount ? field("54", amount.toFixed(2)) : "",
    field("58", "TH"),
  ].join("");
  const withCrcTag = `${parts}6304`;
  return withCrcTag + crc16(withCrcTag);
}

/** Masks a PromptPay id for display, e.g. 081-xxx-5678. */
export function maskPromptPay(id: string) {
  return id.length === 13 ? `${id.slice(0, 1)}-xxxx-xxxxx-${id.slice(10, 12)}-${id.slice(12)}` : `${id.slice(0, 3)}-xxx-${id.slice(6)}`;
}
