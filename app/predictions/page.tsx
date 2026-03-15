import RightSidebar from "@/components/layout/RightSidebar";
import HomeFeed from "@/components/layout/HomeFeed";
import SectionLabel from "@/components/shared/SectionLabel";
import PredictionsHero from "@/components/layout/PredictionsHero";
import PredictionCard from "@/components/predictions/PredictionCard";
import { fetchSeasonalTrending } from "@/lib/anilist";
import type { AniListSeasonalMedia } from "@/lib/anilist";

type Season = "WINTER" | "SPRING" | "SUMMER" | "FALL";

function getCurrentSeason(): { season: Season; year: number; label: string } {
  const month = new Date().getMonth() + 1;
  let season: Season;
  let label: string;
  if (month <= 3) { season = "WINTER"; label = "Winter"; }
  else if (month <= 6) { season = "SPRING"; label = "Spring"; }
  else if (month <= 9) { season = "SUMMER"; label = "Summer"; }
  else { season = "FALL"; label = "Fall"; }
  return { season, year: new Date().getFullYear(), label };
}

/** Generate a seeded pseudo-random number from an integer (for stable mock data) */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

function mockPredictedScore(id: number): number {
  return Math.round((5 + seededRandom(id) * 4.5) * 10) / 10;
}

function mockActualScore(id: number): number {
  return Math.round((60 + seededRandom(id + 1000) * 30));
}

type PredictionResult = "perfect" | "close" | "in_range" | "miss";

function mockResult(id: number): { result: PredictionResult; auraEarned: number } {
  const roll = seededRandom(id + 500);
  if (roll < 0.25) return { result: "perfect", auraEarned: 300 };
  if (roll < 0.5)  return { result: "close", auraEarned: 150 };
  if (roll < 0.75) return { result: "in_range", auraEarned: 75 };
  return { result: "miss", auraEarned: 0 };
}

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PredictionsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { season, year, label } = getCurrentSeason();

  // Use URL params for season/year if provided, otherwise use current
  const querySeason = (params.season as Season) ?? season;
  const queryYear = params.year ? Number(params.year) : year;

  const seasonalAnime = await fetchSeasonalTrending(querySeason, queryYear);

  // Filter by search query if present
  const q = (params.q as string)?.toLowerCase();
  let filtered: AniListSeasonalMedia[] = seasonalAnime;
  if (q) {
    filtered = seasonalAnime.filter((a) => {
      const en = a.titleEnglish?.toLowerCase() ?? "";
      const ro = a.titleRomaji.toLowerCase();
      return en.includes(q) || ro.includes(q);
    });
  }

  // Sort
  const sort = (params.sort as string) ?? "popular";
  if (sort === "score") {
    filtered.sort((a, b) => (b.averageScore ?? 0) - (a.averageScore ?? 0));
  } else if (sort === "newest") {
    filtered.sort((a, b) => b.id - a.id);
  }
  // "popular" is default from AniList (POPULARITY_DESC)

  // Split into sections with placeholder prediction states
  const openAnime = filtered.slice(0, 4);
  const lockedAnime = filtered.slice(4, 7);
  const resolvedAnime = filtered.slice(7, 10);

  // Derive season labels for sections
  const seasonLabel = `${label} ${queryYear}`;
  const previousYear = querySeason === "WINTER" ? queryYear - 1 : queryYear;
  const previousSeasonLabel = querySeason === "WINTER"
    ? `Fall ${previousYear}`
    : querySeason === "SPRING"
      ? `Winter ${queryYear}`
      : querySeason === "SUMMER"
        ? `Spring ${queryYear}`
        : `Summer ${queryYear}`;

  return (
    <main className="flex gap-6 px-4 pt-6 pb-16 md:px-8 md:pt-10 lg:gap-12 lg:px-[120px]">
      {/* Main content */}
      <div className="flex flex-1 flex-col gap-10">
        <PredictionsHero />

        {/* Open Predictions */}
        {openAnime.length > 0 && (
          <section className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <SectionLabel>Open Predictions</SectionLabel>
              <p className="font-body text-[12px] tracking-[-0.12px] text-aura-muted2">
                {seasonLabel} season -- submit your predicted final score before Episode 6.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {openAnime.map((anime) => (
                <PredictionCard
                  key={anime.id}
                  id={anime.id}
                  title={anime.titleEnglish ?? anime.titleRomaji}
                  coverImageUrl={anime.coverImageUrl}
                  currentScore={anime.averageScore}
                  status="open"
                />
              ))}
            </div>
          </section>
        )}

        {/* Locked */}
        {lockedAnime.length > 0 && (
          <section className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <SectionLabel>Locked -- Awaiting Results</SectionLabel>
              <p className="font-body text-[12px] tracking-[-0.12px] text-aura-muted2">
                Predictions locked at Episode 6. Results resolve when the season ends.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {lockedAnime.map((anime) => (
                <PredictionCard
                  key={anime.id}
                  id={anime.id}
                  title={anime.titleEnglish ?? anime.titleRomaji}
                  coverImageUrl={anime.coverImageUrl}
                  currentScore={anime.averageScore}
                  status="locked"
                  userPrediction={mockPredictedScore(anime.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Resolved */}
        {resolvedAnime.length > 0 && (
          <section className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <SectionLabel>Resolved -- {previousSeasonLabel}</SectionLabel>
              <p className="font-body text-[12px] tracking-[-0.12px] text-aura-muted2">
                Final scores are in. See how your predictions performed.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {resolvedAnime.map((anime) => {
                const { result, auraEarned } = mockResult(anime.id);
                return (
                  <PredictionCard
                    key={anime.id}
                    id={anime.id}
                    title={anime.titleEnglish ?? anime.titleRomaji}
                    coverImageUrl={anime.coverImageUrl}
                    currentScore={anime.averageScore}
                    status="resolved"
                    userPrediction={mockPredictedScore(anime.id)}
                    actualScore={mockActualScore(anime.id)}
                    result={result}
                    auraEarned={auraEarned}
                  />
                );
              })}
            </div>
          </section>
        )}

        {filtered.length === 0 && (
          <p className="font-body text-sm text-aura-muted2">
            No shows found for this season. Try adjusting your filters.
          </p>
        )}
      </div>

      {/* Sticky sidebar — hidden on mobile */}
      <div className="sticky top-[68px] hidden h-fit lg:block">
        <RightSidebar>
          <HomeFeed />
        </RightSidebar>
      </div>
    </main>
  );
}
