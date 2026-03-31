import {
  SkeletonBlock,
  SkeletonLabel,
  SkeletonPageLayout,
  SkeletonPosterRow,
} from "@/components/shared/Skeletons";

export default function DiscoverLoading() {
  return (
    <SkeletonPageLayout>
      {/* Discover hero */}
      <SkeletonBlock className="h-[120px] rounded-xl" />

      {/* Trending */}
      <section className="flex flex-col gap-5">
        <SkeletonLabel />
        <SkeletonPosterRow count={6} />
      </section>

      {/* Popular */}
      <section className="flex flex-col gap-5">
        <SkeletonLabel />
        <SkeletonPosterRow count={6} />
      </section>

      {/* Cult Favorites */}
      <section className="flex flex-col gap-5">
        <SkeletonLabel />
        <SkeletonPosterRow count={6} />
      </section>

      {/* Hidden Gems */}
      <section className="flex flex-col gap-5">
        <SkeletonLabel />
        <SkeletonPosterRow count={6} />
      </section>
    </SkeletonPageLayout>
  );
}
