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
            description: "e.g. '1X2', 'Über/Unter 2.5 Tore', 'Beide Teams treffen', 'Doppelte Chance'",
          },
          pick: {
            type: "string",
            description: "e.g. '1', 'Über 2.5', 'BTT Ja', '1X'",
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
            description: "1-2 concise sentences in German explaining the pick",
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
  return `${form.teamName}: letzte 5 Spiele (${form.lastResults}), erzielte Tore ${form.goalsFor}, Gegentore ${form.goalsAgainst}`;
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
      "Du bist ein erfahrener Fußballwetten-Analyst, der tägliche Tipps für eine Website und einen " +
      "Telegram-Kanal vorbereitet. Schlage für jedes Spiel 1-2 möglichst sichere Tipps aus " +
      "unterschiedlichen Märkten vor (1X2, Doppelte Chance, Über/Unter Tore, Beide Teams treffen). " +
      "Stütze deine Einschätzung auf die angegebene Team-Form, dein Wissen über Ligen und Teams, und eine " +
      "realistische Einschätzung der Quote, die ein Wettanbieter anbieten würde. " +
      "Sei konservativ bei der Einschätzung der confidence — nutze hohe Werte (80+) nur für wirklich sichere Tipps. " +
      "Behaupte niemals, ein Tipp sei 'garantiert' oder '100% sicher' — Wetten sind immer mit Risiko verbunden. " +
      "Schreibe auf Deutsch.",
    messages: [
      {
        role: "user",
        content: `Hier sind die heutigen Spiele mit der Team-Form:\n\n${fixturesBlock}\n\nSchlage Tipps für diese Spiele vor.`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude hat keine Textantwort mit Tipps zurückgegeben.");
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
