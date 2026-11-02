import { apiBaseUrl } from "@/lib/evaluator-session";

import type { ActiveRound, TeamsForRoundResponse } from "./types";

type ApiResponse<T> = { success: boolean; data?: T; message?: string };

async function get<T>(path: string, accessToken: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.success || payload.data === undefined) {
    throw new Error(
      payload.message ?? "The evaluation data could not be loaded.",
    );
  }

  return payload.data;
}

export function getActiveRounds(accessToken: string) {
  return get<ActiveRound[]>("/evaluator/rounds", accessToken);
}

export function getTeamsForRound(roundId: string, accessToken: string) {
  return get<TeamsForRoundResponse>(
    `/evaluator/rounds/${roundId}/teams`,
    accessToken,
  );
}

async function saveScoresOnce(
  roundId: string,
  teamId: string,
  accessToken: string,
  body: {
    scores: { criterionId: string; value: number }[];
    note?: string;
    confirm: boolean;
  },
) {
  const response = await fetch(
    `${apiBaseUrl}/evaluator/rounds/${roundId}/teams/${teamId}/scores`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
  const payload = (await response.json()) as ApiResponse<unknown>;
  if (response.status === 429 || response.status >= 500) {
    throw new Error(
      `HTTP_RETRYABLE:${payload.message ?? "The server could not save your scores."}`,
    );
  }
  if (!response.ok || !payload.success) {
    throw new Error(payload.message ?? "Your scores could not be saved.");
  }
}

export async function saveScores(
  roundId: string,
  teamId: string,
  accessToken: string,
  body: {
    scores: { criterionId: string; value: number }[];
    note?: string;
    confirm: boolean;
  },
  onRetry?: (attempt: number) => void,
) {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await saveScoresOnce(roundId, teamId, accessToken, body);
      return;
    } catch (error) {
      if (!isRetryableSaveError(error)) {
        throw error;
      }
      if (attempt === maxAttempts) {
        throw new Error(
          error instanceof Error
            ? error.message.replace("HTTP_RETRYABLE:", "")
            : "Your scores could not be saved after retrying.",
        );
      }

      onRetry?.(attempt);
      await new Promise((resolve) =>
        setTimeout(resolve, 500 * 2 ** (attempt - 1)),
      );
    }
  }

  throw new Error("Your scores could not be saved after retrying.");
}

function isRetryableSaveError(error: unknown) {
  return (
    error instanceof TypeError ||
    (error instanceof Error && error.message.startsWith("HTTP_RETRYABLE:"))
  );
}
