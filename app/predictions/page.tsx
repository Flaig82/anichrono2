import RightSidebar from "@/components/layout/RightSidebar";
import HomeFeed from "@/components/layout/HomeFeed";
import SectionLabel from "@/components/shared/SectionLabel";
import PredictionsHero from "@/components/layout/PredictionsHero";
import MatchupCard from "@/components/predictions/MatchupCard";
import BracketOverview from "@/components/predictions/BracketOverview";
import AwardCard from "@/components/predictions/AwardCard";
import { fetchSeasonalTrending } from "@/lib/anilist";
import { generateMockBracket, generateMockAwards } from "@/lib/mock-predictions";
import { createClient } from "@/lib/supabase-server";
import type { Bracket, Matchup, Award, AwardNominee, BracketAnime } from "@/types/prediction";

type Season = "WINTER" | "SPRING" | "SUMMER" | "FALL";

function getCurrentSeason(): { season: Season; year: number; label: string; key: string } {
  const month = new Date().getMonth() + 1;
  let season: Season;
  let label: string;
  if (month <= 3) { season = "WINTER"; label = "Winter"; }
  else if (month <= 6) { season = "SPRING"; label = "Spring"; }
  else if (month <= 9) { season = "SUMMER"; label = "Summer"; }
  else { season = "FALL"; label = "Fall"; }
  return { season, year: new Date().getFullYear(), label, key: `${label.toLowerCase()}_${new Date().getFullYear()}` };
}

interface MatchupRow {
  id: string;
  round: "quarterfinal" | "semifinal" | "final";
  position: number;
  anime_a_id: number | null;
  anime_a_title: string | null;
  anime_a_cover: string | null;
  anime_a_seed: number | null;
  anime_b_id: number | null;
  anime_b_title: string | null;
  anime_b_cover: string | null;
  anime_b_seed: number | null;
  votes_a: number;
  votes_b: number;
  status: "active" | "upcoming" | "completed";
  winner_id: number | null;
}

interface NomineeRow {
  id: string;
  anime_id: number;
  title: string;
  cover_image_url: string | null;
  votes: number;
}

interface AwardRow {
  id: string;
  category: string;
  label: string;
  emoji: string;
  status: string;
  award_nominee: NomineeRow[];
}

const EMPTY_ANIME: BracketAnime = { animeId: 0, title: "TBD", coverImageUrl: null, seed: 0 };

function matchupRowToMatchup(
  row: MatchupRow,
  userVote: "a" | "b" | null,
): Matchup {
  return {
    id: row.id,
    round: row.round,
    position: row.position,
    animeA: row.anime_a_id
      ? { animeId: row.anime_a_id, title: row.anime_a_title ?? "", coverImageUrl: row.anime_a_cover, seed: row.anime_a_seed ?? 0 }
      : EMPTY_ANIME,
    animeB: row.anime_b_id
      ? { animeId: row.anime_b_id, title: row.anime_b_title ?? "", coverImageUrl: row.anime_b_cover, seed: row.anime_b_seed ?? 0 }
      : EMPTY_ANIME,
    votesA: row.votes_a,
    votesB: row.votes_b,
    userVote,
    status: row.status,
    winnerId: row.winner_id,
  };
}

export default async function PredictionsPage() {
  const { season, year, label, key } = getCurrentSeason();
  const seasonLabel = `${label} ${year}`;

  const supabase = createClient();

  // Get current user (may be null)
  const { data: { user } } = await supabase.auth.getUser();

  // Try to load bracket from DB
  const { data: bracketRow } = await supabase
    .from("bracket")
    .select("id, season, status, champion_anime_id, champion_title, champion_cover")
    .eq("season", key)
    .single();

  let bracket: Bracket;
  let awards: Award[];
  let isFromDb = false;

  if (bracketRow) {
    isFromDb = true;

    // Fetch matchups
    const { data: matchupRows } = await supabase
      .from("matchup")
      .select("id, round, position, anime_a_id, anime_a_title, anime_a_cover, anime_a_seed, anime_b_id, anime_b_title, anime_b_cover, anime_b_seed, votes_a, votes_b, status, winner_id")
      .eq("bracket_id", bracketRow.id)
      .order("position", { ascending: true });

    // Fetch user's matchup votes
    const userMatchupVotes: Record<string, "a" | "b"> = {};
    if (user && matchupRows) {
      const matchupIds = matchupRows.map((m) => m.id);
      const { data: voteRows } = await supabase
        .from("matchup_vote")
        .select("matchup_id, vote")
        .eq("user_id", user.id)
        .in("matchup_id", matchupIds);

      if (voteRows) {
        for (const v of voteRows) {
          userMatchupVotes[v.matchup_id] = v.vote as "a" | "b";
        }
      }
    }

    const typedRows = (matchupRows ?? []) as MatchupRow[];
    const allMatchups = typedRows.map((row) =>
      matchupRowToMatchup(row, userMatchupVotes[row.id] ?? null),
    );

    const quarterfinals = allMatchups.filter((m) => m.round === "quarterfinal");
    const semifinals = allMatchups.filter((m) => m.round === "semifinal");
    const finalMatchup = allMatchups.find((m) => m.round === "final") ?? null;

    bracket = {
      season: seasonLabel,
      quarterfinals,
      semifinals,
      final: finalMatchup,
      champion: bracketRow.champion_anime_id
        ? {
            animeId: bracketRow.champion_anime_id,
            title: bracketRow.champion_title ?? "",
            coverImageUrl: bracketRow.champion_cover ?? null,
            seed: 0,
          }
        : null,
    };

    // Fetch awards with nominees
    const { data: awardRows } = await supabase
      .from("award")
      .select("id, category, label, emoji, status, award_nominee(id, anime_id, title, cover_image_url, votes)")
      .eq("season", key)
      .order("created_at", { ascending: true });

    // Fetch user's award votes
    const userAwardVotes: Record<string, string> = {}; // award_id -> nominee_id
    if (user && awardRows) {
      const awardIds = awardRows.map((a) => a.id);
      const { data: awardVoteRows } = await supabase
        .from("award_vote")
        .select("award_id, nominee_id")
        .eq("user_id", user.id)
        .in("award_id", awardIds);

      if (awardVoteRows) {
        for (const v of awardVoteRows) {
          userAwardVotes[v.award_id] = v.nominee_id;
        }
      }
    }

    awards = ((awardRows ?? []) as AwardRow[]).map((row) => {
      const nominees = (row.award_nominee ?? []) as NomineeRow[];
      const totalVotes = nominees.reduce((sum, n) => sum + n.votes, 0);
      const sortedNominees: AwardNominee[] = nominees
        .sort((a, b) => b.votes - a.votes)
        .map((n) => ({
          id: n.id,
          animeId: n.anime_id,
          title: n.title,
          coverImageUrl: n.cover_image_url,
          votePercent: totalVotes > 0 ? Math.round((n.votes / totalVotes) * 1000) / 10 : 0,
          voteCount: n.votes,
        }));

      const userNomineeId = userAwardVotes[row.id] ?? null;
      const votedNominee = userNomineeId ? sortedNominees.find((n) => n.id === userNomineeId) : null;

      return {
        id: row.id,
        category: row.category as Award["category"],
        label: row.label,
        emoji: row.emoji,
        nominees: sortedNominees,
        userVoteId: votedNominee?.animeId ?? null,
        userVoteNomineeId: userNomineeId,
        totalVotes,
      };
    });
  } else {
    // Fall back to mock data
    const seasonalAnime = await fetchSeasonalTrending(season, year);
    bracket = generateMockBracket(seasonalAnime, seasonLabel);
    awards = generateMockAwards(seasonalAnime);
  }

  // Active matchups for the "This Week's Matchups" section
  const activeMatchups = [
    ...bracket.quarterfinals,
    ...bracket.semifinals,
    ...(bracket.final ? [bracket.final] : []),
  ].filter((m) => m.status === "active");

  return (
    <main className="flex gap-6 px-4 pt-6 pb-16 md:px-8 md:pt-10 lg:gap-12 lg:px-[120px]">
      <div className="flex flex-1 flex-col gap-10">
        <PredictionsHero />

        {/* Active matchups */}
        {activeMatchups.length > 0 && (
          <section className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <SectionLabel>This Week&apos;s Matchups</SectionLabel>
              <p className="font-body text-[12px] tracking-[-0.12px] text-aura-muted2">
                Vote for your pick in each head-to-head. Results update live.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {activeMatchups.map((matchup) => (
                <MatchupCard key={matchup.id} matchup={matchup} isFromDb={isFromDb} />
              ))}
            </div>
          </section>
        )}

        {/* Bracket overview */}
        <section className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <SectionLabel>Season Bracket</SectionLabel>
            <p className="font-body text-[12px] tracking-[-0.12px] text-aura-muted2">
              {seasonLabel} — 8 shows, single elimination. Community votes decide each round.
            </p>
          </div>
          <BracketOverview bracket={bracket} />
        </section>

        {/* Seasonal awards */}
        <section className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <SectionLabel>Season Awards — {seasonLabel}</SectionLabel>
            <p className="font-body text-[12px] tracking-[-0.12px] text-aura-muted2">
              Vote across categories. Winners announced at the end of the season.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {awards.map((award) => (
              <AwardCard key={award.id} award={award} isFromDb={isFromDb} />
            ))}
          </div>
        </section>
      </div>

      {/* Sticky sidebar */}
      <div className="sticky top-[68px] hidden h-fit lg:block">
        <RightSidebar>
          <HomeFeed />
        </RightSidebar>
      </div>
    </main>
  );
}
