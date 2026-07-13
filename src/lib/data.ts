import { prisma } from "@/lib/prisma";
import { todaySlateDate } from "@/lib/date";

export async function getFreeTips(slateDate = todaySlateDate()) {
  return prisma.tip.findMany({
    where: { slateDate, isFree: true },
    include: { match: true },
    orderBy: { confidence: "desc" },
  });
}

export async function getVipTickets(slateDate = todaySlateDate()) {
  return prisma.ticket.findMany({
    where: { slateDate },
    include: { ticketTips: { include: { tip: { include: { match: true } } } } },
    orderBy: { totalOdds: "asc" },
  });
}

const TIER_LABELS: Record<string, string> = {
  KVOTA_3: "Kvota 3",
  KVOTA_7: "Kvota 7",
  KVOTA_15: "Kvota 15",
  KVOTA_20_30: "Kvota 20-30",
};

export function tierLabel(tier: string) {
  return TIER_LABELS[tier] ?? tier;
}
