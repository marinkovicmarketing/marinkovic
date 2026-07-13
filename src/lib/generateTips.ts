import { anthropic, TIP_MODEL } from "@/lib/anthropic";
import { fetchTeamForm, mockTeamForm, type Fixture, type TeamForm } from "@/lib/football";

export type GeneratedTip = {
  fixtureIndex: number;
  market: string;
  pick: string;
  estimatedOdds: number;
  confidence: number;
  reasoning: string;
};

const TIP_SCHEMA = {
  type: "object",
  properties: {
    tips: {
      type: "array",
      items: {
        type: "object",
        properties: {
          fixtureIndex: {
            type: "integer",
            description: "Index into the provided fixtures list (0-based)",
          },
          market: {
            type: "string",
            description: "e.g. '1X2', 'Ukupno golova 2.5', 'Oba tima daju gol', 'Duploj sansa'",
          },
          pick: {
            type: "string",
            description: "e.g. '1', 'Over 2.5', 'GG', '1X'",
          },
          estimatedOdds: {
            type: "number",
            description: "Realistic decimal odds estimate for this pick, e.g. 1.85",
          },
          confidence: {
            type: "integer",
            description: "Your confidence in this pick, 1-100",
          },
          reasoning: {
            type: "string",
            description: "1-2 concise sentences in Serbian explaining the pick",
          },
        },
        required: ["fixtureIndex", "market", "pick", "estimatedOdds", "confidence", "reasoning"],
        additionalProperties: false,
      },
    },
  },
  required: ["tips"],
  additionalProperties: false,
} as const;

function formatForm(form: TeamForm): string {
  return `${form.teamName}: poslednjih 5 (${form.lastResults}), postignuto ${form.goalsFor}, primljeno ${form.goalsAgainst}`;
}

/**
 * Fetches recent form for both teams in each fixture (falls back to mock data
 * when API_FOOTBALL_KEY is not configured) and asks Claude for tip candidates.
 */
export async function generateTipsForFixtures(fixtures: Fixture[]): Promise<GeneratedTip[]> {
  const useMock = !process.env.API_FOOTBALL_KEY?.trim();

  const forms = new Map<number, TeamForm>();
  for (const f of fixtures) {
    for (const [id, name] of [
      [f.homeTeamId, f.homeTeam],
      [f.awayTeamId, f.awayTeam],
    ] as const) {
      if (forms.has(id)) continue;
      forms.set(id, useMock ? mockTeamForm(id, name) : await fetchTeamForm(id, name));
    }
  }

  const fixturesBlock = fixtures
    .map((f, i) => {
      const home = forms.get(f.homeTeamId)!;
      const away = forms.get(f.awayTeamId)!;
      return [
        `[${i}] ${f.league}: ${f.homeTeam} — ${f.awayTeam} (${f.kickoff})`,
        `  ${formatForm(home)}`,
        `  ${formatForm(away)}`,
      ].join("\n");
    })
    .join("\n\n");

  const response = await anthropic.messages.create({
    model: TIP_MODEL,
    max_tokens: 8000,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "high",
      format: { type: "json_schema", schema: TIP_SCHEMA },
    },
    system:
      "Ti si iskusan analitičar fudbalskih kladionica koji priprema dnevne tipove za sajt i Telegram kanal. " +
      "Za svaki meč predloži 1-2 najsigurnija tipa iz različitih tržišta (1X2, dupla šansa, ukupno golova, oba tima daju gol). " +
      "Zasnuj procenu na formi timova koja ti je data, poznavanju liga i timova, i realnoj proceni kvota kakve bi ponudila kladionica. " +
      "Budi konzervativan sa pouzdanošću (confidence) — koristi visoke vrednosti (80+) samo za zaista sigurne tipove. " +
      "Nikad ne izmišljaj da je tip 'garantovan' ili '100% siguran' — kladenje uvek nosi rizik. Piši na srpskom jeziku.",
    messages: [
      {
        role: "user",
        content: `Evo današnjih mečeva sa formom timova:\n\n${fixturesBlock}\n\nPredloži tipove za ove mečeve.`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude nije vratio tekstualni odgovor sa tipovima.");
  }

  const parsed = JSON.parse(textBlock.text) as { tips: GeneratedTip[] };
  return parsed.tips.filter(
    (t) =>
      fixtures[t.fixtureIndex] !== undefined &&
      t.estimatedOdds > 1 &&
      t.confidence >= 1 &&
      t.confidence <= 100,
  );
}
