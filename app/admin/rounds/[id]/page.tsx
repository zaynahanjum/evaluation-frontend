"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  ExternalLink,
  Layers,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  Square,
  Trash2,
  Trophy,
  Users,
  UsersRound,
} from "lucide-react";

import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { ErrorBanner, SuccessBanner } from "@/components/admin/feedback";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { adminApi } from "@/lib/admin/data-source";
import { validateCriterionName, validateMaxScore, validateNote } from "@/lib/admin/validation";
import { getErrorMessage } from "@/lib/api/errors";
import type { Criterion, EvaluationRecord, RoundDetail, RoundSummary, ScoreItem } from "@/lib/api/types";
import { cn } from "@/lib/utils";

function statusVariant(status: RoundSummary["status"]) {
  if (status === "ACTIVE") return "default" as const;
  if (status === "ENDED") return "secondary" as const;
  return "outline" as const;
}

export default function RoundDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const roundId = params?.id;

  const [round, setRound] = useState<RoundDetail | null>(null);
  const [evaluations, setEvaluations] = useState<EvaluationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Round actions
  const [confirmAction, setConfirmAction] = useState<"start" | "end" | "delete" | null>(null);
  const [actionPending, setActionPending] = useState(false);

  // Criteria Modal State
  const [criterionOpen, setCriterionOpen] = useState(false);
  const [editingCriterion, setEditingCriterion] = useState<Criterion | null>(null);
  const [criterionName, setCriterionName] = useState("");
  const [criterionDescription, setCriterionDescription] = useState("");
  const [criterionMax, setCriterionMax] = useState("10");
  const [criterionError, setCriterionError] = useState<string | null>(null);
  const [savingCriterion, setSavingCriterion] = useState(false);

  // Delete Criterion State
  const [deleteCriterion, setDeleteCriterion] = useState<Criterion | null>(null);
  const [deletingCriterion, setDeletingCriterion] = useState(false);

  // Score & Note Override State
  const [editingScore, setEditingScore] = useState<ScoreItem | null>(null);
  const [scoreValue, setScoreValue] = useState("");
  const [editingNote, setEditingNote] = useState<EvaluationRecord | null>(null);
  const [noteValue, setNoteValue] = useState("");
  const [overrideError, setOverrideError] = useState<string | null>(null);
  const [savingOverride, setSavingOverride] = useState(false);

  const loadRound = useCallback(async () => {
    if (!roundId) return;
    setLoading(true);
    setError(null);
    try {
      const [roundData, scoresData] = await Promise.all([
        adminApi.getRound(roundId),
        adminApi.listRoundScores(roundId).catch(() => []),
      ]);
      setRound(roundData);
      setEvaluations(scoresData);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load round details."));
    } finally {
      setLoading(false);
    }
  }, [roundId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadRound();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadRound]);

  // Round lifecycle action
  const handleRoundAction = async () => {
    if (!round || !confirmAction) return;
    setActionPending(true);
    setError(null);
    try {
      if (confirmAction === "start") {
        await adminApi.startRound(round.id);
        setSuccess("Round started successfully.");
        await loadRound();
      } else if (confirmAction === "end") {
        await adminApi.endRound(round.id);
        setSuccess("Round ended successfully.");
        await loadRound();
      } else if (confirmAction === "delete") {
        await adminApi.deleteRound(round.id);
        router.push("/admin/rounds");
        return;
      }
      setConfirmAction(null);
    } catch (err) {
      setError(getErrorMessage(err, `Failed to ${confirmAction} round.`));
      setConfirmAction(null);
    } finally {
      setActionPending(false);
    }
  };

  // Criterion handlers
  const openAddCriterion = () => {
    setEditingCriterion(null);
    setCriterionName("");
    setCriterionDescription("");
    setCriterionMax("10");
    setCriterionError(null);
    setCriterionOpen(true);
  };

  const openEditCriterion = (c: Criterion) => {
    setEditingCriterion(c);
    setCriterionName(c.name);
    setCriterionDescription(c.description ?? "");
    setCriterionMax(String(c.maxScore));
    setCriterionError(null);
    setCriterionOpen(true);
  };

  const handleSaveCriterion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!round) return;

    const nameErr = validateCriterionName(criterionName);
    const maxErr = validateMaxScore(criterionMax);
    if (nameErr || maxErr) {
      setCriterionError(nameErr ?? maxErr);
      return;
    }

    setSavingCriterion(true);
    setCriterionError(null);
    try {
      const payload = {
        name: criterionName.trim(),
        description: criterionDescription.trim() || undefined,
        maxScore: Number(criterionMax),
      };

      if (editingCriterion) {
        await adminApi.updateCriteria(editingCriterion.id, payload);
        setSuccess(`Criterion "${payload.name}" updated.`);
      } else {
        await adminApi.createCriteria(round.id, payload);
        setSuccess(`Criterion "${payload.name}" added.`);
      }

      setCriterionOpen(false);
      await loadRound();
    } catch (err) {
      setCriterionError(getErrorMessage(err, "Failed to save criterion."));
    } finally {
      setSavingCriterion(false);
    }
  };

  const handleDeleteCriterion = async () => {
    if (!deleteCriterion) return;
    setDeletingCriterion(true);
    try {
      await adminApi.deleteCriteria(deleteCriterion.id);
      setSuccess(`Criterion "${deleteCriterion.name}" deleted.`);
      setDeleteCriterion(null);
      await loadRound();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete criterion."));
      setDeleteCriterion(null);
    } finally {
      setDeletingCriterion(false);
    }
  };

  const handleSaveScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingScore) return;
    const val = Number(scoreValue);
    if (!Number.isFinite(val)) {
      setOverrideError("Please enter a valid numeric score.");
      return;
    }
    if (val < 0 || val > editingScore.criterion.maxScore) {
      setOverrideError(`Score must be between 0 and ${editingScore.criterion.maxScore}.`);
      return;
    }

    setSavingOverride(true);
    setOverrideError(null);
    try {
      await adminApi.updateScore(editingScore.id, val);
      setSuccess("Individual score updated.");
      setEditingScore(null);
      await loadRound();
    } catch (err) {
      setOverrideError(getErrorMessage(err, "Failed to update score."));
    } finally {
      setSavingOverride(false);
    }
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNote) return;
    const noteErr = validateNote(noteValue);
    if (noteErr) {
      setOverrideError(noteErr);
      return;
    }

    setSavingOverride(true);
    setOverrideError(null);
    try {
      await adminApi.updateEvaluationNote(editingNote.id, noteValue);
      setSuccess("Evaluation note updated.");
      setEditingNote(null);
      await loadRound();
    } catch (err) {
      setOverrideError(getErrorMessage(err, "Failed to update evaluation note."));
    } finally {
      setSavingOverride(false);
    }
  };

  if (loading) {
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

  if (error || !round) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          size="sm"
          className="rounded-xl"
          nativeButton={false}
          render={<Link href="/admin/rounds" />}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span>Back to Rounds</span>
        </Button>
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-destructive">Round not found</CardTitle>
            <CardDescription>{error ?? "The requested evaluation round could not be loaded."}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => void loadRound()} variant="outline" className="rounded-xl">
              <RefreshCw className="size-4" aria-hidden="true" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation & Actions Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="rounded-xl self-start"
          nativeButton={false}
          render={<Link href="/admin/rounds" />}
        >
          <ArrowLeft className="size-4 mr-1" aria-hidden="true" />
          <span>Back to Rounds</span>
        </Button>

        <div className="flex flex-wrap items-center gap-2">
          {round.status === "PENDING" && (
            <Button
              onClick={() => setConfirmAction("start")}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs"
            >
              <Play className="size-3.5 mr-1.5" />
              Start Round
            </Button>
          )}

          {round.status === "ACTIVE" && (
            <Button
              onClick={() => setConfirmAction("end")}
              size="sm"
              variant="outline"
              className="font-medium text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30"
            >
              <Square className="size-3.5 mr-1.5" />
              End Round
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            className="rounded-xl font-medium"
            nativeButton={false}
            render={<Link href="/admin/scores" />}
          >
            <Trophy className="size-3.5 mr-1.5 text-amber-500" />
            <span>Scores & Leaderboard</span>
          </Button>

          <Button
            onClick={() => setConfirmAction("delete")}
            size="sm"
            variant="outline"
            className="rounded-xl text-destructive hover:text-destructive border-destructive/20 hover:bg-destructive/10"
          >
            <Trash2 className="size-3.5 mr-1.5" />
            Delete Round
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => void loadRound()}
            disabled={loading}
          >
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} aria-hidden="true" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {error ? <ErrorBanner message={error} /> : null}
      {success ? <SuccessBanner message={success} /> : null}

      {/* Round Header Overview */}
      <Card>
        <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-heading text-2xl font-semibold tracking-tight">
                {round.name}
              </h1>
              <Badge variant="secondary" className="font-medium">
                Round #{round.roundNumber} • {round.type}
              </Badge>
              <Badge variant={statusVariant(round.status)}>{round.status}</Badge>
            </div>
            <p className="font-mono text-xs text-muted-foreground">ID: {round.id}</p>
          </div>

          <div className="flex flex-col gap-1 text-xs text-muted-foreground sm:text-right">
            <div className="flex items-center gap-1.5 sm:justify-end">
              <Calendar className="size-3.5 text-primary" />
              <span>Created: {new Date(round.createdAt).toLocaleDateString()}</span>
            </div>
            {round.startedAt && (
              <div className="flex items-center gap-1.5 sm:justify-end">
                <Clock className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Started: {new Date(round.startedAt).toLocaleString()}</span>
              </div>
            )}
            {round.endedAt && (
              <div className="flex items-center gap-1.5 sm:justify-end">
                <CheckCircle2 className="size-3.5 text-amber-600 dark:text-amber-400" />
                <span>Ended: {new Date(round.endedAt).toLocaleString()}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Metric Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider">
              Scoring Criteria
            </CardDescription>
            <CardTitle className="text-2xl font-bold">{round.criteria.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Rubric metrics used to evaluate participating teams
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider">
              Assigned Panels
            </CardDescription>
            <CardTitle className="text-2xl font-bold">{round.panels.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Evaluator groups reviewing teams for this round
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider">
              Submitted Evaluations
            </CardDescription>
            <CardTitle className="text-2xl font-bold">{round._count.evaluations}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Total completed team scoring sessions
          </CardContent>
        </Card>
      </div>

      {/* Criteria Section */}
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 font-heading text-lg">
              <SlidersHorizontal className="size-5 text-primary" />
              Scoring Criteria ({round.criteria.length})
            </CardTitle>
            <CardDescription>
              Evaluation rubric questions and maximum scores configured for this round.
            </CardDescription>
          </div>
          <Button onClick={openAddCriterion} size="sm" className="self-start sm:self-auto">
            <Plus className="size-4 mr-1.5" />
            Add Criterion
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {round.criteria.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              No scoring criteria defined yet. Click &quot;Add Criterion&quot; to establish the rubric.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Criterion Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Max Score</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {round.criteria.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium text-sm">{c.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-md">
                      {c.description ? (
                        <span className="line-clamp-2">{c.description}</span>
                      ) : (
                        <span className="italic text-muted-foreground/60">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {c.maxScore} pts
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          onClick={() => openEditCriterion(c)}
                          size="xs"
                          variant="ghost"
                          title="Edit Criterion"
                        >
                          <Pencil className="size-3.5" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          onClick={() => setDeleteCriterion(c)}
                          size="xs"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          title="Delete Criterion"
                        >
                          <Trash2 className="size-3.5" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Panels Section */}
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 font-heading text-lg">
              <Layers className="size-5 text-primary" />
              Configured Panels ({round.panels.length})
            </CardTitle>
            <CardDescription>
              Panels, assigned evaluators, and assigned teams for this round.
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="self-start sm:self-auto"
            nativeButton={false}
            render={<Link href="/admin/panels" />}
          >
            <span>Manage Panels</span>
            <ExternalLink className="size-3.5 ml-1 text-muted-foreground" />
          </Button>
        </CardHeader>
        <CardContent>
          {round.panels.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              No panels created for this round yet. Visit the Panels page to create one.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {round.panels.map((panel) => (
                <div
                  key={panel.id}
                  className="rounded-xl border border-border bg-card p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">{panel.name}</h3>
                    <Badge variant="outline" className="text-[10px]">
                      {panel.members.length} members • {panel.teams.length} teams
                    </Badge>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="size-3.5 text-primary" />
                      <span className="font-medium text-foreground">Evaluators:</span>
                    </div>
                    {panel.members.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground italic pl-5">
                        No evaluators assigned.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 pl-5">
                        {panel.members.map((m) => (
                          <Badge key={m.id} variant="secondary" className="text-[11px] font-normal">
                            {m.user.username} ({m.user.role})
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs pt-1 border-t border-border/60">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <UsersRound className="size-3.5 text-primary" />
                      <span className="font-medium text-foreground">Assigned Teams:</span>
                    </div>
                    {panel.teams.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground italic pl-5">
                        No teams assigned.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 pl-5">
                        {panel.teams.map((t) => (
                          <Badge key={t.id} variant="outline" className="text-[11px] font-normal">
                            {t.team.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Evaluation Sessions & Submitted Scores Section */}
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 font-heading text-lg">
              <ClipboardCheck className="size-5 text-primary" />
              Evaluation Sessions & Submitted Scores ({evaluations.length})
            </CardTitle>
            <CardDescription>
              All submitted and unconfirmed evaluation sessions for this round.
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="self-start sm:self-auto font-medium"
            nativeButton={false}
            render={<Link href="/admin/scores" />}
          >
            <span>Open Scores & Leaderboard</span>
            <ExternalLink className="size-3.5 ml-1 text-muted-foreground" />
          </Button>
        </CardHeader>
        <CardContent>
          {evaluations.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              No evaluation sessions recorded for this round yet.
            </div>
          ) : (
            <div className="space-y-3">
              {evaluations.map((ev) => {
                const totalScore = ev.scores.reduce((sum, s) => sum + s.value, 0);
                const maxPossible = ev.scores.reduce((sum, s) => sum + s.criterion.maxScore, 0);

                return (
                  <div
                    key={ev.id}
                    className="rounded-xl border border-border bg-card p-4 space-y-3 transition-colors hover:border-foreground/20"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm">{ev.team.name}</h4>
                          {ev.isConfirmed ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-300 dark:text-emerald-400 text-[10px]">
                              Confirmed
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px]">
                              In Progress / Unconfirmed
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Evaluated by{" "}
                          <span className="font-medium text-foreground">
                            {ev.evaluator.username}
                          </span>{" "}
                          ({ev.evaluator.role})
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <Badge variant="secondary" className="font-mono text-xs font-semibold">
                          Total: {totalScore} / {maxPossible} pts
                        </Badge>
                        <Button
                          onClick={() => {
                            setEditingNote(ev);
                            setNoteValue(ev.note ?? "");
                            setOverrideError(null);
                          }}
                          size="xs"
                          variant="outline"
                          className="h-6 text-[11px]"
                        >
                          <Pencil className="size-2.5 mr-1" />
                          Edit Note
                        </Button>
                      </div>
                    </div>

                    {ev.note ? (
                      <p className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-lg border border-border/50">
                        &quot;{ev.note}&quot;
                      </p>
                    ) : null}

                    {ev.scores.length > 0 ? (
                      <div className="flex flex-wrap gap-2 pt-1 border-t border-border/50">
                        {ev.scores.map((score) => (
                          <div
                            key={score.id}
                            className="flex items-center gap-1.5 rounded-md bg-muted/40 px-2 py-1 text-[11px]"
                          >
                            <span className="text-muted-foreground">{score.criterion.name}:</span>
                            <span className="font-mono font-semibold text-foreground">
                              {score.value}/{score.criterion.maxScore}
                            </span>
                            <Button
                              onClick={() => {
                                setEditingScore(score);
                                setScoreValue(String(score.value));
                                setOverrideError(null);
                              }}
                              size="xs"
                              variant="ghost"
                              className="h-4 w-4 p-0 text-muted-foreground hover:text-foreground"
                              title="Edit score"
                            >
                              <Pencil className="size-2.5" />
                              <span className="sr-only">Edit score</span>
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Criterion Dialog */}
      <Dialog onOpenChange={setCriterionOpen} open={criterionOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCriterion ? "Edit Criterion" : "Add Scoring Criterion"}
            </DialogTitle>
            <DialogDescription>
              Define the metric and maximum points evaluators will grade against.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4 pt-2" onSubmit={handleSaveCriterion}>
            {criterionError ? <ErrorBanner message={criterionError} /> : null}

            <div className="space-y-1.5">
              <Label htmlFor="crit-name">Criterion Name *</Label>
              <Input
                id="crit-name"
                onChange={(e) => setCriterionName(e.target.value)}
                placeholder="e.g. Code Quality, Innovation, UI/UX"
                required
                value={criterionName}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="crit-max">Maximum Score * (1 - 100)</Label>
              <Input
                id="crit-max"
                max={100}
                min={1}
                onChange={(e) => setCriterionMax(e.target.value)}
                required
                type="number"
                value={criterionMax}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="crit-desc">Description (optional)</Label>
              <Textarea
                id="crit-desc"
                onChange={(e) => setCriterionDescription(e.target.value)}
                placeholder="Guidelines or rubrics for the evaluators..."
                rows={3}
                value={criterionDescription}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                onClick={() => setCriterionOpen(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button disabled={savingCriterion} type="submit">
                {savingCriterion ? "Saving…" : editingCriterion ? "Save Changes" : "Add Criterion"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Criterion Confirmation Dialog */}
      <ConfirmDialog
        confirmLabel="Delete Criterion"
        description={
          deleteCriterion
            ? `Are you sure you want to delete criterion "${deleteCriterion.name}"? Existing scores for this criterion may be impacted.`
            : ""
        }
        onConfirm={handleDeleteCriterion}
        onOpenChange={(open) => !open && setDeleteCriterion(null)}
        open={Boolean(deleteCriterion)}
        pending={deletingCriterion}
        title="Delete Criterion"
      />

      {/* Round Lifecycle Confirm Dialog */}
      <ConfirmDialog
        confirmLabel={
          confirmAction === "start"
            ? "Start Round"
            : confirmAction === "end"
            ? "End Round"
            : "Delete Round"
        }
        description={
          confirmAction === "start"
            ? `Are you ready to activate "${round.name}"? Evaluators will be able to begin submitting scores.`
            : confirmAction === "end"
            ? `Are you sure you want to end "${round.name}"? Evaluator score submissions will be locked.`
            : `Permanently delete round "${round.name}"? This will delete all associated criteria, panels, and scores.`
        }
        onConfirm={handleRoundAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        open={Boolean(confirmAction)}
        pending={actionPending}
        title={
          confirmAction === "start"
            ? "Start Evaluation Round"
            : confirmAction === "end"
            ? "End Evaluation Round"
            : "Delete Evaluation Round"
        }
      />

      {/* Edit Individual Score Modal */}
      <Dialog
        onOpenChange={(open) => !open && setEditingScore(null)}
        open={Boolean(editingScore)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Update Score</DialogTitle>
            <DialogDescription>
              {editingScore
                ? `Admin override for "${editingScore.criterion.name}" (Max: ${editingScore.criterion.maxScore})`
                : ""}
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4 pt-2" onSubmit={handleSaveScore}>
            {overrideError ? <ErrorBanner message={overrideError} /> : null}

            <div className="space-y-1.5">
              <Label htmlFor="score-override-val">Score Value</Label>
              <Input
                id="score-override-val"
                max={editingScore?.criterion.maxScore}
                min={0}
                onChange={(e) => setScoreValue(e.target.value)}
                required
                step="0.01"
                type="number"
                value={scoreValue}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                onClick={() => setEditingScore(null)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button disabled={savingOverride} type="submit">
                {savingOverride ? "Saving…" : "Save Score"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Evaluation Note Modal */}
      <Dialog
        onOpenChange={(open) => !open && setEditingNote(null)}
        open={Boolean(editingNote)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Evaluation Note</DialogTitle>
            <DialogDescription>
              Admin override or update for this evaluation session feedback.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4 pt-2" onSubmit={handleSaveNote}>
            {overrideError ? <ErrorBanner message={overrideError} /> : null}

            <div className="space-y-1.5">
              <Label htmlFor="note-override-val">Session Note</Label>
              <Textarea
                id="note-override-val"
                onChange={(e) => setNoteValue(e.target.value)}
                placeholder="Enter feedback or evaluator note..."
                rows={4}
                value={noteValue}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                onClick={() => setEditingNote(null)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button disabled={savingOverride} type="submit">
                {savingOverride ? "Saving…" : "Save Note"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
