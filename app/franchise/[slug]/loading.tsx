import { SkeletonBlock } from "@/components/shared/Skeletons";

function EntryGroupSkeleton() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:gap-7">
      <div className="flex shrink-0 flex-row items-center gap-4 sm:w-[100px] sm:flex-col sm:items-start sm:gap-2">
        <SkeletonBlock className="h-[80px] w-[57px] rounded-lg sm:h-[141px] sm:w-[100px]" />
        <div className="flex flex-col gap-1">
          <SkeletonBlock className="h-3 w-20" />
          <SkeletonBlock className="h-2.5 w-14" />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <SkeletonBlock className="h-12 rounded-lg" />
        <SkeletonBlock className="h-12 rounded-lg" />
        <SkeletonBlock className="h-12 rounded-lg" />
      </div>
    </div>
  );
}

export default function FranchiseLoading() {
  return (
    <main className="min-h-screen px-4 pt-10 pb-16 md:px-8 lg:px-[120px]">
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-12">
        {/* Main column */}
        <div className="flex flex-1 flex-col gap-8">
          {/* Hero banner */}
          <SkeletonBlock className="h-[200px] rounded-xl md:h-[260px] lg:h-[320px]" />

          {/* Tab bar */}
          <div className="flex gap-2">
            <SkeletonBlock className="h-10 w-40 rounded-full" />
            <SkeletonBlock className="h-10 w-28 rounded-full" />
            <SkeletonBlock className="h-10 w-32 rounded-full" />
          </div>

          {/* Entry groups */}
          <div className="flex flex-col gap-10">
            <EntryGroupSkeleton />
            <EntryGroupSkeleton />
            <EntryGroupSkeleton />
          </div>
        </div>

        {/* Sidebar */}
        <div className="hidden w-[300px] shrink-0 flex-col gap-4 lg:flex">
          <SkeletonBlock className="h-[250px] rounded-xl" />
          <SkeletonBlock className="h-[200px] rounded-xl" />
        </div>
      </div>
    </main>
  );
}
