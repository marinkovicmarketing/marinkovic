import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { fetchTodayFixtures, mockFixtures } from "@/lib/football";
import { generateTipsForFixtures } from "@/lib/generateTips";
import { todaySlateDate } from "@/lib/date";
import { TIERS, buildTicketForTarget, combinedOdds } from "@/lib/tickets";

async function main() {
  const slateDate = todaySlateDate();
  const useMock = !process.env.API_FOOTBALL_KEY?.trim();

  console.log(`Generišem tipove za ${slateDate}${useMock ? " (mock fixtures — API_FOOTBALL_KEY nije podešen)" : ""}...`);

  const fixtures = useMock ? mockFixtures(slateDate) : await fetchTodayFixtures(slateDate);
  if (fixtures.length === 0) {
    console.log("Nema mečeva za danas u pratećim ligama. Prekidam.");
    return;
  }
  console.log(`Pronađeno ${fixtures.length} mečeva.`);

  const generated = await generateTipsForFixtures(fixtures);
  console.log(`Claude je predložio ${generated.length} tipova.`);
  if (generated.length === 0) {
    console.log("Nema validnih tipova. Prekidam.");
    return;
  }

  // Wipe today's slate so re-running the script is idempotent.
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
  const freeSaved = Math.max(0, Math.min(freeEnd, savedTips.length) - freeStart);
  console.log(`Sačuvano ${savedTips.length} tipova (1 specijal, ${freeSaved} besplatna).`);

  let ticketsCreated = 0;
  for (const { tier, min, max } of TIERS) {
    const legs = buildTicketForTarget(savedTips, min, max);
    if (!legs || legs.length === 0) {
      console.log(`Preskačem ${tier} — nema dovoljno tipova za tu kvotu danas.`);
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
    console.log(`Kreiran tiket ${tier}: ${legs.length} tipova, ukupna kvota ${ticket.totalOdds}`);
  }

  console.log(`Gotovo. Kreirano ${ticketsCreated} VIP tiketa za ${slateDate}.`);
}

main()
  .catch((err) => {
    console.error("Greška pri generisanju tipova:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
