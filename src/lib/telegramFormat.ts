import { tierLabel } from "@/lib/data";
import type { Match, Tip, Ticket, TicketTip } from "@/generated/prisma";

type TipWithMatch = Tip & { match: Match };
type TicketWithTips = Ticket & { ticketTips: (TicketTip & { tip: TipWithMatch })[] };

export function formatFreeTips(tips: TipWithMatch[], hasSpecial = false): string {
  if (tips.length === 0) {
    return "Die heutigen Tipps sind noch nicht bereit. Versuch es später noch einmal. ⏳";
  }
  const lines = tips.map((tip, i) => {
    return (
      `${i + 1}. *${tip.match.homeTeam} — ${tip.match.awayTeam}* (${tip.match.league})\n` +
      `   ${tip.market}: *${tip.pick}* @ ${tip.odds.toFixed(2)}\n` +
      `   _${tip.reasoning}_`
    );
  });
  let message = `🎯 *Kostenlose Tipps für heute*\n\n${lines.join("\n\n")}`;
  if (hasSpecial) {
    message += "\n\n🌟 Es gibt auch den *Spezial-Tipp des Tages* — den sichersten KI-Pick, nur für VIP. Tippe /vip.";
  }
  return message;
}

export function formatSpecialTip(tip: TipWithMatch): string {
  return (
    `🌟 *Spezial-Tipp des Tages*\n` +
    `${tip.match.homeTeam} — ${tip.match.awayTeam} (${tip.match.league})\n` +
    `${tip.market}: *${tip.pick}* @ ${tip.odds.toFixed(2)}\n` +
    `_${tip.reasoning}_`
  );
}

export function formatVipTickets(tickets: TicketWithTips[], specialTip?: TipWithMatch | null): string {
  const parts: string[] = [];
  if (specialTip) parts.push(formatSpecialTip(specialTip));

  if (tickets.length === 0) {
    parts.push("Die heutigen VIP-Scheine sind noch nicht bereit. Versuch es später noch einmal. ⏳");
  } else {
    const blocks = tickets.map((ticket) => {
      const legs = ticket.ticketTips
        .map(
          ({ tip }) =>
            `• ${tip.match.homeTeam} — ${tip.match.awayTeam}: *${tip.pick}* @ ${tip.odds.toFixed(2)}`,
        )
        .join("\n");
      return `🏆 *${tierLabel(ticket.tier)}* (Gesamtquote ${ticket.totalOdds.toFixed(2)})\n${legs}`;
    });
    parts.push(blocks.join("\n\n"));
  }

  return `💎 *Heutige VIP-Tipps*\n\n${parts.join("\n\n")}`;
}
