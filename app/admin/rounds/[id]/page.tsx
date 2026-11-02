import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { RoundDetailView } from "./round-detail-view";

type RoundDetailPageProps = PageProps<"/admin/rounds/[id]">;

export default function RoundDetailPage({ params }: RoundDetailPageProps) {
  return (
    <Suspense fallback={<RoundDetailSkeleton />}>
      <RoundDetailContent params={params} />
    </Suspense>
  );
}

async function RoundDetailContent({
  params,
}: Pick<RoundDetailPageProps, "params">) {
  const { id } = await params;
  return <RoundDetailView roundId={id} />;
}

function RoundDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-32" />
      <Skeleton className="h-28 w-full" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}
