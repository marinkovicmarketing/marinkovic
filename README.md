# Tipovi AI

AI fudbalski tipovi — sajt sa 3 besplatna tipa dnevno, VIP tiketi po kvotama (3 / 7 / 15 / 20-30), i Telegram bot.

## Deploy na Vercel (korak po korak)

### 1. Napravi besplatnu Postgres bazu (Neon)

Idi na **neon.tech**, napravi nalog (može preko GitHub-a), napravi novi projekat/bazu. Kopiraj connection string koji ti daju (izgleda kao `postgresql://user:pass@host/dbname?sslmode=require`) — to ti je `DATABASE_URL`.

*(Alternativa: kad kreiraš Vercel projekat, u tabu "Storage" možeš da dodaš Neon Postgres direktno iz Vercel-a u par klikova — automatski ti popuni `DATABASE_URL` — pa ovaj korak možeš preskočiti.)*

### 2. Napravi Vercel projekat

- Idi na **vercel.com**, uloguj se preko GitHub-a
- "Add New..." → "Project" → izaberi `marinkovicmarketing/marinkovic` repo
- Framework se automatski prepoznaje kao Next.js, ne diraj ništa tu

### 3. Dodaj environment varijable

Pre klika na Deploy (ili posle, u Project Settings → Environment Variables), dodaj sve ovo:

| Ime | Vrednost |
|---|---|
| `DATABASE_URL` | connection string iz koraka 1 |
| `ANTHROPIC_API_KEY` | tvoj Claude API ključ ([console.anthropic.com](https://console.anthropic.com)) |
| `TELEGRAM_BOT_TOKEN` | token od @BotFather na Telegramu |
| `TELEGRAM_WEBHOOK_SECRET` | bilo koji nasumičan string (npr. generiši sa `openssl rand -hex 24`) |
| `API_FOOTBALL_KEY` | opciono — bez njega koristi mock mečeve |
| `VIP_ACCESS_CODE` | kod koji deliš VIP korisnicima, promeni sa `promeni-me` |
| `VIP_PRICE` | npr. `14,99 €/Monat` |
| `VIP_PAYPAL_LINK` | tvoj PayPal.me link ili email |
| `VIP_CONTACT_TELEGRAM` | tvoj Telegram handle za potvrde uplate |
| `CRON_SECRET` | nasumičan string, isto kao `TELEGRAM_WEBHOOK_SECRET` princip |

Klikni **Deploy**.

### 4. Primeni šemu baze

Sa svog računara (ili bilo gde gde imaš `npm`/repo), postavi `DATABASE_URL` u lokalnom `.env` na istu vrednost iz koraka 1, pa pokreni:

```bash
npx prisma migrate deploy
```

Ovo samo primeni tabele na bazu, ne pokreće sajt.

### 5. Poveži Telegram bota (webhook)

Kad je sajt live (npr. `https://tvoj-projekat.vercel.app`), pozovi jednom (u browseru ili sa curl) — zameni `<TOKEN>` svojim bot tokenom, `<WEBHOOK_SECRET>` vrednošću iz `TELEGRAM_WEBHOOK_SECRET`, i `<TVOJ-SAJT>` svojim Vercel URL-om:

```
https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<TVOJ-SAJT>/api/telegram/webhook&secret_token=<WEBHOOK_SECRET>
```

Treba da dobiješ odgovor `{"ok":true,"result":true,...}`. Od tad bot radi automatski, bez ičega dodatnog pokrenutog.

### 6. Prvo generisanje tipova

Cron (`vercel.json`) sam pokreće `generate:tips` svaki dan u 6:00 UTC, ali za odmah:

```
https://<TVOJ-SAJT>/api/cron/generate-tips?secret=<CRON_SECRET>
```

Otvori taj link u browseru — treba da vratiš JSON sa `"ok":true`.

**Domen**: ako želiš svoj domen (npr. sa Hostingera) umesto `vercel.app` adrese, u Vercel Project Settings → Domains dodaš domen, pa u Hostinger DNS podešavanjima dodaš CNAME/A zapis koji ti Vercel pokaže. Ne treba menjati hosting domena, samo DNS.

## Pokretanje lokalno

```bash
npm install
cp .env.example .env   # pa upiši DATABASE_URL, ANTHROPIC_API_KEY, TELEGRAM_BOT_TOKEN, itd.
npx prisma migrate deploy
npm run generate:tips   # generiše današnje tipove (radi i bez API_FOOTBALL_KEY — koristi mock mečeve)
npm run dev              # http://localhost:3000
```

`DATABASE_URL` mora biti prava Postgres konekcija (npr. ista Neon baza iz produkcije — sasvim u redu za ovaj obim projekta, ne treba ti posebna baza za lokalni rad).

VIP stranicu otključavaš kodom iz `VIP_ACCESS_CODE` (podrazumevano `promeni-me` — obavezno promeni pre nego što bude javno dostupno).

### Naplata (ručno, preko PayPal-a)

Dok ne budeš legalno spreman za automatsku naplatu (Stripe i sl.), sajt i bot pokazuju uputstvo za ručnu uplatu preko PayPal-a. Popuni u `.env`:

- `VIP_PRICE` — npr. `14,99 €/Monat`
- `VIP_PAYPAL_LINK` — tvoj pravi `paypal.me/...` link ili email
- `VIP_CONTACT_TELEGRAM` — tvoj Telegram korisnički handle (npr. `@nadimak`) gde ti korisnici šalju potvrdu uplate

Kad ti neko pošalje potvrdu uplate na Telegram, ti ručno pošalješ nazad trenutnu vrednost `VIP_ACCESS_CODE` — to je isti kod za sve, pa ga povremeno menjaj ako želiš kontrolu ko ima pristup.

## Telegram bot

Bot logika je ista, samo dva različita "pogona":

- **Lokalno (dev)**: `npm run bot` — long polling, bot mora ostati pokrenut u terminalu.
- **Produkcija (Vercel)**: webhook na `/api/telegram/webhook` — Telegram sam pozove sajt kad stigne poruka, ništa ne mora da bude non-stop pokrenuto. Podesi ga jednom, korak 5 gore.

Komande: `/start`, `/tipps` (besplatni tipovi), `/vip`, `/vipcode <kod>`.

Napomena: sadržaj koji vidi korisnik (sajt + bot poruke) je na nemačkom (target tržište je Austrija). Ovaj README i log poruke u `scripts/` ostaju na srpskom, to je samo za tebe kao operatera.

## Generisanje tipova

Pipeline (povlači mečeve, pita Claude-a za tipove, pravi VIP tikete) živi u `src/lib/runGeneration.ts` i pokreće se preko `GET /api/cron/generate-tips` (Vercel Cron ga zove automatski, vidi `vercel.json`) ili preko `npm run generate:tips` (CLI, korisno lokalno). Bez `API_FOOTBALL_KEY` koristi mock mečeve. Idempotentno — ako se pozove dva puta istog dana, drugi put samo pregazi podatke od prvog.

## Stanje projekta

- ✅ Web (Next.js) + Telegram bot (webhook na Vercel-u)
- ✅ AI generisanje tipova (Claude API)
- ✅ VIP pristup preko deljenog koda (privremeno rešenje)
- ✅ Ručna naplata preko PayPal-a (uputstvo na sajtu + botu, ti ručno šalješ kod)
- ✅ Automatsko dnevno generisanje tipova (Vercel Cron)
- ✅ Postgres baza (Neon) — radi na Vercel-u, za razliku od SQLite-a
- ⬜ Automatska naplata (Stripe i sl. — čeka se prijava firme u Austriji)

Detaljnija arhitektura: [`CLAUDE.md`](./CLAUDE.md).
