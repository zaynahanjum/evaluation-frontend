import { Suspense } from "react";

import { EvaluationScreen } from "@/components/evaluator/evaluate/evaluation-screen";
import { Skeleton } from "@/components/ui/skeleton";

type TeamEvaluationPageProps =
  PageProps<"/evaluator/rounds/[roundId]/teams/[teamId]">;

export default function TeamEvaluationPage({
  params,
}: TeamEvaluationPageProps) {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <TeamEvaluationContent params={params} />
    </Suspense>
  );
}

async function TeamEvaluationContent({
  params,
}: Pick<TeamEvaluationPageProps, "params">) {
  const { roundId, teamId } = await params;
  return <EvaluationScreen roundId={roundId} teamId={teamId} />;
}
