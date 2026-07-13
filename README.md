# Tipovi AI

AI fudbalski tipovi — sajt sa 3 besplatna tipa dnevno, VIP tiketi po kvotama (3 / 7 / 15 / 20-30), i Telegram bot.

## Pokretanje lokalno

```bash
npm install
cp .env.example .env   # pa upiši ANTHROPIC_API_KEY, TELEGRAM_BOT_TOKEN, itd.
npx prisma migrate dev
npm run generate:tips   # generiše današnje tipove (radi i bez API_FOOTBALL_KEY — koristi mock mečeve)
npm run dev              # http://localhost:3000
```

VIP stranicu otključavaš kodom iz `VIP_ACCESS_CODE` (podrazumevano `promeni-me` — obavezno promeni pre nego što bude javno dostupno).

## Telegram bot

```bash
npm run bot
```

Komande: `/start`, `/tipps` (besplatni tipovi), `/vip`, `/vipcode <kod>`.

Napomena: sadržaj koji vidi korisnik (sajt + bot poruke) je na nemačkom (target tržište je Austrija). Ovaj README i log poruke u `scripts/` ostaju na srpskom, to je samo za tebe kao operatera.

## Generisanje tipova

`npm run generate:tips` treba pokretati jednom dnevno (npr. cron job ili scheduled task) — povlači današnje mečeve, traži od Claude-a predloge tipova, i pravi VIP tikete po kvotama. Bez `API_FOOTBALL_KEY` koristi mock mečeve, korisno za lokalni razvoj.

## Stanje projekta

- ✅ Web (Next.js) + Telegram bot
- ✅ AI generisanje tipova (Claude API)
- ✅ VIP pristup preko deljenog koda (privremeno rešenje)
- ⬜ Plaćanje VIP pretplate (nije implementirano)
- ⬜ Automatsko dnevno pokretanje `generate:tips` (nije podešeno — treba cron/scheduler)

Detaljnija arhitektura: [`CLAUDE.md`](./CLAUDE.md).
