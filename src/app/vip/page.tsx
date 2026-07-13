import { getVipTickets, tierLabel } from "@/lib/data";
import { hasVipAccess } from "./actions";
import { UnlockForm } from "./UnlockForm";
import type { TicketTier } from "@/generated/prisma";

export const dynamic = "force-dynamic";

const TIER_ORDER: TicketTier[] = ["KVOTA_3", "KVOTA_7", "KVOTA_15", "KVOTA_20_30"];

export default async function VipPage() {
  const unlocked = await hasVipAccess();

  if (!unlocked) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <h1 className="text-3xl font-extrabold">VIP tipovi</h1>
        <p className="mt-3 text-neutral-400">
          Pažljivo sastavljeni tiketi po ciljanim kvotama — <strong>kvota 3</strong>,{" "}
          <strong>kvota 7</strong>, <strong>kvota 15</strong> i <strong>kvota 20-30</strong> —
          kombinovani od najsigurnijih AI tipova dana.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {["Kvota 3", "Kvota 7", "Kvota 15", "Kvota 20-30"].map((label) => (
            <div
              key={label}
              className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 blur-[3px] select-none"
            >
              <p className="text-xs text-neutral-500">{label}</p>
              <p className="mt-1 text-lg font-bold">🔒 🔒 🔒</p>
            </div>
          ))}
        </div>

        <UnlockForm />

        <p className="mt-6 text-sm text-neutral-500">
          Nemaš VIP kod? Javi nam se na Telegram da dogovorimo pristup — plaćanje na sajtu stiže uskoro.
        </p>
      </div>
    );
  }

  const tickets = await getVipTickets();
  const byTier = new Map(tickets.map((t) => [t.tier, t]));

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-extrabold">VIP tipovi za danas</h1>
      {tickets.length === 0 && (
        <p className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 text-center text-neutral-400">
          VIP tiketi za danas još nisu generisani. Vrati se malo kasnije.
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
                Ukupna kvota: <span className="font-bold text-neutral-100">{ticket.totalOdds.toFixed(2)}</span>
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
