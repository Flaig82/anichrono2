import Image from "next/image";
import type { Bracket, Matchup } from "@/types/prediction";

interface BracketOverviewProps {
  bracket: Bracket;
}

function BracketSlot({
  matchup,
  position,
}: {
  matchup: Matchup;
  position: "top" | "bottom";
}) {
  const isCompleted = matchup.status === "completed";
  const isActive = matchup.status === "active";

  const anime = position === "top" ? matchup.animeA : matchup.animeB;
  const isWinner = isCompleted && matchup.winnerId === anime.animeId;
  const isLoser = isCompleted && matchup.winnerId !== anime.animeId;

  return (
    <div
      className={`flex items-center gap-2 rounded-md px-2 py-1.5 transition-all ${
        isWinner
          ? "bg-aura-orange/10 ring-1 ring-aura-orange/30"
          : isActive
            ? "ring-1 ring-oracle/20"
            : isLoser
              ? "opacity-40"
              : ""
      }`}
    >
      <div className="relative h-[44px] w-[32px] shrink-0 overflow-hidden rounded">
        {anime.coverImageUrl ? (
          <Image
            src={anime.coverImageUrl}
            alt={anime.title}
            fill
            className="object-cover"
            sizes="32px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-aura-bg3 text-[7px] text-aura-muted">
            ?
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-body text-[11px] font-semibold leading-tight text-white">
          {anime.title}
        </p>
        <p className="font-mono text-[9px] text-aura-muted">
          Seed {anime.seed}
        </p>
      </div>
    </div>
  );
}

function TBDSlot() {
  return (
    <div className="flex items-center gap-2 rounded-md border border-dashed border-white/[0.07] px-2 py-1.5">
      <div className="flex h-[44px] w-[32px] items-center justify-center rounded bg-aura-bg3">
        <span className="font-mono text-[9px] text-aura-muted">?</span>
      </div>
      <span className="font-mono text-[10px] text-aura-muted">TBD</span>
    </div>
  );
}

function MatchupPair({ matchup }: { matchup: Matchup }) {
  return (
    <div className="flex flex-col gap-0.5">
      <BracketSlot matchup={matchup} position="top" />
      <BracketSlot matchup={matchup} position="bottom" />
    </div>
  );
}

export default function BracketOverview({ bracket }: BracketOverviewProps) {
  const allMatchups = [
    ...bracket.quarterfinals,
    ...bracket.semifinals,
    ...(bracket.final ? [bracket.final] : []),
  ];

  return (
    <>
      {/* Desktop: horizontal bracket */}
      <div className="hidden rounded-xl bg-[#212121] p-5 md:block">
        <div className="mb-4 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-aura-muted">
            {bracket.season} Bracket
          </span>
          {bracket.champion && (
            <span className="font-mono text-[11px] font-semibold text-aura-orange">
              Champion: {bracket.champion.title}
            </span>
          )}
        </div>

        <div className="flex items-center gap-6">
          {/* Quarterfinals column */}
          <div className="flex flex-1 flex-col gap-4">
            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-aura-muted2">
              Quarterfinals
            </span>
            {bracket.quarterfinals.map((m) => (
              <MatchupPair key={m.id} matchup={m} />
            ))}
          </div>

          {/* Connector lines */}
          <div className="flex flex-col items-center gap-[88px] py-6">
            <div className="h-px w-6 bg-white/10" />
            <div className="h-px w-6 bg-white/10" />
          </div>

          {/* Semifinals column */}
          <div className="flex flex-1 flex-col gap-4">
            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-aura-muted2">
              Semifinals
            </span>
            {bracket.semifinals.map((m) =>
              m.status === "upcoming" ? (
                <div key={m.id} className="flex flex-col gap-0.5">
                  <TBDSlot />
                  <TBDSlot />
                </div>
              ) : (
                <MatchupPair key={m.id} matchup={m} />
              ),
            )}
          </div>

          {/* Connector line */}
          <div className="flex flex-col items-center py-6">
            <div className="h-px w-6 bg-white/10" />
          </div>

          {/* Final column */}
          <div className="flex flex-1 flex-col gap-4">
            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-aura-muted2">
              Final
            </span>
            {bracket.final ? (
              <MatchupPair matchup={bracket.final} />
            ) : (
              <div className="flex flex-col gap-0.5">
                <TBDSlot />
                <TBDSlot />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile: vertical list */}
      <div className="flex flex-col gap-3 md:hidden">
        {allMatchups.map((m) => {
          const roundLabel =
            m.round === "quarterfinal"
              ? "QF"
              : m.round === "semifinal"
                ? "SF"
                : "Final";

          return (
            <div key={m.id} className="rounded-xl bg-[#212121] p-3">
              <span className="mb-2 block font-mono text-[9px] uppercase tracking-[0.15em] text-aura-muted">
                {roundLabel} {m.round !== "final" ? m.position : ""}
              </span>
              {m.status === "upcoming" ? (
                <div className="flex flex-col gap-0.5">
                  <TBDSlot />
                  <TBDSlot />
                </div>
              ) : (
                <MatchupPair matchup={m} />
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
