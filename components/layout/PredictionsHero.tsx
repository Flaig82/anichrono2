import SectionLabel from "@/components/shared/SectionLabel";

export default function PredictionsHero() {
  return (
    <div
      className="relative overflow-hidden rounded-xl px-6 py-8 md:px-10 md:py-10 lg:px-16 lg:py-12"
      style={{
        backgroundImage:
          "linear-gradient(270deg, #121212 0%, transparent 100%), linear-gradient(90deg, rgba(236,72,153,0.15), rgba(236,72,153,0.15)), linear-gradient(90deg, #313131, #313131)",
      }}
    >
      {/* Pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{ backgroundImage: "url(/images/pattern.png)", backgroundRepeat: "repeat" }}
      />

      <div className="relative flex flex-col gap-3.5">
        <SectionLabel>Oracle Predictions</SectionLabel>
        <h1 className="max-w-[641px] font-body text-[28px] font-bold leading-none tracking-[-0.56px] text-white md:text-[36px] md:tracking-[-0.72px] lg:text-[48px] lg:tracking-[-0.96px]">
          Vote for the best
          <br />
          of the season.
        </h1>
        <p className="max-w-[460px] font-body text-sm leading-[1.62] tracking-[-0.14px] text-white">
          Head-to-head matchups, seasonal awards — your picks shape the community rankings.
        </p>
      </div>
    </div>
  );
}
