import {
  SkeletonBlock,
  SkeletonCardGrid,
  SkeletonPageLayout,
} from "@/components/shared/Skeletons";

export default function ChroniclesLoading() {
  return (
    <SkeletonPageLayout>
      {/* Chronicles hero */}
      <SkeletonBlock className="h-[120px] rounded-xl" />

      <section className="flex flex-col gap-5">
        {/* Sort tabs */}
        <div className="flex gap-2">
          <SkeletonBlock className="h-8 w-16 rounded-full" />
          <SkeletonBlock className="h-8 w-20 rounded-full" />
          <SkeletonBlock className="h-8 w-14 rounded-full" />
          <SkeletonBlock className="h-8 w-18 rounded-full" />
          <SkeletonBlock className="h-8 w-20 rounded-full" />
        </div>

        {/* Card grid */}
        <SkeletonCardGrid count={6} />
      </section>
    </SkeletonPageLayout>
  );
}
