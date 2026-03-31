import {
  SkeletonBlock,
  SkeletonCardGrid,
  SkeletonLabel,
  SkeletonPageLayout,
  SkeletonPosterRow,
} from "@/components/shared/Skeletons";

export default function HomeLoading() {
  return (
    <SkeletonPageLayout>
      {/* Hero */}
      <SkeletonBlock className="h-[200px] rounded-xl" />

      {/* Updated Chronicles */}
      <section className="flex flex-col gap-5">
        <SkeletonLabel />
        <SkeletonCardGrid count={3} />
      </section>

      {/* Recently Added */}
      <section className="flex flex-col gap-5">
        <SkeletonLabel />
        <SkeletonCardGrid count={3} />
      </section>

      {/* Popular Season */}
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
