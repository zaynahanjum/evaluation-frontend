"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  BarChart3,
  ChevronRight,
  ClipboardCheck,
  ExternalLink,
  FileText,
  FolderGit2,
  Globe,
  Lightbulb,
  Link2,
  MessageSquare,
  Trophy,
  UsersRound,
} from "lucide-react";

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
import type { AssignedTeam, PreviousRoundScoreSummary } from "@/lib/evaluator/types";
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
  const { teams, previousRounds, error, isLoading } = useEvaluatorWorkspace();
  const [viewingTeam, setViewingTeam] = useState<AssignedTeam | null>(null);
  const [selectedPreviousScore, setSelectedPreviousScore] = useState<{
    teamName: string;
    roundScore: PreviousRoundScoreSummary;
  } | null>(null);
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
                  {previousRounds.map((pr) => (
                    <TableHead key={pr.id} className="whitespace-nowrap">
                      {pr.name}
                    </TableHead>
                  ))}
                  <TableHead>Links</TableHead>
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
                    {previousRounds.map((pr) => {
                      const roundScore = team.previousRoundScores?.find(
                        (prs) => prs.roundId === pr.id,
                      );
                      const hasScore =
                        roundScore && roundScore.totalAvgScore !== null;

                      return (
                        <TableCell key={pr.id} className="whitespace-nowrap">
                          {hasScore ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPreviousScore({
                                  teamName: team.name,
                                  roundScore,
                                });
                              }}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-muted/60 px-2.5 py-1 text-xs font-semibold text-foreground transition-all hover:bg-primary/10 hover:border-primary/50 hover:text-primary group cursor-pointer"
                              title={`View ${pr.name} category marks distribution & notes`}
                            >
                              <span>{roundScore.totalAvgScore}</span>
                              <span className="text-[10px] text-muted-foreground font-normal">
                                /{roundScore.maxPossibleScore}
                              </span>
                              <ChevronRight className="size-3 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-transform" />
                            </button>
                          ) : (
                            <span className="text-xs text-muted-foreground pl-2.5">
                              —
                            </span>
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell className="align-middle whitespace-nowrap">
                      <div
                        className="flex flex-wrap items-center gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {team.submission?.githubRepoLink ? (
                          <a
                            href={team.submission.githubRepoLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-medium hover:bg-muted transition-colors"
                            title="GitHub Repository"
                          >
                            <FolderGit2 className="size-3 text-primary" />
                            <span>Code</span>
                          </a>
                        ) : null}

                        {team.submission?.deploymentLink ? (
                          <a
                            href={team.submission.deploymentLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-medium hover:bg-muted transition-colors"
                            title="Live Deployment"
                          >
                            <Globe className="size-3 text-primary" />
                            <span>Demo</span>
                          </a>
                        ) : null}

                        {team.submission?.driveLink ? (
                          <a
                            href={team.submission.driveLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-medium hover:bg-muted transition-colors"
                            title="Presentation / Drive"
                          >
                            <Link2 className="size-3 text-primary" />
                            <span>Drive</span>
                          </a>
                        ) : null}

                        {!team.submission?.githubRepoLink &&
                        !team.submission?.deploymentLink &&
                        !team.submission?.driveLink ? (
                          <span className="text-xs text-muted-foreground italic">
                            —
                          </span>
                        ) : null}
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
                        <span className="hidden sm:inline">View details</span>
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

            <div className="rounded-xl border border-border/70 bg-muted/20 p-4 space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Project Deliverable Links
              </h4>
              <div className="flex flex-wrap gap-2 pt-1">
                {viewingTeam?.submission?.githubRepoLink ? (
                  <a
                    href={viewingTeam.submission.githubRepoLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
                  >
                    <FolderGit2 className="size-3.5 text-primary" />
                    <span>GitHub Repository</span>
                    <ExternalLink className="size-3 text-muted-foreground" />
                  </a>
                ) : null}

                {viewingTeam?.submission?.deploymentLink ? (
                  <a
                    href={viewingTeam.submission.deploymentLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
                  >
                    <Globe className="size-3.5 text-primary" />
                    <span>Live Deployment</span>
                    <ExternalLink className="size-3 text-muted-foreground" />
                  </a>
                ) : null}

                {viewingTeam?.submission?.driveLink ? (
                  <a
                    href={viewingTeam.submission.driveLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
                  >
                    <Link2 className="size-3.5 text-primary" />
                    <span>Drive / Presentation</span>
                    <ExternalLink className="size-3 text-muted-foreground" />
                  </a>
                ) : null}

                {!viewingTeam?.submission?.githubRepoLink &&
                !viewingTeam?.submission?.deploymentLink &&
                !viewingTeam?.submission?.driveLink ? (
                  <span className="text-xs italic text-muted-foreground">
                    No external deliverable links provided.
                  </span>
                ) : null}
              </div>
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

      {/* Previous Round Scores & Feedback Dialog */}
      <Dialog
        open={Boolean(selectedPreviousScore)}
        onOpenChange={(open) => {
          if (!open) setSelectedPreviousScore(null);
        }}
      >
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex flex-wrap items-center justify-between gap-2 pr-6">
              <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                {selectedPreviousScore?.teamName}
              </DialogTitle>
              <Badge variant="secondary" className="text-xs">
                {selectedPreviousScore?.roundScore.roundName}
              </Badge>
            </div>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Overall Score Highlight */}
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Total Average Score
                </p>
                <p className="text-2xl font-bold text-foreground mt-0.5">
                  {selectedPreviousScore?.roundScore.totalAvgScore}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    / {selectedPreviousScore?.roundScore.maxPossibleScore}
                  </span>
                </p>
              </div>
            </div>

            {/* Marks Distribution by Category */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="size-4 text-primary" />
                <h4 className="text-sm font-semibold text-foreground">
                  Marks Distribution by Category
                </h4>
              </div>

              <div className="space-y-3 rounded-xl border border-border/70 bg-card p-4">
                {selectedPreviousScore?.roundScore.criteria.map((criterion) => {
                  const percentage =
                    criterion.maxScore > 0
                      ? Math.min(
                        100,
                        Math.round(
                          (criterion.avgScore / criterion.maxScore) * 100,
                        ),
                      )
                      : 0;

                  return (
                    <div key={criterion.criterionId} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground">
                          {criterion.criterionName}
                        </span>
                        <span className="font-semibold text-foreground">
                          {criterion.avgScore}{" "}
                          <span className="font-normal text-muted-foreground">
                            / {criterion.maxScore}
                          </span>
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Evaluator Notes */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="size-4 text-primary" />
                <h4 className="text-sm font-semibold text-foreground">
                  Evaluator Notes & Feedback
                </h4>
              </div>

              {selectedPreviousScore?.roundScore.notes &&
                selectedPreviousScore.roundScore.notes.length > 0 ? (
                <div className="space-y-2.5">
                  {selectedPreviousScore.roundScore.notes.map((n, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-border/70 bg-muted/20 p-3.5 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                        <span>
                          Feedback{" "}
                          {selectedPreviousScore.roundScore.notes.length > 1
                            ? `#${idx + 1}`
                            : ""}
                        </span>
                        {n.evaluatorName ? <span>by {n.evaluatorName}</span> : null}
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                        {n.note}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border/80 p-4 text-center">
                  <p className="text-xs text-muted-foreground">
                    No notes recorded for this round.
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedPreviousScore(null)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
