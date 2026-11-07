"use client";

import { useRouter } from "next/navigation";
import { AlertCircle, ClipboardCheck, UsersRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AssignedTeam } from "@/lib/evaluator/types";
import { useEvaluatorWorkspace } from "@/lib/evaluator/workspace";

type Filter = "all" | "pending" | "completed";

const copy: Record<Filter, { title: string; description: string }> = {
  all: {
    title: "My teams",
    description:
      "All teams assigned to your active panels, with pending teams first.",
  },
  pending: {
    title: "Pending evaluations",
    description: "These teams still need a confirmed evaluation.",
  },
  completed: {
    title: "Completed evaluations",
    description: "Teams whose scores you have submitted and confirmed.",
  },
};

function StatusBadge({ status }: { status: AssignedTeam["evaluationStatus"] }) {
  if (status === "confirmed")
    return <Badge className="bg-emerald-100 text-emerald-800">Completed</Badge>;
  if (status === "in-progress")
    return <Badge className="bg-sky-100 text-sky-800">Draft saved</Badge>;
  return <Badge className="bg-amber-100 text-amber-900">Pending</Badge>;
}

function totalScore(team: AssignedTeam) {
  if (!team.evaluation?.scores.length) return "-";
  const value = team.evaluation.scores.reduce(
    (sum, score) => sum + score.value,
    0,
  );
  const maximum = team.evaluation.scores.reduce(
    (sum, score) => sum + score.criterion.maxScore,
    0,
  );
  return `${value} / ${maximum}`;
}

export function AssignmentsView({ filter }: { filter: Filter }) {
  const router = useRouter();
  const { teams, error, isLoading } = useEvaluatorWorkspace();
  const content = copy[filter];
  const filteredTeams = teams.filter((team) => {
    if (filter === "all") return true;
    if (filter === "pending") return team.evaluationStatus !== "confirmed";
    return team.evaluationStatus === "confirmed";
  });

  return (
    <section>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-muted-foreground">Evaluator workspace</p>
          <h2 className="mt-1 font-heading text-3xl font-semibold tracking-tight">
            {content.title}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {content.description}
          </p>
        </div>
      </div>

      {error ? (
        <Card className="mt-7 border-destructive/30">
          <CardContent className="flex gap-3 pt-0 text-sm text-destructive">
            <AlertCircle
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            {error}
          </CardContent>
        </Card>
      ) : null}

      {isLoading ? (
        <p
          className="mt-5 text-sm text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          Refreshing assignments and scores...
        </p>
      ) : null}

      {!isLoading && !error && filteredTeams.length === 0 ? (
        <Card className="mt-7">
          <CardHeader className="items-center text-center">
            <ClipboardCheck
              className="size-8 text-primary"
              aria-hidden="true"
            />
            <CardTitle>
              {filter === "pending"
                ? "Everything is up to date"
                : "No teams to show"}
            </CardTitle>
            <CardDescription>
              {filter === "pending"
                ? "All currently assigned teams have confirmed scores."
                : "Assignments will appear when a round is active and you are added to its panel."}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {!isLoading && !error && filteredTeams.length > 0 ? (
        <Card className="mt-7">
          <CardContent className="pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    My score
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeams.map((team) => (
                  <TableRow
                    key={`${team.roundId}-${team.panelId}-${team.id}`}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                    onClick={() =>
                      router.push(
                        `/evaluator/rounds/${team.roundId}/teams/${team.id}`,
                      )
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        router.push(
                          `/evaluator/rounds/${team.roundId}/teams/${team.id}`,
                        );
                      }
                    }}
                    tabIndex={0}
                    role="link"
                    aria-label={`Open evaluation for ${team.name}`}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <UsersRound
                          className="size-4 text-primary"
                          aria-hidden="true"
                        />
                        {team.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={team.evaluationStatus} />
                    </TableCell>
                    <TableCell className="sm:table-cell">
                      <span className="inline-flex rounded-md bg-muted/80 px-2 py-1 text-xs font-medium text-foreground sm:text-sm">
                        {totalScore(team)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}
