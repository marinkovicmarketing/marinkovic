/** Manual PayPal payment flow config — pre-payment-automation stopgap, see VIP_ACCESS_CODE. */
export function getPaymentInfo() {
  const price = process.env.VIP_PRICE?.trim() || null;
  const paypalRaw = process.env.VIP_PAYPAL_LINK?.trim() || null;
  const paypalUrl = paypalRaw ? (paypalRaw.startsWith("http") ? paypalRaw : `https://${paypalRaw}`) : null;
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
