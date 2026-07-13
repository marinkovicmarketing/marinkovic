const API_FOOTBALL_BASE = "https://v3.football.api-sports.io";

// Curated set of major leagues so tips stay on well-known, well-covered matches.
// API-Football league IDs: https://www.api-football.com/documentation-v3#tag/Leagues
const MAJOR_LEAGUE_IDS = new Set([
  39, // Premier League
  140, // La Liga
  135, // Serie A
  78, // Bundesliga
  61, // Ligue 1
  2, // Champions League
  3, // Europa League
  88, // Eredivisie
  94, // Primeira Liga
  203, // Super Lig
  253, // MLS
  71, // Serie A (Brazil)
]);

export type Fixture = {
  fixtureId: number;
  league: string;
  homeTeam: string;
  homeTeamId: number;
  awayTeam: string;
  awayTeamId: number;
  kickoff: string; // ISO
};

export type TeamForm = {
  teamId: number;
  teamName: string;
  lastResults: string; // e.g. "W-D-L-W-W" most recent last
  goalsFor: number;
  goalsAgainst: number;
};

function apiKey() {
  return process.env.API_FOOTBALL_KEY?.trim();
}

async function apiFootballGet<T>(path: string): Promise<T> {
  const key = apiKey();
  if (!key) {
    throw new Error("API_FOOTBALL_KEY not set");
  }
  const res = await fetch(`${API_FOOTBALL_BASE}${path}`, {
    headers: { "x-apisports-key": key },
    // API-Football responses change throughout the day; never cache.
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`API-Football request failed: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

type ApiFixturesResponse = {
  response: Array<{
    fixture: { id: number; date: string };
    league: { id: number; name: string };
    teams: {
      home: { id: number; name: string };
      away: { id: number; name: string };
    };
  }>;
};

/** Today's fixtures from the curated major-league list. Throws if no API key is configured. */
export async function fetchTodayFixtures(dateStr: string, limit = 12): Promise<Fixture[]> {
  const data = await apiFootballGet<ApiFixturesResponse>(
    `/fixtures?date=${dateStr}&timezone=Europe/Belgrade`,
  );
  return data.response
    .filter((f) => MAJOR_LEAGUE_IDS.has(f.league.id))
    .slice(0, limit)
    .map((f) => ({
      fixtureId: f.fixture.id,
      league: f.league.name,
      homeTeam: f.teams.home.name,
      homeTeamId: f.teams.home.id,
      awayTeam: f.teams.away.name,
      awayTeamId: f.teams.away.id,
      kickoff: f.fixture.date,
    }));
}

type ApiTeamFixturesResponse = {
  response: Array<{
    teams: {
      home: { id: number; winner: boolean | null };
      away: { id: number; winner: boolean | null };
    };
    goals: { home: number | null; away: number | null };
  }>;
};

/** Last-5 form for a team, most recent last (e.g. "L-D-W-W-W"). */
export async function fetchTeamForm(teamId: number, teamName: string): Promise<TeamForm> {
  const data = await apiFootballGet<ApiTeamFixturesResponse>(
    `/fixtures?team=${teamId}&last=5`,
  );
  let goalsFor = 0;
  let goalsAgainst = 0;
  const results = data.response.map((f) => {
    const isHome = f.teams.home.id === teamId;
    const gf = (isHome ? f.goals.home : f.goals.away) ?? 0;
    const ga = (isHome ? f.goals.away : f.goals.home) ?? 0;
    goalsFor += gf;
    goalsAgainst += ga;
    const winner = isHome ? f.teams.home.winner : f.teams.away.winner;
    if (winner === true) return "W";
    if (winner === false) return "L";
    return "D";
  });
  return {
    teamId,
    teamName,
    lastResults: results.reverse().join("-") || "N/A",
    goalsFor,
    goalsAgainst,
  };
}

/** Fixtures used for local development when no API_FOOTBALL_KEY is configured. */
export function mockFixtures(dateStr: string): Fixture[] {
  const base = new Date(`${dateStr}T18:00:00Z`).toISOString();
  return [
    {
      fixtureId: 1,
      league: "Premier League",
      homeTeam: "Arsenal",
      homeTeamId: 1001,
      awayTeam: "Manchester City",
      awayTeamId: 1002,
      kickoff: base,
    },
    {
      fixtureId: 2,
      league: "La Liga",
      homeTeam: "Real Madrid",
      homeTeamId: 1003,
      awayTeam: "Sevilla",
      awayTeamId: 1004,
      kickoff: base,
    },
    {
      fixtureId: 3,
      league: "Serie A",
      homeTeam: "Inter",
      homeTeamId: 1005,
      awayTeam: "Juventus",
      awayTeamId: 1006,
      kickoff: base,
    },
    {
      fixtureId: 4,
      league: "Bundesliga",
      homeTeam: "Bayern Munich",
      homeTeamId: 1007,
      awayTeam: "Borussia Dortmund",
      awayTeamId: 1008,
      kickoff: base,
    },
    {
      fixtureId: 5,
      league: "Ligue 1",
      homeTeam: "PSG",
      homeTeamId: 1009,
      awayTeam: "Marseille",
      awayTeamId: 1010,
      kickoff: base,
    },
  ];
}

export function mockTeamForm(teamId: number, teamName: string): TeamForm {
  return {
    teamId,
    teamName,
    lastResults: "W-W-D-W-L",
    goalsFor: 9,
    goalsAgainst: 4,
  };
}
