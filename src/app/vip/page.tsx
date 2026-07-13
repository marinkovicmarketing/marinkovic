import { getVipTickets, getSpecialTip, tierLabel } from "@/lib/data";
import { getPaymentInfo } from "@/lib/payment";
import { hasVipAccess } from "./actions";
import { UnlockForm } from "./UnlockForm";
import type { TicketTier } from "@/generated/prisma";

export const dynamic = "force-dynamic";

const TIER_ORDER: TicketTier[] = ["KVOTA_3", "KVOTA_7", "KVOTA_15", "KVOTA_20_30"];

export default async function VipPage() {
  const unlocked = await hasVipAccess();

  if (!unlocked) {
    const { price, paypalUrl, paypalRaw, contactTelegram } = getPaymentInfo();
    const contactHref = contactTelegram ? `https://t.me/${contactTelegram.replace(/^@/, "")}` : null;

    return (
      <div className="mx-auto max-w-lg text-center">
        <h1 className="text-3xl font-extrabold">VIP-Tipps</h1>
        <p className="mt-3 text-neutral-400">
          Sorgfältig zusammengestellte Scheine mit gezielten Quoten — <strong>Quote 3</strong>,{" "}
          <strong>Quote 7</strong>, <strong>Quote 15</strong> und <strong>Quote 20-30</strong> —
          kombiniert aus den sichersten KI-Tipps des Tages.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {["Quote 3", "Quote 7", "Quote 15", "Quote 20-30"].map((label) => (
            <div
              key={label}
              className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 blur-[3px] select-none"
            >
              <p className="text-xs text-neutral-500">{label}</p>
              <p className="mt-1 text-lg font-bold">🔒 🔒 🔒</p>
            </div>
          ))}
        </div>

        {(paypalRaw || contactHref) && (
          <div className="mt-8 rounded-xl border border-neutral-800 bg-neutral-900 p-5 text-left">
            <p className="text-sm font-bold text-emerald-400">So bekommst du VIP-Zugang</p>
            <ol className="mt-3 space-y-2 text-sm text-neutral-300">
              <li>
                1. Bezahle {price ?? "den VIP-Betrag"} per PayPal an{" "}
                {paypalUrl ? (
                  <a href={paypalUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-400 underline">
                    {paypalRaw}
                  </a>
                ) : (
                  <span className="font-semibold">{paypalRaw ?? "unserem PayPal"}</span>
                )}
                .
              </li>
              <li>
                2. Schick uns den Zahlungsbeleg (Screenshot) auf Telegram
                {contactHref ? (
                  <>
                    {" "}
                    an{" "}
                    <a href={contactHref} target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-400 underline">
                      {contactTelegram}
                    </a>
                  </>
                ) : null}
                .
              </li>
              <li>3. Wir schicken dir deinen persönlichen VIP-Code zurück.</li>
              <li>4. Gib den Code unten ein und schon bist du drin.</li>
            </ol>
          </div>
        )}

        <UnlockForm />

        <p className="mt-6 text-sm text-neutral-500">
          Hast du schon bezahlt, aber noch keinen Code?{" "}
          {contactHref ? (
            <a href={contactHref} target="_blank" rel="noopener noreferrer" className="underline">
              Melde dich auf Telegram
            </a>
          ) : (
            "Melde dich bei uns auf Telegram."
          )}
        </p>
      </div>
    );
  }

  const [tickets, specialTip] = await Promise.all([getVipTickets(), getSpecialTip()]);
  const byTier = new Map(tickets.map((t) => [t.tier, t]));

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-extrabold">Heutige VIP-Tipps</h1>

      {specialTip && (
        <section className="rounded-xl border border-amber-500/50 bg-gradient-to-br from-amber-500/10 to-neutral-900 p-5">
          <p className="text-sm font-bold text-amber-400">🌟 Spezial-Tipp des Tages</p>
          <p className="mt-2 text-lg font-semibold">
            {specialTip.match.homeTeam} — {specialTip.match.awayTeam}{" "}
            <span className="text-neutral-500 text-sm">({specialTip.match.league})</span>
          </p>
          <div className="mt-3 flex items-center justify-between rounded-lg bg-neutral-800 px-3 py-2">
            <div>
              <p className="text-xs text-neutral-400">{specialTip.market}</p>
              <p className="font-bold text-amber-400">{specialTip.pick}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-neutral-400">Quote</p>
              <p className="font-bold">{specialTip.odds.toFixed(2)}</p>
            </div>
          </div>
          <p className="mt-2 text-sm text-neutral-300">{specialTip.reasoning}</p>
          <p className="mt-2 text-xs text-neutral-500">KI-Vertrauen: {specialTip.confidence}%</p>
        </section>
      )}

      {tickets.length === 0 && (
        <p className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 text-center text-neutral-400">
          Die heutigen VIP-Scheine wurden noch nicht erstellt. Schau später noch einmal vorbei.
        </p>
      )}
      {TIER_ORDER.map((tier) => {
        const ticket = byTier.get(tier);
        if (!ticket) return null;
        return (
          <section key={tier} className="rounded-xl border border-emerald-800/50 bg-neutral-900 p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-bold text-emerald-400">{tierLabel(tier)}</h2>
              <p className="text-sm text-neutral-400">
                Gesamtquote: <span className="font-bold text-neutral-100">{ticket.totalOdds.toFixed(2)}</span>
              </p>
            </div>
            <ul className="mt-3 divide-y divide-neutral-800">
              {ticket.ticketTips.map(({ tip }) => (
                <li key={tip.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <p className="font-medium">
                      {tip.match.homeTeam} — {tip.match.awayTeam}
                    </p>
                    <p className="text-neutral-400">
                      {tip.market}: <span className="text-emerald-400">{tip.pick}</span>
                    </p>
                  </div>
                  <span className="font-semibold">{tip.odds.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
