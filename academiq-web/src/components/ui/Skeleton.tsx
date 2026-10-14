import { classNames } from "../../lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={classNames(
        "animate-pulse rounded-md bg-bg-tertiary",
        className
      )}
    />
  );
}

export function CourseCardSkeleton() {
  return (
    <div className="rounded-xl border border-bg-border bg-bg-secondary p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <Skeleton className="h-6 w-20 mb-2" />
          <Skeleton className="h-3 w-full mb-1.5" />
          <Skeleton className="h-3 w-3/4" />
        </div>
        <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
      </div>
      <div className="border-t border-bg-border pt-3">
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-bg-border bg-bg-secondary p-3 sm:p-4">
      <Skeleton className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg mb-2" />
      <Skeleton className="h-6 w-12 mb-1.5" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

export function CourseGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <CourseCardSkeleton key={i} />
      ))}
    </div>
  );
}
