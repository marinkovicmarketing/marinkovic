# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

An AI-generated football (soccer) tips service: a Next.js site that publishes 3 free daily tips,
one VIP-exclusive "Specijal" tip (the day's single highest-confidence pick), and VIP parlay tickets
targeting specific combined odds (kvota 3 / 7 / 15 / 20-30), plus a Telegram bot that delivers the
same content. Tips are produced by a script that pulls fixtures/form from API-Football and asks
Claude to propose picks; there is no real-money payment integration yet — VIP access is gated by a
shared access code (`VIP_ACCESS_CODE`) shared manually with customers after a manual PayPal payment
(see `src/lib/payment.ts`).

## Development commands

```bash
npm install                 # install dependencies
npx prisma migrate deploy   # apply the Postgres schema (needs a real DATABASE_URL, e.g. Neon)
npm run dev                 # Next.js dev server (http://localhost:3000)
npm run build                # production build (also type-checks everything, incl. scripts/)
npm run generate:tips        # fetch fixtures, call Claude, populate today's tips + VIP tickets
npm run bot                  # run the Telegram bot locally (long polling)
npx tsc --noEmit             # type-check only
```

No test suite exists yet.

Required environment variables live in `.env` (see `.env` for the current placeholders):

- `DATABASE_URL` — Postgres connection string (e.g. Neon's free tier); SQLite was dropped because
  its on-disk file doesn't survive Vercel's serverless/ephemeral filesystem
- `ANTHROPIC_API_KEY` — required to run `generate:tips`
- `API_FOOTBALL_KEY` — optional; without it `generate:tips` falls back to mock fixtures for local dev
- `TELEGRAM_BOT_TOKEN` — required to run `npm run bot` or the webhook route
- `TELEGRAM_WEBHOOK_SECRET` — optional; if set, `POST /api/telegram/webhook` rejects requests whose
  `X-Telegram-Bot-Api-Secret-Token` header doesn't match (Telegram echoes it back once configured
  via `setWebhook`, see README)
- `VIP_ACCESS_CODE` — shared code that unlocks the VIP page/bot command until real payments exist
- `VIP_PRICE`, `VIP_PAYPAL_LINK`, `VIP_CONTACT_TELEGRAM` — displayed on the locked `/vip` page and
  in the bot's `/vip` reply as manual payment instructions; all optional (payment block/line is
  omitted where blank, see `src/lib/payment.ts`)
- `CRON_SECRET` — authorizes `GET /api/cron/generate-tips` (see below); optional locally, required
  in production or the endpoint is unauthenticated

## Architecture

**Data flow:** `src/lib/runGeneration.ts` (`generateDailySlate()`) is the only thing that writes tip
data, called from two entry points — `scripts/generate-tips.ts` (CLI, disconnects Prisma when done)
and `GET /api/cron/generate-tips` (HTTP, for schedulers; auth via `CRON_SECRET` as a Bearer header
or `?secret=` query param — see README for the Vercel Cron / VPS crontab setup). It fetches today's
fixtures (`src/lib/football.ts`, API-Football, mock fallback when no key is set), asks Claude for
structured tip candidates (`src/lib/generateTips.ts`, `output_config.format` json_schema on
`claude-opus-4-8`), saves them as `Tip` rows keyed by `slateDate` (`YYYY-MM-DD`, Europe/Vienna).
Sorted by confidence: tip #0 is marked `isSpecial` (the VIP-exclusive "Specijal" pick), #1-3 are
marked `isFree`, the rest exist only to fill out tickets. All tips (regardless of flags) are then
greedily combined into `Ticket` rows per kvota tier (`src/lib/tickets.ts` — `TIERS` defines the
target odds ranges). Re-running for the same day wipes and regenerates that day's data (idempotent).

**Two read surfaces share one data layer** (`src/lib/data.ts`: `getFreeTips`, `getSpecialTip`, `getVipTickets`):
- Web (`src/app/page.tsx`, `src/app/vip/page.tsx`) — Next.js App Router, Server Components, Prisma
  queried directly (no API routes for reads).
- Telegram bot (`src/lib/bot.ts`, `createBot()`) — command handlers, formats the same Prisma data as
  Markdown (`src/lib/telegramFormat.ts`). Two runners share this one bot instance: `scripts/bot.ts`
  calls `bot.start()` for local long-polling dev, `POST /api/telegram/webhook` wraps it in grammy's
  `webhookCallback(bot, "std/http")` for production — Vercel has no persistent process for long
  polling to live in, so the production bot is driven by Telegram calling that URL directly (set
  once via `setWebhook`, see README). Don't add bot logic to `scripts/bot.ts` directly; it belongs
  in `src/lib/bot.ts` so both runners get it.

**VIP gating (pre-payment stopgap):** `src/app/vip/actions.ts` is a Server Action that checks a
submitted code against `VIP_ACCESS_CODE` and sets an httpOnly cookie; the bot's `/vipcode` command
does the equivalent by flipping `TelegramSubscriber.isVip` in the DB. There is no real payment
processing — the locked `/vip` page and the bot's `/vip` reply both show manual PayPal instructions
(`src/lib/payment.ts`: pay → send proof on Telegram → operator manually shares the current
`VIP_ACCESS_CODE`). When a real payment processor is added, this whole mechanism (including
`payment.ts`) should be replaced, not extended.

**Prisma:** Postgres (`provider = "postgresql"` — see the `DATABASE_URL` note above for why not
SQLite). Schema in `prisma/schema.prisma`, generated client output goes to
`src/generated/prisma` (gitignored, regenerated by `prisma migrate` / `prisma generate`) and is
imported via `@/generated/prisma`. `src/lib/prisma.ts` holds the singleton client (dev-mode HMR
safe).

**Path alias:** `@/*` → `src/*` (see `tsconfig.json`). `scripts/*.ts` run via `tsx` and also resolve
this alias — verified working, don't add a separate module resolution config for scripts.

## Conventions

- UI copy and Telegram messages are in German (the operator is based in Austria); the AI system
  prompt in `src/lib/generateTips.ts` instructs Claude to generate `market`/`pick`/`reasoning` in
  German too. Console/log output in `scripts/` (operator-facing, not shown to end users) and
  `README.md` stay in Serbian, matching the site owner's language. Code, comments, and identifiers
  are in English.
- Money/odds are never treated as guaranteed — copy consistently frames tips as AI estimates, not
  promises, and the footer/bot carry a responsible-gambling (18+) disclaimer. Keep that framing in
  any new user-facing text.
- `scripts/` are standalone entry points run via `tsx`/npm scripts, not part of the Next.js app —
  they import from `src/lib` but are never imported by app code.
