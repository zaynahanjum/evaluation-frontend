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

import { getActiveRounds, getTeamsForRound } from "./api";
import type { ActiveRound, AssignedTeam, EvaluationStatus } from "./types";

type WorkspaceValue = {
  rounds: ActiveRound[];
  teams: AssignedTeam[];
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
    round.teams.map((team) => ({
      ...team,
      roundId: round.roundId,
      roundName: round.roundName,
      roundNumber: round.roundNumber,
      panelId: round.panelId,
      panelName: round.panelName,
      criteria: [],
      submission: null,
      evaluationStatus: "not-started" as const,
      evaluation: null,
    })),
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWorkspace = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const session = getEvaluatorSession();
    if (!session) {
      setIsLoading(false);
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

        return detail
          ? {
              ...team,
              evaluationStatus: detail.evaluationStatus,
              evaluation: detail.evaluation,
              criteria:
                teamResult?.round.criteria ??
                detail.evaluation?.scores.map((score) => score.criterion) ??
                [],
              submission: detail.team.submission,
            }
          : team;
      });

      setRounds(activeRounds);
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

  const value = useMemo(
    () => ({
      rounds,
      teams,
      isLoading,
      error,
      refresh: () => {
        setIsLoading(true);
        void loadWorkspace();
      },
    }),
    [error, isLoading, loadWorkspace, rounds, teams],
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
