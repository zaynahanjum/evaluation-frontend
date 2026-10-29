"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Save,
  TriangleAlert,
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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { getEvaluatorSession } from "@/lib/evaluator-session";
import { saveScores } from "@/lib/evaluator/api";
import type { AssignedTeam, EvaluationCriterion } from "@/lib/evaluator/types";
import { useEvaluatorWorkspace } from "@/lib/evaluator/workspace";

export function EvaluationScreen({
  roundId,
  teamId,
}: {
  roundId: string;
  teamId: string;
}) {
  const router = useRouter();
  const { teams, isLoading, refresh } = useEvaluatorWorkspace();
  const team = teams.find(
    (item) => item.roundId === roundId && item.id === teamId,
  );
  const currentIndex = teams.findIndex(
    (item) => item.roundId === roundId && item.id === teamId,
  );

  if (isLoading) return <Skeleton className="h-96" />;
  if (!team)
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team assignment unavailable</CardTitle>
          <CardDescription>
            This team is not in your current evaluator assignments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="rounded-xl"
            nativeButton={false}
            render={<Link href="/evaluator/teams" />}
          >
            Back to my teams
          </Button>
        </CardContent>
      </Card>
    );

  return (
    <div className="grid gap-5 lg:grid-cols-[16rem_minmax(0,1fr)]">
      <TeamRail
        teams={teams}
        currentTeam={team}
        currentRoundId={roundId}
        currentTeamId={teamId}
      />{" "}
      <ScoreEditor
        key={`${team.roundId}-${team.id}`}
        team={team}
        assignedTeams={teams}
        currentIndex={currentIndex}
        previous={teams[currentIndex - 1]}
        next={teams[currentIndex + 1]}
        refresh={refresh}
        router={router}
      />
    </div>
  );
}

function TeamRail({
  teams,
  currentTeam,
  currentRoundId,
  currentTeamId,
}: {
  teams: AssignedTeam[];
  currentTeam: AssignedTeam;
  currentRoundId: string;
  currentTeamId: string;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const listId = "assigned-teams-list";

  return (
    <Card className="h-fit lg:sticky lg:top-20 lg:self-start">
      <CardHeader>
        <Button
          variant="ghost"
          className="-mx-2 h-auto justify-between rounded-xl px-2 py-1"
          aria-expanded={isExpanded}
          aria-controls={listId}
          onClick={() => setIsExpanded((expanded) => !expanded)}
        >
          <span className="min-w-0 text-left">
            <CardTitle>Teams</CardTitle>
            <CardDescription className="mt-1">
              {isExpanded
                ? "Pending first"
                : `${currentTeam.name} / ${currentTeam.roundName}`}
            </CardDescription>
          </span>
          <ChevronDown
            className={`size-4 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </Button>
      </CardHeader>
      {isExpanded ? (
        <CardContent
          id={listId}
          className="grid max-h-72 gap-1 overflow-y-auto"
        >
          {teams.map((item) => (
            <Link
              key={`${item.roundId}-${item.id}`}
              href={`/evaluator/rounds/${item.roundId}/teams/${item.id}`}
              aria-current={
                item.roundId === currentRoundId && item.id === currentTeamId
                  ? "page"
                  : undefined
              }
              className={`flex items-center gap-2 rounded-lg px-2 py-2 text-sm ${item.roundId === currentRoundId && item.id === currentTeamId ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            >
              <span
                className={`size-2 shrink-0 rounded-full ${item.evaluationStatus === "confirmed" ? "bg-emerald-500" : item.evaluationStatus === "in-progress" ? "bg-sky-500" : "bg-amber-500"}`}
              />
              <span className="min-w-0">
                <span className="block truncate">{item.name}</span>
                <span className="block truncate text-xs opacity-75">
                  {item.roundName} / Round {item.roundNumber}
                </span>
              </span>
            </Link>
          ))}
        </CardContent>
      ) : null}
    </Card>
  );
}

function ScoreEditor({
  team,
  previous,
  next,
  refresh,
  router,
  assignedTeams,
  currentIndex,
}: {
  team: AssignedTeam;
  assignedTeams: AssignedTeam[];
  currentIndex: number;
  previous?: AssignedTeam;
  next?: AssignedTeam;
  refresh: () => void;
  router: ReturnType<typeof useRouter>;
}) {
  const scores = useMemo<
    {
      criterionId: string;
      value?: number;
      criterion: EvaluationCriterion;
    }[]
  >(() => {
    const savedScores = team.evaluation?.scores ?? [];

    if (!team.criteria.length) {
      return savedScores;
    }

    const savedByCriterion = new Map(
      savedScores.map((score) => [score.criterionId, score]),
    );

    return team.criteria.map(
      (criterion) =>
        savedByCriterion.get(criterion.id) ?? {
          criterionId: criterion.id,
          criterion,
        },
    );
  }, [team.criteria, team.evaluation]);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      scores.map((score) => [
        score.criterionId,
        score.value === undefined ? "" : String(score.value),
      ]),
    ),
  );
  const [note, setNote] = useState(() => team.evaluation?.note ?? "");
  const [state, setState] = useState<
    "saved" | "unsaved" | "saving" | "retrying" | "error"
  >(team.evaluation ? "saved" : "unsaved");
  const [error, setError] = useState<string | null>(null);

  const total = useMemo(
    () =>
      scores.reduce(
        (sum, score) => sum + (Number(values[score.criterionId]) || 0),
        0,
      ),
    [scores, values],
  );
  const maximum = scores.reduce(
    (sum, score) => sum + score.criterion.maxScore,
    0,
  );

  async function save(confirm: boolean, advanceAfterSubmit = false) {
    const session = getEvaluatorSession();
    if (!session) {
      router.replace("/evaluator/login");
      return;
    }

    const scorePayload = scores.map((score) => {
      const rawValue = values[score.criterionId]?.trim() ?? "";
      return {
        criterionId: score.criterionId,
        rawValue,
        value: Number(rawValue),
      };
    });
    const invalidScore = scorePayload.find(
      (score, index) =>
        !score.rawValue ||
        !Number.isFinite(score.value) ||
        score.value < 0 ||
        score.value > scores[index]!.criterion.maxScore,
    );

    if (invalidScore) {
      setState("error");
      setError("Enter a valid score for every criterion before saving.");
      return;
    }

    setState("saving");
    setError(null);
    try {
      await saveScores(
        team.roundId,
        team.id,
        session.accessToken,
        {
          scores: scorePayload.map((score) => ({
            criterionId: score.criterionId,
            value: score.value,
          })),
          note,
          confirm,
        },
        () => setState("retrying"),
      );
      setState("saved");
      refresh();

      if (advanceAfterSubmit && assignedTeams.length > 1) {
        const nextPending = assignedTeams.find(
          (candidate) =>
            (candidate.roundId !== team.roundId || candidate.id !== team.id) &&
            candidate.evaluationStatus !== "confirmed",
        );
        const sequentialNext =
          assignedTeams[(currentIndex + 1) % assignedTeams.length];
        const target = nextPending ?? sequentialNext;

        if (target) {
          router.push(
            `/evaluator/rounds/${target.roundId}/teams/${target.id}`,
            { scroll: true },
          );
        }
      }
    } catch (saveError) {
      setState("error");
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Scores could not be saved. Your entries are still in this form.",
      );
    }
  }

  return (
    <div className="min-w-0 space-y-5">
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="text-2xl">{team.name}</CardTitle>
            <CardDescription>
              {team.panelName} / Round {team.roundNumber}
            </CardDescription>
          </div>
          <Badge
            className={
              team.evaluationStatus === "confirmed"
                ? "bg-emerald-100 text-emerald-800"
                : team.evaluationStatus === "in-progress"
                  ? "bg-sky-100 text-sky-800"
                  : "bg-amber-100 text-amber-900"
            }
          >
            {team.evaluationStatus === "confirmed"
              ? "Completed"
              : team.evaluationStatus === "in-progress"
                ? "Draft saved"
                : "Pending"}
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <section>
            <h3 className="text-sm font-semibold">Problem statement</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
              {team.submission === undefined
                ? "Problem statement details are not available from the evaluator API."
                : team.submission?.problemStatement ||
                  "This team has not provided a problem statement."}
            </p>
          </section>
          <section>
            <h3 className="text-sm font-semibold">Solution</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
              {team.submission === undefined
                ? "Solution details are not available from the evaluator API."
                : team.submission?.solution ||
                  "This team has not provided a solution summary."}
            </p>
          </section>
        </CardContent>
      </Card>
      {!scores.length ? (
        <Card className="border-amber-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TriangleAlert className="size-5 text-amber-600" />
              Criteria unavailable
            </CardTitle>
            <CardDescription>
              No criteria were returned for this team. The evaluator API must
              provide the active round&apos;s criteria before a new score can be
              entered.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Scorecard</CardTitle>
            <CardDescription>
              Changes remain in this form until saved.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {scores.map((score) => (
              <label
                key={score.criterionId}
                className="grid gap-2 text-sm font-medium"
              >
                <span>
                  {score.criterion.name}{" "}
                  <span className="font-normal text-muted-foreground">
                    / {score.criterion.maxScore}
                  </span>
                </span>
                {score.criterion.description ? (
                  <span className="text-xs font-normal text-muted-foreground">
                    {score.criterion.description}
                  </span>
                ) : null}
                <Input
                  type="number"
                  min="0"
                  max={score.criterion.maxScore}
                  step="0.5"
                  value={values[score.criterionId] ?? ""}
                  onChange={(event) => {
                    setValues((current) => ({
                      ...current,
                      [score.criterionId]: event.target.value,
                    }));
                    setState("unsaved");
                  }}
                />
              </label>
            ))}
            <label className="grid gap-2 text-sm font-medium">
              Notes{" "}
              <Textarea
                value={note}
                onChange={(event) => {
                  setNote(event.target.value);
                  setState("unsaved");
                }}
                maxLength={1500}
                placeholder="Optional feedback for this team"
              />
            </label>
          </CardContent>
        </Card>
      )}
      {error ? (
        <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <div className="sticky bottom-4 flex flex-wrap items-center gap-3 rounded-2xl border bg-background p-3 shadow-lg">
        <Button
          variant="outline"
          className="rounded-xl"
          disabled={!previous}
          nativeButton={!previous}
          render={
            previous ? (
              <Link
                href={`/evaluator/rounds/${previous.roundId}/teams/${previous.id}`}
              />
            ) : undefined
          }
        >
          <ArrowLeft aria-hidden="true" />
          Prev
        </Button>
        <p className="mr-auto text-sm font-medium">
          Total {total} / {maximum}{" "}
          <span className="ml-2 text-muted-foreground">
            {state === "unsaved"
              ? "Unsaved"
              : state === "retrying"
                ? "Retrying save..."
                : state === "saving"
                  ? "Saving..."
                  : state === "error"
                    ? "Save failed"
                    : "Saved"}
          </span>
        </p>
        <Button
          variant="outline"
          className="rounded-xl"
          disabled={
            !scores.length || state === "saving" || state === "retrying"
          }
          onClick={() => void save(team.evaluationStatus === "confirmed")}
        >
          <Save aria-hidden="true" />
          {team.evaluationStatus === "confirmed"
            ? "Save changes"
            : "Save draft"}
        </Button>
        <Button
          className="rounded-xl"
          disabled={
            !scores.length || state === "saving" || state === "retrying"
          }
          onClick={() => void save(true, true)}
        >
          <CheckCircle2 aria-hidden="true" />
          Submit &amp; Next
        </Button>
        <Button
          variant="outline"
          className="rounded-xl"
          disabled={!next}
          nativeButton={!next}
          render={
            next ? (
              <Link
                href={`/evaluator/rounds/${next.roundId}/teams/${next.id}`}
              />
            ) : undefined
          }
        >
          Next
          <ArrowRight aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
