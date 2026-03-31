import { cn } from "@/lib/utils";

export function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-aura-bg3 motion-reduce:animate-none",
        className,
      )}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-xl bg-[#212121]">
      <SkeletonBlock className="h-[150px] rounded-none rounded-t-lg" />
      <div className="flex flex-col gap-3.5 p-6">
        <SkeletonBlock className="h-5 w-3/4" />
        <div className="h-px bg-[#121212] opacity-[0.48]" />
        <div className="flex flex-col gap-2">
          <SkeletonBlock className="h-3.5 w-1/2" />
          <SkeletonBlock className="h-3 w-1/3" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonPoster() {
  return <SkeletonBlock className="aspect-[3/4] w-full rounded-lg" />;
}

export function SkeletonLabel() {
  return <SkeletonBlock className="h-4 w-36" />;
}

export function SkeletonCardGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonPosterRow({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonPoster key={i} />
      ))}
    </div>
  );
}

export function SkeletonSidebar() {
  return (
    <div className="sticky top-[68px] hidden h-fit lg:block">
      <div className="flex w-[300px] flex-col gap-4">
        <SkeletonBlock className="h-[400px] rounded-xl" />
      </div>
    </div>
  );
}

export function SkeletonPageLayout({
  children,
  sidebar = true,
}: {
  children: React.ReactNode;
  sidebar?: boolean;
}) {
  return (
    <main className="flex min-h-screen gap-6 px-4 pt-6 pb-16 md:px-8 md:pt-10 lg:gap-12 lg:px-[120px]">
      <div className="flex flex-1 flex-col gap-10">{children}</div>
      {sidebar && <SkeletonSidebar />}
    </main>
  );
}
