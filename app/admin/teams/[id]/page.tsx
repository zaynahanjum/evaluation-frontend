import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamDetailView } from "./team-detail-view";

type TeamDetailPageProps = PageProps<"/admin/teams/[id]">;

export default function TeamDetailPage({ params }: TeamDetailPageProps) {
  return (
    <Suspense fallback={<TeamDetailSkeleton />}>
      <TeamDetailContent params={params} />
    </Suspense>
  );
}

async function TeamDetailContent({
  params,
}: Pick<TeamDetailPageProps, "params">) {
  const { id } = await params;
  return <TeamDetailView teamId={id} />;
}

function TeamDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-32" />
      <Skeleton className="h-28 w-full" />
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}
