// Anti-scam: spot messages that ask for money outside the platform before a viewing.
// Deliberately broad; the result only shows a reminder to the tenant, it never blocks.

const PATTERNS = [
  /โอน(เงิน)?/,
  /เลขบัญชี|บัญชีธนาคาร|เลขที่บัญชี/,
  /พร้อม\s*เพย์|promptpay|prompt\s*pay/i,
  /มัดจำ\s*ก่อน|จ่าย\s*ก่อน|วาง\s*เงิน/,
  /ทรู\s*มันนี่|truemoney|wallet/i,
  /\b\d{3}-?\d-?\d{5}-?\d\b/, // Thai bank account number shapes
];

export function mentionsOffPlatformPayment(text: string) {
  return PATTERNS.some((pattern) => pattern.test(text));
}
