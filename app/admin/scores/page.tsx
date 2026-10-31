"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Trophy } from "lucide-react";

import {
  EmptyState,
  ErrorBanner,
  PageHeader,
  SuccessBanner,
  TableSkeleton,
} from "@/components/admin/feedback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { adminApi } from "@/lib/admin/data-source";
import { validateNote } from "@/lib/admin/validation";
import { getErrorMessage } from "@/lib/api/errors";
import type {
  EvaluationRecord,
  RoundResultsPayload,
  RoundSummary,
  ScoreItem,
} from "@/lib/api/types";

export default function ScoresPage() {
  const [rounds, setRounds] = useState<RoundSummary[]>([]);
  const [roundId, setRoundId] = useState("");
  const [evaluations, setEvaluations] = useState<EvaluationRecord[]>([]);
  const [results, setResults] = useState<RoundResultsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const [teamFilter, setTeamFilter] = useState("ALL");
  const [judgeFilter, setJudgeFilter] = useState("ALL");

  const [editingScore, setEditingScore] = useState<ScoreItem | null>(null);
  const [scoreValue, setScoreValue] = useState("");
  const [editingNote, setEditingNote] = useState<EvaluationRecord | null>(null);
  const [noteValue, setNoteValue] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const [confirmTop10Open, setConfirmTop10Open] = useState(false);
  const [settingTop10, setSettingTop10] = useState(false);

  const loadRounds = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const roundList = await adminApi.listRounds();
      setRounds(roundList);
      setRoundId((current) => current || roundList[0]?.id || "");
    } catch (err) {
      setError(getErrorMessage(err, "Could not load rounds."));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadScores = useCallback(async (id: string) => {
    if (!id) {
      setEvaluations([]);
      setResults(null);
      return;
    }
    setError(null);
    try {
      const [scoreList, resultPayload] = await Promise.all([
        adminApi.listRoundScores(id),
        adminApi.getRoundResults(id),
      ]);
      setEvaluations(scoreList);
      setResults(resultPayload);
    } catch (err) {
      setEvaluations([]);
      setResults(null);
      setError(getErrorMessage(err, "Could not load scores or results."));
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadRounds();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadRounds]);

  useEffect(() => {
    if (!roundId) return;
    const timeoutId = window.setTimeout(() => {
      setTeamFilter("ALL");
      setJudgeFilter("ALL");
      void loadScores(roundId);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [roundId, loadScores]);

  const teamOptions = useMemo(
    () =>
      [...new Map(evaluations.map((item) => [item.team.id, item.team])).values()],
    [evaluations],
  );
  const judgeOptions = useMemo(
    () =>
      [
        ...new Map(
          evaluations.map((item) => [item.evaluator.id, item.evaluator]),
        ).values(),
      ],
    [evaluations],
  );

  const filtered = evaluations.filter((item) => {
    if (teamFilter !== "ALL" && item.teamId !== teamFilter) return false;
    if (judgeFilter !== "ALL" && item.evaluatorId !== judgeFilter) return false;
    return true;
  });

  async function saveScore() {
    if (!editingScore) return;
    const value = Number(scoreValue);
    if (!Number.isFinite(value)) {
      setFormError("Enter a numeric score.");
      return;
    }
    if (value < 0 || value > editingScore.criterion.maxScore) {
      setFormError(`Score must be between 0 and ${editingScore.criterion.maxScore}.`);
      return;
    }
    setPending(true);
    setFormError(null);
    try {
      await adminApi.updateScore(editingScore.id, value);
      setSuccess("Score updated.");
      setEditingScore(null);
      await loadScores(roundId);
    } catch (err) {
      setFormError(getErrorMessage(err, "Could not update the score."));
    } finally {
      setPending(false);
    }
  }

  async function saveNote() {
    if (!editingNote) return;
    const noteError = validateNote(noteValue);
    if (noteError) {
      setFormError(noteError);
      return;
    }
    setPending(true);
    setFormError(null);
    try {
      await adminApi.updateEvaluationNote(editingNote.id, noteValue);
      setSuccess("Evaluation note updated.");
      setEditingNote(null);
      await loadScores(roundId);
    } catch (err) {
      setFormError(getErrorMessage(err, "Could not update the note."));
    } finally {
      setPending(false);
    }
  }

  const top10Candidates = useMemo(() => {
    if (!results?.results) return [];
    return results.results.slice(0, 10);
  }, [results]);

  const handlePromoteTop10 = async () => {
    if (top10Candidates.length === 0) return;
    setSettingTop10(true);
    try {
      const teamIds = top10Candidates.map((r) => r.teamId);
      const res = await adminApi.setTop10Teams(teamIds);
      setSuccess(
        res.message ||
          `${teamIds.length} team(s) marked as top 10 finalists for final round judging.`,
      );
      setConfirmTop10Open(false);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to set top 10 teams."));
    } finally {
      setSettingTop10(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        description="Individual scores come from GET /admin/rounds/:roundId/scores. Rankings and criterion averages come from GET /admin/rounds/:roundId/results, which averages each criterion across evaluators and then sums those averages. Admin score edits use PATCH /admin/scores/:scoreId."
        title="Scores & results"
      />

      <div className="flex flex-col gap-3 lg:flex-row">
        <select
          className="h-9 w-full max-w-md rounded-4xl border border-input bg-input/30 px-3 text-sm"
          onChange={(event) => setRoundId(event.target.value)}
          value={roundId}
        >
          {rounds.length === 0 ? <option value="">No rounds available</option> : null}
          {rounds.map((round) => (
            <option key={round.id} value={round.id}>
              {round.name} ({round.type})
            </option>
          ))}
        </select>
        <select
          className="h-9 w-full max-w-xs rounded-4xl border border-input bg-input/30 px-3 text-sm"
          onChange={(event) => setTeamFilter(event.target.value)}
          value={teamFilter}
        >
          <option value="ALL">All teams</option>
          {teamOptions.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
        <select
          className="h-9 w-full max-w-xs rounded-4xl border border-input bg-input/30 px-3 text-sm"
          onChange={(event) => setJudgeFilter(event.target.value)}
          value={judgeFilter}
        >
          <option value="ALL">All evaluators</option>
          {judgeOptions.map((evaluator) => (
            <option key={evaluator.id} value={evaluator.id}>
              {evaluator.username}
            </option>
          ))}
        </select>
        <Button onClick={() => void loadScores(roundId)} type="button" variant="outline">
          Refresh
        </Button>
      </div>

      {success ? <SuccessBanner message={success} /> : null}
      {error ? <ErrorBanner message={error} /> : null}
      {loading ? <TableSkeleton /> : null}

      {!loading && rounds.length === 0 && !error ? (
        <EmptyState
          detail="Create and start a round, then wait for evaluators to submit scores."
          title="No rounds"
        />
      ) : null}

      {roundId && !error ? (
        <Tabs defaultValue="results">
          <TabsList>
            <TabsTrigger value="results">Team results</TabsTrigger>
            <TabsTrigger value="evaluations">Individual scores</TabsTrigger>
          </TabsList>
          <TabsContent className="mt-4" value="results">
            {!results || results.results.length === 0 ? (
              <EmptyState
                detail="Results appear after evaluators submit scores for this round."
                title="No computed results"
              />
            ) : (
              <div className="space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    Rankings use the backend total of per-criterion averages for{" "}
                    {results.round.name}.
                  </p>
                  {results.results.length > 0 && (
                    <Button
                      onClick={() => setConfirmTop10Open(true)}
                      size="sm"
                      className="bg-amber-600 hover:bg-amber-700 text-white font-medium self-start sm:self-auto"
                    >
                      <Trophy className="mr-1.5 size-4" />
                      Set Top {Math.min(10, results.results.length)} as Finalists
                    </Button>
                  )}
                </div>
                {results.results.map((result, index) => (
                  <Card key={result.teamId}>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>
                        #{index + 1} {result.teamName}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge>
                          Total avg {result.totalAvgScore}
                        </Badge>
                        <Badge variant={result.isConfirmedByAll ? "default" : "outline"}>
                          {result.confirmedEvaluators}/{result.totalEvaluators} confirmed
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Criterion</TableHead>
                            <TableHead>Average</TableHead>
                            <TableHead>Max</TableHead>
                            <TableHead>Score count</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {result.criteriaResults.map((criterion) => (
                            <TableRow key={criterion.criterionId}>
                              <TableCell>{criterion.criterionName}</TableCell>
                              <TableCell>{criterion.avgScore}</TableCell>
                              <TableCell>{criterion.maxScore}</TableCell>
                              <TableCell>{criterion.confirmedCount}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent className="mt-4" value="evaluations">
            {filtered.length === 0 ? (
              <EmptyState
                detail="No evaluation sessions match the current filters."
                title="No individual scores"
              />
            ) : (
              <div className="space-y-3">
                {filtered.map((evaluation) => {
                  const submittedTotal = evaluation.scores.reduce(
                    (sum, score) => sum + score.value,
                    0,
                  );
                  return (
                    <Card key={evaluation.id}>
                      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle>
                          {evaluation.team.name}{" "}
                          <span className="text-sm font-normal text-muted-foreground">
                            scored by {evaluation.evaluator.username} (
                            {evaluation.evaluator.role})
                          </span>
                        </CardTitle>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant={evaluation.isConfirmed ? "default" : "outline"}>
                            {evaluation.isConfirmed ? "Confirmed" : "Draft"}
                          </Badge>
                          <Badge variant="secondary">
                            Submitted total {submittedTotal}
                          </Badge>
                          <Button
                            onClick={() => {
                              setEditingNote(evaluation);
                              setNoteValue(evaluation.note ?? "");
                              setFormError(null);
                            }}
                            size="sm"
                            variant="outline"
                          >
                            Edit note
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {evaluation.note ? (
                          <p className="text-sm text-muted-foreground">{evaluation.note}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground">No note.</p>
                        )}
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Criterion</TableHead>
                              <TableHead>Score</TableHead>
                              <TableHead>Max</TableHead>
                              <TableHead />
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {evaluation.scores.map((score) => (
                              <TableRow key={score.id}>
                                <TableCell>{score.criterion.name}</TableCell>
                                <TableCell>{score.value}</TableCell>
                                <TableCell>{score.criterion.maxScore}</TableCell>
                                <TableCell>
                                  <Button
                                    onClick={() => {
                                      setEditingScore(score);
                                      setScoreValue(String(score.value));
                                      setFormError(null);
                                    }}
                                    size="xs"
                                    variant="outline"
                                  >
                                    Edit
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      ) : null}

      <Dialog
        onOpenChange={(open) => {
          if (!open) setEditingScore(null);
        }}
        open={Boolean(editingScore)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update score</DialogTitle>
            <DialogDescription>
              {editingScore
                ? `${editingScore.criterion.name}: value must be between 0 and ${editingScore.criterion.maxScore}.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <Input
            onChange={(event) => setScoreValue(event.target.value)}
            step="0.01"
            type="number"
            value={scoreValue}
          />
          {formError ? <ErrorBanner message={formError} /> : null}
          <DialogFooter>
            <Button onClick={() => setEditingScore(null)} type="button" variant="outline">
              Cancel
            </Button>
            <Button disabled={pending} onClick={() => void saveScore()} type="button">
              {pending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        onOpenChange={(open) => {
          if (!open) setEditingNote(null);
        }}
        open={Boolean(editingNote)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update evaluation note</DialogTitle>
            <DialogDescription>Maximum 250 words, matching evaluator rules.</DialogDescription>
          </DialogHeader>
          <Textarea
            onChange={(event) => setNoteValue(event.target.value)}
            value={noteValue}
          />
          {formError ? <ErrorBanner message={formError} /> : null}
          <DialogFooter>
            <Button onClick={() => setEditingNote(null)} type="button" variant="outline">
              Cancel
            </Button>
            <Button disabled={pending} onClick={() => void saveNote()} type="button">
              {pending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={setConfirmTop10Open} open={confirmTop10Open}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Trophy className="size-5 text-amber-500" />
              <DialogTitle>Set Top 10 Finalists</DialogTitle>
            </div>
            <DialogDescription>
              Mark the top ranked teams from {results?.round.name} as official Top 10 finalists for the next round of judging.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Leaderboard Finalists ({top10Candidates.length}):
            </p>
            <div className="max-h-56 overflow-y-auto rounded-xl border border-border divide-y divide-border/60 bg-muted/20">
              {top10Candidates.map((c, i) => (
                <div key={c.teamId} className="flex items-center justify-between px-3 py-2 text-xs">
                  <span className="font-medium">
                    #{i + 1} {c.teamName}
                  </span>
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    Avg {c.totalAvgScore}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button onClick={() => setConfirmTop10Open(false)} type="button" variant="outline">
              Cancel
            </Button>
            <Button
              disabled={settingTop10}
              onClick={handlePromoteTop10}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {settingTop10 ? "Promoting…" : `Confirm Top ${top10Candidates.length} Finalists`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
