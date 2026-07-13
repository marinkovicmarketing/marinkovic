import "dotenv/config";
import { Bot } from "grammy";
import { prisma } from "@/lib/prisma";
import { getFreeTips, getVipTickets, getSpecialTip } from "@/lib/data";
import { formatFreeTips, formatVipTickets } from "@/lib/telegramFormat";

const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
if (!token) {
  console.error("TELEGRAM_BOT_TOKEN nije podešen u .env. Prekidam.");
  process.exit(1);
}

const bot = new Bot(token);

bot.command("start", async (ctx) => {
  const chatId = String(ctx.chat.id);
  await prisma.telegramSubscriber.upsert({
    where: { chatId },
    create: { chatId, username: ctx.from?.username },
    update: { username: ctx.from?.username },
  });
  await ctx.reply(
    "Zdravo! 👋 Ja sam AI bot za fudbalske tipove.\n\n" +
      "/tipovi — 3 besplatna tipa za danas\n" +
      "/vip — VIP tiketi (kvota 3 / 7 / 15 / 20-30)\n" +
      "/vipkod <kod> — otključaj VIP pristup unosom koda",
  );
});

bot.command("tipovi", async (ctx) => {
  const [tips, specialTip] = await Promise.all([getFreeTips(), getSpecialTip()]);
  await ctx.reply(formatFreeTips(tips, Boolean(specialTip)), { parse_mode: "Markdown" });
});

bot.command("vip", async (ctx) => {
  const chatId = String(ctx.chat.id);
  const subscriber = await prisma.telegramSubscriber.findUnique({ where: { chatId } });

  if (!subscriber?.isVip) {
    await ctx.reply(
      "🔒 VIP tipovi su dostupni uz kod.\n\n" +
        "Otključaj sa: `/vipkod TVOJ_KOD`\n" +
        "Nemaš kod? Javi nam se da dogovorimo pristup.",
      { parse_mode: "Markdown" },
    );
    return;
  }

  const [tickets, specialTip] = await Promise.all([getVipTickets(), getSpecialTip()]);
  await ctx.reply(formatVipTickets(tickets, specialTip), { parse_mode: "Markdown" });
});

bot.command("vipkod", async (ctx) => {
  const code = ctx.match?.toString().trim();
  const expected = process.env.VIP_ACCESS_CODE?.trim();
  const chatId = String(ctx.chat.id);

  if (!code) {
    await ctx.reply("Upotreba: `/vipkod TVOJ_KOD`", { parse_mode: "Markdown" });
    return;
  }
  if (!expected || code !== expected) {
    await ctx.reply("❌ Pogrešan kod.");
    return;
  }

  await prisma.telegramSubscriber.upsert({
    where: { chatId },
    create: { chatId, username: ctx.from?.username, isVip: true },
    update: { isVip: true },
  });
  await ctx.reply("✅ VIP pristup otključan! Kucaj /vip da vidiš današnje tikete.");
});

bot.catch((err) => {
  console.error("Bot greška:", err);
});

console.log("Telegram bot pokrenut (long polling)...");
bot.start();
