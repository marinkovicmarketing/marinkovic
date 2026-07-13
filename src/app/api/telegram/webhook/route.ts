import { webhookCallback } from "grammy";
import type { Bot } from "grammy";
import { createBot } from "@/lib/bot";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Lazily created so a missing TELEGRAM_BOT_TOKEN can't crash the build — only
// the first real webhook call fails, which is easy to see and fix.
let botInstance: Bot | null = null;
function getBot(): Bot {
  if (!botInstance) botInstance = createBot();
  return botInstance;
}

/**
 * Telegram calls this URL directly when a message arrives (see README for the
 * one-time `setWebhook` call). Optional `TELEGRAM_WEBHOOK_SECRET` is echoed back
 * by Telegram on every request if set on `setWebhook`, so we can reject anything
 * that isn't actually from Telegram.
 */
export async function POST(request: Request) {
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  if (expectedSecret) {
    const receivedSecret = request.headers.get("x-telegram-bot-api-secret-token");
    if (receivedSecret !== expectedSecret) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  try {
    const handleUpdate = webhookCallback(getBot(), "std/http");
    return await handleUpdate(request);
  } catch (err) {
    console.error("Telegram webhook error:", err);
    return new Response("Error", { status: 500 });
  }
}
