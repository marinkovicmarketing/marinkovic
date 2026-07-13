import { tierLabel } from "@/lib/data";
import type { Match, Tip, Ticket, TicketTip } from "@/generated/prisma";

type TipWithMatch = Tip & { match: Match };
type TicketWithTips = Ticket & { ticketTips: (TicketTip & { tip: TipWithMatch })[] };

export function formatFreeTips(tips: TipWithMatch[]): string {
  if (tips.length === 0) {
    return "Tipovi za danas još nisu spremni. Probaj malo kasnije. ⏳";
  }
  const lines = tips.map((tip, i) => {
    return (
      `${i + 1}. *${tip.match.homeTeam} — ${tip.match.awayTeam}* (${tip.match.league})\n` +
      `   ${tip.market}: *${tip.pick}* @ ${tip.odds.toFixed(2)}\n` +
      `   _${tip.reasoning}_`
    );
  });
  return `🎯 *Besplatni tipovi za danas*\n\n${lines.join("\n\n")}`;
}

export function formatVipTickets(tickets: TicketWithTips[]): string {
  if (tickets.length === 0) {
    return "VIP tiketi za danas još nisu spremni. Probaj malo kasnije. ⏳";
  }
  const blocks = tickets.map((ticket) => {
    const legs = ticket.ticketTips
      .map(
        ({ tip }) =>
          `• ${tip.match.homeTeam} — ${tip.match.awayTeam}: *${tip.pick}* @ ${tip.odds.toFixed(2)}`,
      )
      .join("\n");
    return `🏆 *${tierLabel(ticket.tier)}* (ukupna kvota ${ticket.totalOdds.toFixed(2)})\n${legs}`;
  });
  return `💎 *VIP tipovi za danas*\n\n${blocks.join("\n\n")}`;
}
