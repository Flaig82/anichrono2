import {
  SkeletonBlock,
  SkeletonCardGrid,
  SkeletonLabel,
  SkeletonPageLayout,
  SkeletonPosterRow,
} from "@/components/shared/Skeletons";

export default function SearchLoading() {
  return (
    <SkeletonPageLayout>
      {/* Search input */}
      <SkeletonBlock className="h-12 rounded-lg" />

      {/* Chronicles results */}
      <section className="flex flex-col gap-5">
        <SkeletonLabel />
        <SkeletonCardGrid count={3} />
      </section>

      {/* Unclaimed anime */}
      <section className="flex flex-col gap-5">
        <SkeletonLabel />
        <SkeletonPosterRow count={6} />
      </section>
    </SkeletonPageLayout>
  );
}
