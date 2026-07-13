import Link from "next/link";
import { getFreeTips, getSpecialTip } from "@/lib/data";
import { TipCard } from "@/components/TipCard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [freeTips, specialTip] = await Promise.all([getFreeTips(), getSpecialTip()]);

  return (
    <div className="space-y-10">
      <section className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Jeden Tag <span className="text-emerald-400">3 kostenlose</span> KI-Fußballtipps
        </h1>
        <p className="mt-3 text-neutral-400">
          Frische Analyse von Teamform und Statistiken, jeden Tag neu. Für sicherere Scheine und höhere Quoten
          schau dir das VIP-Angebot an.
        </p>
        <Link
          href="/vip"
          className="mt-5 inline-block rounded-full bg-emerald-500 px-6 py-3 font-semibold text-neutral-950 hover:bg-emerald-400"
        >
          VIP-Tipps ansehen (Quote 3 / 7 / 15 / 20-30)
        </Link>
      </section>

      {specialTip && (
        <section>
          <Link
            href="/vip"
            className="block rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-neutral-900 p-5 transition hover:border-amber-500/70"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-amber-400">🌟 Spezial-Tipp des Tages</p>
              <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-neutral-950">
                VIP
              </span>
            </div>
            <p className="mt-2 font-semibold blur-[3px] select-none">
              {specialTip.match.homeTeam} — {specialTip.match.awayTeam}: {specialTip.market} @{" "}
              {specialTip.odds.toFixed(2)}
            </p>
            <p className="mt-2 text-sm text-amber-300">Mit VIP-Zugang freischalten →</p>
          </Link>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-xl font-bold">Heutige kostenlose Tipps</h2>
        {freeTips.length === 0 ? (
          <p className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 text-center text-neutral-400">
            Die heutigen Tipps wurden noch nicht erstellt. Schau später noch einmal vorbei.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {freeTips.map((tip) => (
              <TipCard
                key={tip.id}
                league={tip.match.league}
                homeTeam={tip.match.homeTeam}
                awayTeam={tip.match.awayTeam}
                kickoff={tip.match.kickoff}
                market={tip.market}
                pick={tip.pick}
                odds={tip.odds}
                confidence={tip.confidence}
                reasoning={tip.reasoning}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
