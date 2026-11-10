"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ClipboardCheck, FileText, Lightbulb, UsersRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

const copy: Record<Filter, { title: string; description?: string }> = {
  all: {
    title: "My teams",
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
  const [viewingTeam, setViewingTeam] = useState<AssignedTeam | null>(null);
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
          <h2 className="mt-1 font-norse-bold text-3xl font-bold tracking-wide">
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
                  <TableHead className="text-right">Actions</TableHead>
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
                          className="size-4 shrink-0 text-primary"
                          aria-hidden="true"
                        />
                        <span className="font-semibold">{team.name}</span>
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
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1 rounded-lg text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingTeam(team);
                        }}
                      >
                        <FileText className="size-3.5" />
                        <span className="hidden sm:inline">View PS & Solution</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      {/* Problem Statement & Solution Dialog */}
      <Dialog
        open={Boolean(viewingTeam)}
        onOpenChange={(open) => {
          if (!open) setViewingTeam(null);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <UsersRound className="size-5 text-primary" />
              {viewingTeam?.name}
            </DialogTitle>
            <DialogDescription>
              {viewingTeam?.panelName} • Round {viewingTeam?.roundNumber} ({viewingTeam?.roundName})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-border/70 bg-muted/20 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-primary" />
                <h4 className="text-sm font-semibold text-foreground">Problem Statement</h4>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {viewingTeam?.submission?.problemStatement?.trim() ||
                  "No problem statement submitted yet."}
              </p>
            </div>

            <div className="rounded-xl border border-border/70 bg-muted/20 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Lightbulb className="size-4 text-amber-500" />
                <h4 className="text-sm font-semibold text-foreground">Proposed Solution</h4>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {viewingTeam?.submission?.solution?.trim() ||
                  "No solution description submitted yet."}
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setViewingTeam(null)}
            >
              Close
            </Button>
            {viewingTeam ? (
              <Button
                onClick={() => {
                  const target = viewingTeam;
                  setViewingTeam(null);
                  router.push(`/evaluator/rounds/${target.roundId}/teams/${target.id}`);
                }}
              >
                Go to Evaluation
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
