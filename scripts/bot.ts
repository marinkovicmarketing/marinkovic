import "dotenv/config";
import { Bot } from "grammy";
import { prisma } from "@/lib/prisma";
import { getFreeTips, getVipTickets, getSpecialTip } from "@/lib/data";
import { formatFreeTips, formatVipTickets } from "@/lib/telegramFormat";

const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
if (!token) {
  console.error("TELEGRAM_BOT_TOKEN ist nicht in .env gesetzt. Breche ab.");
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
    "Hallo! 👋 Ich bin dein KI-Bot für Fußballtipps.\n\n" +
      "/tipps — 3 kostenlose Tipps für heute\n" +
      "/vip — VIP-Scheine (Quote 3 / 7 / 15 / 20-30)\n" +
      "/vipcode <code> — VIP-Zugang mit Code freischalten",
  );
});

bot.command("tipps", async (ctx) => {
  const [tips, specialTip] = await Promise.all([getFreeTips(), getSpecialTip()]);
  await ctx.reply(formatFreeTips(tips, Boolean(specialTip)), { parse_mode: "Markdown" });
});

bot.command("vip", async (ctx) => {
  const chatId = String(ctx.chat.id);
  const subscriber = await prisma.telegramSubscriber.findUnique({ where: { chatId } });

  if (!subscriber?.isVip) {
    await ctx.reply(
      "🔒 VIP-Tipps sind nur mit Code verfügbar.\n\n" +
        "Freischalten mit: `/vipcode DEIN_CODE`\n" +
        "Kein Code? Melde dich bei uns, um den Zugang zu vereinbaren.",
      { parse_mode: "Markdown" },
    );
    return;
  }

  const [tickets, specialTip] = await Promise.all([getVipTickets(), getSpecialTip()]);
  await ctx.reply(formatVipTickets(tickets, specialTip), { parse_mode: "Markdown" });
});

bot.command("vipcode", async (ctx) => {
  const code = ctx.match?.toString().trim();
  const expected = process.env.VIP_ACCESS_CODE?.trim();
  const chatId = String(ctx.chat.id);

  if (!code) {
    await ctx.reply("Verwendung: `/vipcode DEIN_CODE`", { parse_mode: "Markdown" });
    return;
  }
  if (!expected || code !== expected) {
    await ctx.reply("❌ Falscher Code.");
    return;
  }

  await prisma.telegramSubscriber.upsert({
    where: { chatId },
    create: { chatId, username: ctx.from?.username, isVip: true },
    update: { isVip: true },
  });
  await ctx.reply("✅ VIP-Zugang freigeschaltet! Tippe /vip, um die heutigen Scheine zu sehen.");
});

bot.catch((err) => {
  console.error("Bot-Fehler:", err);
});

console.log("Telegram-Bot gestartet (Long Polling)...");
bot.start();
