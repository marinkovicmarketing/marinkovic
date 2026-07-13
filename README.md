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

### Naplata (ručno, preko PayPal-a)

Dok ne budeš legalno spreman za automatsku naplatu (Stripe i sl.), sajt i bot pokazuju uputstvo za ručnu uplatu preko PayPal-a. Popuni u `.env`:

- `VIP_PRICE` — npr. `9,99 €/Monat`
- `VIP_PAYPAL_LINK` — tvoj pravi `paypal.me/...` link ili email
- `VIP_CONTACT_TELEGRAM` — tvoj Telegram korisnički handle (npr. `@nadimak`) gde ti korisnici šalju potvrdu uplate

Kad ti neko pošalje potvrdu uplate na Telegram, ti ručno pošalješ nazad trenutnu vrednost `VIP_ACCESS_CODE` — to je isti kod za sve, pa ga povremeno menjaj ako želiš kontrolu ko ima pristup.

## Telegram bot

```bash
npm run bot
```

Komande: `/start`, `/tipps` (besplatni tipovi), `/vip`, `/vipcode <kod>`.

Napomena: sadržaj koji vidi korisnik (sajt + bot poruke) je na nemačkom (target tržište je Austrija). Ovaj README i log poruke u `scripts/` ostaju na srpskom, to je samo za tebe kao operatera.

## Generisanje tipova

Pipeline (povlači mečeve, pita Claude-a za tipove, pravi VIP tikete) živi u `src/lib/runGeneration.ts` i pokreće se na dva načina — koristi onaj koji odgovara tvom hostingu:

**Vercel** — već je podešeno. `vercel.json` ima cron koji svaki dan u 6:00 UTC pozove `/api/cron/generate-tips`. Vercel automatski šalje `Authorization: Bearer $CRON_SECRET`, pa samo treba da podesiš `CRON_SECRET` u Vercel environment varijablama (isto kao i ostale `.env` vrednosti). Promeni satnicu u `vercel.json` ako ti 6:00 UTC (8:00 po bečkom letnjem vremenu) ne odgovara.

**VPS / sopstveni server** — dodaj u crontab:

```bash
0 6 * * * cd /putanja/do/projekta && npm run generate:tips >> /var/log/tipovi-generate.log 2>&1
```

ili, ako je sajt već pokrenut kao web server, isti endpoint možeš da pozoveš i preko curl-a umesto CLI skripte:

```bash
0 6 * * * curl -s "https://tvoj-sajt.at/api/cron/generate-tips?secret=$CRON_SECRET" >> /var/log/tipovi-generate.log 2>&1
```

Bez `API_FOOTBALL_KEY` koristi mock mečeve, korisno za lokalni razvoj. Skripta/endpoint su idempotentni — ako se pozovu dva puta istog dana, drugi put samo pregaze podatke od prvog.

## Stanje projekta

- ✅ Web (Next.js) + Telegram bot
- ✅ AI generisanje tipova (Claude API)
- ✅ VIP pristup preko deljenog koda (privremeno rešenje)
- ✅ Ručna naplata preko PayPal-a (uputstvo na sajtu + botu, ti ručno šalješ kod)
- ✅ Automatsko dnevno generisanje tipova (Vercel Cron ili crontab, vidi gore)
- ⬜ Automatska naplata (Stripe i sl. — čeka se prijava firme u Austriji)

Detaljnija arhitektura: [`CLAUDE.md`](./CLAUDE.md).
