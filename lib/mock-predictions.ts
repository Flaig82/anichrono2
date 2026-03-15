import type { AniListSeasonalMedia } from "@/lib/anilist";
import type {
  Award,
  AwardCategory,
  Bracket,
  BracketAnime,
  Matchup,
} from "@/types/prediction";

/** Seeded pseudo-random from an integer — stable across renders */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

function toBracketAnime(
  a: AniListSeasonalMedia,
  seed: number,
): BracketAnime {
  return {
    animeId: a.id,
    title: a.titleEnglish ?? a.titleRomaji,
    coverImageUrl: a.coverImageUrl,
    seed,
  };
}

export function generateMockBracket(
  anime: AniListSeasonalMedia[],
  seasonLabel: string,
): Bracket {
  // Take top 8 by popularity (already sorted POPULARITY_DESC from AniList)
  const top8 = anime.slice(0, 8);

  // If fewer than 8, pad with what we have (bracket still works visually)
  while (top8.length < 8) {
    const placeholder = top8[top8.length - 1];
    if (placeholder) top8.push(placeholder);
    else break;
  }

  // Seed 1-8
  const seeded = top8.map((a, i) => toBracketAnime(a, i + 1));

  // Standard bracket seeding: 1v8, 4v5, 2v7, 3v6
  const qfPairs: [number, number][] = [
    [0, 7], // 1v8
    [3, 4], // 4v5
    [1, 6], // 2v7
    [2, 5], // 3v6
  ];

  const quarterfinals: Matchup[] = qfPairs.map(([aIdx, bIdx], i) => {
    const animeA = seeded[aIdx]!;
    const animeB = seeded[bIdx]!;
    const seed1 = animeA.animeId * 100 + i;

    const votesA = Math.round(200 + seededRandom(seed1) * 600);
    const votesB = Math.round(200 + seededRandom(seed1 + 1) * 600);

    // First 2 QFs completed, next 2 active
    const isCompleted = i < 2;
    const winnerId = isCompleted
      ? votesA >= votesB
        ? animeA.animeId
        : animeB.animeId
      : null;

    return {
      id: `qf-${i + 1}`,
      round: "quarterfinal" as const,
      position: i + 1,
      animeA,
      animeB,
      votesA,
      votesB,
      userVote: i === 2 ? "a" as const : null, // user voted in QF3
      status: isCompleted ? "completed" as const : "active" as const,
      winnerId,
    };
  });

  // Semifinals — upcoming (winners of QF1 vs QF2, QF3 vs QF4)
  const qf1Winner = quarterfinals[0]!.winnerId === quarterfinals[0]!.animeA.animeId
    ? quarterfinals[0]!.animeA
    : quarterfinals[0]!.animeB;
  const qf2Winner = quarterfinals[1]!.winnerId === quarterfinals[1]!.animeA.animeId
    ? quarterfinals[1]!.animeA
    : quarterfinals[1]!.animeB;

  const semifinals: Matchup[] = [
    {
      id: "sf-1",
      round: "semifinal",
      position: 1,
      animeA: qf1Winner,
      animeB: qf2Winner,
      votesA: 0,
      votesB: 0,
      userVote: null,
      status: "upcoming",
      winnerId: null,
    },
    {
      id: "sf-2",
      round: "semifinal",
      position: 2,
      animeA: seeded[0]!, // placeholder — will be QF3 winner
      animeB: seeded[1]!, // placeholder — will be QF4 winner
      votesA: 0,
      votesB: 0,
      userVote: null,
      status: "upcoming",
      winnerId: null,
    },
  ];

  return {
    season: seasonLabel,
    quarterfinals,
    semifinals,
    final: null,
    champion: null,
  };
}

const AWARD_CATEGORIES: {
  category: AwardCategory;
  label: string;
  emoji: string;
}[] = [
  { category: "aots", label: "Anime of the Season", emoji: "🏆" },
  { category: "best_op", label: "Best Opening", emoji: "🎵" },
  { category: "best_ed", label: "Best Ending", emoji: "🎶" },
  { category: "best_fight", label: "Best Fight Scene", emoji: "⚔️" },
  { category: "best_character", label: "Best New Character", emoji: "⭐" },
  { category: "most_underrated", label: "Most Underrated", emoji: "💎" },
];

export function generateMockAwards(
  anime: AniListSeasonalMedia[],
): Award[] {
  return AWARD_CATEGORIES.map((cat, catIdx) => {
    // Pick 4-6 nominees per category, shuffled by seed
    const count = 4 + Math.round(seededRandom(catIdx * 31) * 2); // 4-6
    const shuffled = [...anime]
      .sort(
        (a, b) =>
          seededRandom(a.id + catIdx * 100) -
          seededRandom(b.id + catIdx * 100),
      )
      .slice(0, count);

    // Generate vote counts
    const rawVotes = shuffled.map((a, i) => {
      const seed = a.id * 10 + catIdx;
      return Math.round(50 + seededRandom(seed) * 400 + (i === 0 ? 150 : 0));
    });
    const totalVotes = rawVotes.reduce((sum, v) => sum + v, 0);

    const nominees = shuffled.map((a, i) => ({
      id: `mock-nom-${catIdx}-${i}`,
      animeId: a.id,
      title: a.titleEnglish ?? a.titleRomaji,
      coverImageUrl: a.coverImageUrl,
      votePercent: Math.round((rawVotes[i]! / totalVotes) * 1000) / 10,
      voteCount: rawVotes[i]!,
    }));

    // Sort by vote count descending
    nominees.sort((a, b) => b.voteCount - a.voteCount);

    // User voted in the first category (AOTS)
    const userVoteId = catIdx === 0 ? nominees[0]?.animeId ?? null : null;

    return {
      id: `mock-award-${catIdx}`,
      category: cat.category,
      label: cat.label,
      emoji: cat.emoji,
      nominees,
      userVoteId,
      userVoteNomineeId: userVoteId !== null ? nominees.find(n => n.animeId === userVoteId)?.id ?? null : null,
      totalVotes,
    };
  });
}
