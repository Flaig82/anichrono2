// Bracket tournament types

export interface BracketAnime {
  animeId: number;
  title: string;
  coverImageUrl: string | null;
  seed: number;
}

export interface Matchup {
  id: string; // uuid from DB (or mock id like "qf-1")
  round: "quarterfinal" | "semifinal" | "final";
  position: number;
  animeA: BracketAnime;
  animeB: BracketAnime;
  votesA: number;
  votesB: number;
  userVote: "a" | "b" | null;
  status: "active" | "upcoming" | "completed";
  winnerId: number | null;
}

export interface Bracket {
  season: string;
  quarterfinals: Matchup[];
  semifinals: Matchup[];
  final: Matchup | null;
  champion: BracketAnime | null;
}

// Seasonal awards types

export type AwardCategory =
  | "aots"
  | "best_op"
  | "best_ed"
  | "best_fight"
  | "best_character"
  | "most_underrated";

export interface AwardNominee {
  id: string; // uuid from DB
  animeId: number;
  title: string;
  coverImageUrl: string | null;
  votePercent: number;
  voteCount: number;
}

export interface Award {
  id: string; // uuid from DB
  category: AwardCategory;
  label: string;
  emoji: string;
  nominees: AwardNominee[];
  userVoteId: number | null;
  userVoteNomineeId: string | null; // uuid of the nominee voted for
  totalVotes: number;
}
