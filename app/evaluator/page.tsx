"use client";

import Link from "next/link";
import { ArrowRight, Clock3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useEvaluatorWorkspace } from "@/lib/evaluator/workspace";

export default function EvaluatorDashboardPage() {
  const { rounds, teams, error, isLoading } = useEvaluatorWorkspace();
  const pendingTeams = teams.filter(
    (team) => team.evaluationStatus !== "confirmed",
  );
  const nextPending = pendingTeams[0];

  if (isLoading) {
    return (
      <div className="grid gap-5">
        <Skeleton className="h-28" />
      </div>
    );
  }

  return (
    <section>
      {error ? (
        <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {pendingTeams.length > 0 ? (
        <Card className="border-amber-200 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock3 className="size-5 text-amber-700" aria-hidden="true" />
              {pendingTeams.length}{" "}
              {pendingTeams.length === 1 ? "team needs" : "teams need"}{" "}
              attention
            </CardTitle>
            <CardDescription>
              {pendingTeams
                .slice(0, 3)
                .map((team) => team.name)
                .join(", ")}
              {pendingTeams.length > 3
                ? `, and ${pendingTeams.length - 3} more`
                : ""}
            </CardDescription>
            {nextPending ? (
              <CardAction>
                <Button
                  className="rounded-xl"
                  nativeButton={false}
                  render={
                    <Link
                      href={`/evaluator/rounds/${nextPending.roundId}/teams/${nextPending.id}`}
                    />
                  }
                >
                  Start scoring <ArrowRight aria-hidden="true" />
                </Button>
              </CardAction>
            ) : null}
          </CardHeader>
        </Card>
      ) : null}

      <div className="mt-7 grid gap-4 lg:grid-cols-2">
        {rounds.map((round) => (
          <Card key={`${round.roundId}-${round.panelId}`}>
            <CardHeader>
              <CardTitle>{round.roundName}</CardTitle>
              <CardDescription>
                Round {round.roundNumber} / {round.roundType}
              </CardDescription>
              <CardAction>
                <Badge>Active</Badge>
              </CardAction>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
              <span>
                {round.panelName} / {round.teams.length} assigned{" "}
                {round.teams.length === 1 ? "team" : "teams"}
              </span>
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl"
                nativeButton={false}
                render={<Link href="/evaluator/teams" />}
              >
                View teams
              </Button>
            </CardContent>
          </Card>
        ))}
        {!rounds.length ? (
          <Card>
            <CardHeader>
              <CardTitle>No active panel assignments</CardTitle>
              <CardDescription>
                Your active rounds will appear here once an administrator starts
                a round and assigns you to a panel.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}
      </div>
    </section>
  );
}
