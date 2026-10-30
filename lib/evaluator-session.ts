export { apiBaseUrl } from "@/lib/config";

export type EvaluatorRole = "MENTOR" | "JUDGE";

export type EvaluatorSession = {
  accessToken: string;
  refreshToken: string;
  role: EvaluatorRole;
  username: string;
};

const SESSION_KEY = "evaluator_session";

export function saveEvaluatorSession(session: EvaluatorSession): void {
  if (typeof window === "undefined") return;

  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getEvaluatorSession(): EvaluatorSession | null {
  if (typeof window === "undefined") return null;

  const stored = sessionStorage.getItem(SESSION_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as EvaluatorSession;
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function clearEvaluatorSession(): void {
  if (typeof window === "undefined") return;

  sessionStorage.removeItem(SESSION_KEY);
}
