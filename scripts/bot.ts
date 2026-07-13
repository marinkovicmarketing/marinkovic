import "dotenv/config";
import { createBot } from "@/lib/bot";

// Local dev only — long polling. Production runs the same bot via a webhook,
// see src/app/api/telegram/webhook/route.ts (Vercel has no persistent process
// for long polling to run in).
const bot = createBot();
console.log("Telegram-Bot gestartet (Long Polling)...");
bot.start();
