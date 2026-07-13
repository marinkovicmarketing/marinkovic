import { prisma } from "@/lib/prisma";
import { fetchTodayFixtures, mockFixtures } from "@/lib/football";
import { generateTipsForFixtures } from "@/lib/generateTips";
import { todaySlateDate } from "@/lib/date";
import { TIERS, buildTicketForTarget, combinedOdds } from "@/lib/tickets";

export type GenerationSummary = {
  slateDate: string;
  usedMock: boolean;
  fixturesFound: number;
  tipsSaved: number;
  freeTipsSaved: number;
  ticketsCreated: number;
  /** Operator-facing log lines (Serbian), safe to print or return from an API route. */
  messages: string[];
};

/**
 * Runs the full daily pipeline: fetch fixtures, ask Claude for tips, save Tip/Ticket
 * rows. Wipes and regenerates today's slate, so it's safe to call more than once a day
 * (e.g. a retry after a transient API-Football/Claude failure). Does not disconnect the
 * shared Prisma client — callers running as a one-shot process should do that themselves.
 */
export async function generateDailySlate(): Promise<GenerationSummary> {
  const messages: string[] = [];
  const log = (m: string) => messages.push(m);

  const slateDate = todaySlateDate();
  const usedMock = !process.env.API_FOOTBALL_KEY?.trim();

  log(
    `Generišem tipove za ${slateDate}${usedMock ? " (mock fixtures — API_FOOTBALL_KEY nije podešen)" : ""}...`,
  );

  const fixtures = usedMock ? mockFixtures(slateDate) : await fetchTodayFixtures(slateDate);
  if (fixtures.length === 0) {
    log("Nema mečeva za danas u pratećim ligama. Prekidam.");
    return { slateDate, usedMock, fixturesFound: 0, tipsSaved: 0, freeTipsSaved: 0, ticketsCreated: 0, messages };
  }
  log(`Pronađeno ${fixtures.length} mečeva.`);

  const generated = await generateTipsForFixtures(fixtures);
  log(`Claude je predložio ${generated.length} tipova.`);
  if (generated.length === 0) {
    log("Nema validnih tipova. Prekidam.");
    return {
      slateDate,
      usedMock,
      fixturesFound: fixtures.length,
      tipsSaved: 0,
      freeTipsSaved: 0,
      ticketsCreated: 0,
      messages,
    };
  }

  // Wipe today's slate so re-running is idempotent.
  const existingMatches = await prisma.match.findMany({
    where: { tips: { some: { slateDate } } },
    select: { id: true },
  });
  await prisma.ticket.deleteMany({ where: { slateDate } });
  await prisma.tip.deleteMany({ where: { slateDate } });
  if (existingMatches.length > 0) {
    await prisma.match.deleteMany({ where: { id: { in: existingMatches.map((m) => m.id) } } });
  }

  const matchByIndex = new Map<number, string>();
  for (const [i, f] of fixtures.entries()) {
    const match = await prisma.match.upsert({
      where: { apiFootballId: f.fixtureId },
      create: {
        apiFootballId: f.fixtureId,
        league: f.league,
        homeTeam: f.homeTeam,
        awayTeam: f.awayTeam,
        kickoff: new Date(f.kickoff),
      },
      update: {
        league: f.league,
        homeTeam: f.homeTeam,
        awayTeam: f.awayTeam,
        kickoff: new Date(f.kickoff),
      },
    });
    matchByIndex.set(i, match.id);
  }

  // Sorted by confidence: #0 is the "Specijal" tip (VIP-exclusive, our single best
  // pick of the day), #1-3 are the free teaser tips, the rest only appear in tickets.
  const sorted = [...generated].sort((a, b) => b.confidence - a.confidence);
  const freeStart = 1;
  const freeEnd = 4;

  const savedTips: { id: string; odds: number; confidence: number }[] = [];
  for (const [i, tip] of sorted.entries()) {
    const matchId = matchByIndex.get(tip.fixtureIndex);
    if (!matchId) continue;
    const saved = await prisma.tip.create({
      data: {
        matchId,
        market: tip.market,
        pick: tip.pick,
        odds: tip.estimatedOdds,
        confidence: tip.confidence,
        reasoning: tip.reasoning,
        isSpecial: i === 0,
        isFree: i >= freeStart && i < freeEnd,
        slateDate,
      },
    });
    savedTips.push({ id: saved.id, odds: saved.odds, confidence: saved.confidence });
  }
  const freeTipsSaved = Math.max(0, Math.min(freeEnd, savedTips.length) - freeStart);
  log(`Sačuvano ${savedTips.length} tipova (1 specijal, ${freeTipsSaved} besplatna).`);

  let ticketsCreated = 0;
  for (const { tier, min, max } of TIERS) {
    const legs = buildTicketForTarget(savedTips, min, max);
    if (!legs || legs.length === 0) {
      log(`Preskačem ${tier} — nema dovoljno tipova za tu kvotu danas.`);
      continue;
    }
    const ticket = await prisma.ticket.create({
      data: {
        slateDate,
        tier,
        totalOdds: Number(combinedOdds(legs).toFixed(2)),
        ticketTips: { create: legs.map((l) => ({ tipId: l.id })) },
      },
    });
    ticketsCreated++;
    log(`Kreiran tiket ${tier}: ${legs.length} tipova, ukupna kvota ${ticket.totalOdds}`);
  }

  log(`Gotovo. Kreirano ${ticketsCreated} VIP tiketa za ${slateDate}.`);

  return {
    slateDate,
    usedMock,
    fixturesFound: fixtures.length,
    tipsSaved: savedTips.length,
    freeTipsSaved,
    ticketsCreated,
    messages,
  };
}
