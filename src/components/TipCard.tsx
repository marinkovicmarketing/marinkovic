type TipCardProps = {
  league: string;
  homeTeam: string;
  awayTeam: string;
  kickoff: Date;
  market: string;
  pick: string;
  odds: number;
  confidence: number;
  reasoning: string;
};

export function TipCard({
  league,
  homeTeam,
  awayTeam,
  kickoff,
  market,
  pick,
  odds,
  confidence,
  reasoning,
}: TipCardProps) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
      <div className="flex items-center justify-between text-xs text-neutral-400">
        <span>{league}</span>
        <span>
          {kickoff.toLocaleString("de-DE", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
      <p className="mt-1 text-base font-semibold">
        {homeTeam} <span className="text-neutral-500">—</span> {awayTeam}
      </p>
      <div className="mt-3 flex items-center justify-between rounded-lg bg-neutral-800 px-3 py-2">
        <div>
          <p className="text-xs text-neutral-400">{market}</p>
          <p className="font-bold text-emerald-400">{pick}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-neutral-400">Quote</p>
          <p className="font-bold">{odds.toFixed(2)}</p>
        </div>
      </div>
      <p className="mt-2 text-sm text-neutral-300">{reasoning}</p>
      <p className="mt-2 text-xs text-neutral-500">KI-Vertrauen: {confidence}%</p>
    </div>
  );
}
