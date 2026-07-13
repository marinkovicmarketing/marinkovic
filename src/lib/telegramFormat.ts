import { tierLabel } from "@/lib/data";
import type { Match, Tip, Ticket, TicketTip } from "@/generated/prisma";

type TipWithMatch = Tip & { match: Match };
type TicketWithTips = Ticket & { ticketTips: (TicketTip & { tip: TipWithMatch })[] };

export function formatFreeTips(tips: TipWithMatch[], hasSpecial = false): string {
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
  let message = `🎯 *Besplatni tipovi za danas*\n\n${lines.join("\n\n")}`;
  if (hasSpecial) {
    message += "\n\n🌟 Imamo i *Specijal tip dana* — najpouzdaniji AI pick, samo za VIP. Kucaj /vip.";
  }
  return message;
}

export function formatSpecialTip(tip: TipWithMatch): string {
  return (
    `🌟 *Specijal tip dana*\n` +
    `${tip.match.homeTeam} — ${tip.match.awayTeam} (${tip.match.league})\n` +
    `${tip.market}: *${tip.pick}* @ ${tip.odds.toFixed(2)}\n` +
    `_${tip.reasoning}_`
  );
}

export function formatVipTickets(tickets: TicketWithTips[], specialTip?: TipWithMatch | null): string {
  const parts: string[] = [];
  if (specialTip) parts.push(formatSpecialTip(specialTip));

  if (tickets.length === 0) {
    parts.push("VIP tiketi za danas još nisu spremni. Probaj malo kasnije. ⏳");
  } else {
    const blocks = tickets.map((ticket) => {
      const legs = ticket.ticketTips
        .map(
          ({ tip }) =>
            `• ${tip.match.homeTeam} — ${tip.match.awayTeam}: *${tip.pick}* @ ${tip.odds.toFixed(2)}`,
        )
        .join("\n");
      return `🏆 *${tierLabel(ticket.tier)}* (ukupna kvota ${ticket.totalOdds.toFixed(2)})\n${legs}`;
    });
    parts.push(blocks.join("\n\n"));
  }

  return `💎 *VIP tipovi za danas*\n\n${parts.join("\n\n")}`;
}
