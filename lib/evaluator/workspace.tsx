"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import {
  clearEvaluatorSession,
  getEvaluatorSession,
} from "@/lib/evaluator-session";
import { useRealtimeEvents } from "@/hooks/use-realtime-events";

import { getActiveRounds, getTeamsForRound } from "./api";
import type {
  ActiveRound,
  AssignedTeam,
  EvaluationStatus,
  PreviousRoundMeta,
} from "./types";

type WorkspaceValue = {
  rounds: ActiveRound[];
  teams: AssignedTeam[];
  previousRounds: PreviousRoundMeta[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
};

const EvaluatorWorkspaceContext = createContext<WorkspaceValue | null>(null);

const statusOrder: Record<EvaluationStatus, number> = {
  "not-started": 0,
  "in-progress": 1,
  confirmed: 2,
};

function asAssignedTeams(rounds: ActiveRound[]): AssignedTeam[] {
  return rounds.flatMap((round) =>
    round.teams.map((team) => {
      const submission =
        team.submission ??
        (team.problemStatement !== undefined || team.solution !== undefined
          ? {
              problemStatement: team.problemStatement ?? null,
              solution: team.solution ?? null,
            }
          : null);
      return {
        id: team.id,
        name: team.name,
        roundId: round.roundId,
        roundName: round.roundName,
        roundNumber: round.roundNumber,
        panelId: round.panelId,
        panelName: round.panelName,
        criteria: [],
        submission,
        evaluationStatus: "not-started" as const,
        evaluation: null,
      };
    }),
  );
}

export function EvaluatorWorkspaceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [rounds, setRounds] = useState<ActiveRound[]>([]);
  const [teams, setTeams] = useState<AssignedTeam[]>([]);
  const [previousRounds, setPreviousRounds] = useState<PreviousRoundMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWorkspace = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);

    const session = getEvaluatorSession();
    if (!session) {
      if (!silent) setIsLoading(false);
      router.replace("/login");
      return;
    }

    try {
      const activeRounds = await getActiveRounds(session.accessToken);
      const baseTeams = asAssignedTeams(activeRounds);
      const uniqueRoundIds = [
        ...new Set(activeRounds.map((round) => round.roundId)),
      ];
      const teamResults = await Promise.all(
        uniqueRoundIds.map(async (roundId) => {
          return getTeamsForRound(roundId, session.accessToken);
        }),
      );

      const teamsByPanel = new Map(
        teamResults.map((result) => [
          result.panel.id,
          new Map(result.teams.map((item) => [item.team.id, item])),
        ]),
      );
      const hasUnsynchronizedAssignments = baseTeams.some(
        (team) => !teamsByPanel.get(team.panelId)?.has(team.id),
      );
      if (hasUnsynchronizedAssignments) {
        throw new Error(
          "Some assigned teams could not be synchronized. Refresh and try again.",
        );
      }

      const updatedTeams = baseTeams.map((team) => {
        const teamResult = teamResults.find(
          (result) => result.panel.id === team.panelId,
        );
        const detail = teamsByPanel.get(team.panelId)?.get(team.id);

        const submission =
          detail?.team.submission ??
          (detail?.team.problemStatement !== undefined ||
          detail?.team.solution !== undefined
            ? {
                problemStatement: detail?.team.problemStatement ?? null,
                solution: detail?.team.solution ?? null,
              }
            : team.submission);

        return detail
          ? {
              ...team,
              evaluationStatus: detail.evaluationStatus,
              evaluation: detail.evaluation,
              criteria:
                teamResult?.round.criteria ??
                detail.evaluation?.scores.map((score) => score.criterion) ??
                [],
              submission,
              previousRoundScores: detail.previousRoundScores ?? [],
            }
          : team;
      });

      const allPrevRounds = teamResults.flatMap((r) => r.previousRounds ?? []);
      const uniquePrevRounds = Array.from(
        new Map(allPrevRounds.map((r) => [r.id, r])).values(),
      ).sort((a, b) => a.roundNumber - b.roundNumber);

      setRounds(activeRounds);
      setPreviousRounds(uniquePrevRounds);
      setTeams(
        updatedTeams.sort(
          (a, b) =>
            statusOrder[a.evaluationStatus] - statusOrder[b.evaluationStatus],
        ),
      );
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "Your evaluator workspace could not be loaded.";
      if (/not authenticated|token|unauthorized/i.test(message)) {
        clearEvaluatorSession();
        router.replace("/login");
        return;
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadWorkspace();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadWorkspace]);

  // Real-time auto-refresh when admin changes rounds, panels, criteria, or when scores update
  useRealtimeEvents(getEvaluatorSession()?.accessToken, {
    ROUND_STATUS_CHANGED: () => void loadWorkspace(true),
    ROUND_CHANGED: () => void loadWorkspace(true),
    PANELS_CHANGED: () => void loadWorkspace(true),
    CRITERIA_CHANGED: () => void loadWorkspace(true),
    SCORES_UPDATED: () => void loadWorkspace(true),
    SUBMISSION_UPDATED: () => void loadWorkspace(true),
  });

  const value = useMemo(
    () => ({
      rounds,
      teams,
      previousRounds,
      isLoading,
      error,
      refresh: () => {
        setIsLoading(true);
        void loadWorkspace();
      },
    }),
    [error, isLoading, loadWorkspace, previousRounds, rounds, teams],
  );

  return (
    <EvaluatorWorkspaceContext.Provider value={value}>
      {children}
    </EvaluatorWorkspaceContext.Provider>
  );
}

export function useEvaluatorWorkspace() {
  const workspace = useContext(EvaluatorWorkspaceContext);
  if (!workspace) {
    throw new Error(
      "useEvaluatorWorkspace must be used inside EvaluatorWorkspaceProvider.",
    );
  }
  return workspace;
}
