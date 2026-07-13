/** Manual PayPal payment flow config — pre-payment-automation stopgap, see VIP_ACCESS_CODE. */
export function getPaymentInfo() {
  const price = process.env.VIP_PRICE?.trim() || null;
  const paypalRaw = process.env.VIP_PAYPAL_LINK?.trim() || null;
  // A PayPal.me link/URL can be a clickable "pay now" button. A plain email address
  // can't — PayPal has no reliable universal link for "send money to this email" — so
  // show it as text to copy instead of a (broken) link.
  const isEmail = paypalRaw?.includes("@") ?? false;
  const paypalUrl = paypalRaw && !isEmail ? (paypalRaw.startsWith("http") ? paypalRaw : `https://${paypalRaw}`) : null;
  const contactTelegram = process.env.VIP_CONTACT_TELEGRAM?.trim() || null;

  return { price, paypalRaw, paypalUrl, contactTelegram };
}

export function formatPaymentInstructions(): string {
  const { price, paypalRaw, contactTelegram } = getPaymentInfo();
  if (!paypalRaw && !contactTelegram) {
    return "Kein Code? Melde dich bei uns, um den Zugang zu vereinbaren.";
  }
  const lines = [
    `1. Bezahle ${price ?? "den VIP-Betrag"} per PayPal an ${paypalRaw ?? "unserem PayPal"}.`,
    `2. Schick uns den Zahlungsbeleg auf Telegram${contactTelegram ? ` an ${contactTelegram}` : ""}.`,
    "3. Wir schicken dir deinen persönlichen VIP-Code zurück.",
    "4. Freischalten mit: `/vipcode DEIN_CODE`",
  ];
  return lines.join("\n");
}
