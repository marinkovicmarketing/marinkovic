import Link from "next/link";
import { getFreeTips } from "@/lib/data";
import { TipCard } from "@/components/TipCard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const freeTips = await getFreeTips();

  return (
    <div className="space-y-10">
      <section className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Svaki dan <span className="text-emerald-400">3 besplatna</span> AI fudbalska tipa
        </h1>
        <p className="mt-3 text-neutral-400">
          Analiza forme timova i statistike, svaki dan sveža. Za sigurnije tikete i veće kvote pogledaj VIP ponudu.
        </p>
        <Link
          href="/vip"
          className="mt-5 inline-block rounded-full bg-emerald-500 px-6 py-3 font-semibold text-neutral-950 hover:bg-emerald-400"
        >
          Vidi VIP tipove (kvota 3 / 7 / 15 / 20-30)
        </Link>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">Današnji besplatni tipovi</h2>
        {freeTips.length === 0 ? (
          <p className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 text-center text-neutral-400">
            Tipovi za danas još nisu generisani. Vrati se malo kasnije.
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
