export { apiBaseUrl } from "@/lib/config";

export type EvaluatorRole = "MENTOR" | "JUDGE";

export type EvaluatorSession = {
  accessToken: string;
  refreshToken: string;
  role: EvaluatorRole;
  username: string;
};

const SESSION_KEY = "evaluator_session";
const SESSION_CHANGE_EVENT = "evaluator:session-change";

let cachedRawSession: string | null = null;
let cachedParsedSession: EvaluatorSession | null = null;

function notifySessionChange(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SESSION_CHANGE_EVENT));
  }
}

export function saveEvaluatorSession(session: EvaluatorSession): void {
  if (typeof window === "undefined") return;

  const raw = JSON.stringify(session);
  sessionStorage.setItem(SESSION_KEY, raw);
  cachedRawSession = raw;
  cachedParsedSession = session;
  notifySessionChange();
}

export function getEvaluatorSession(): EvaluatorSession | null {
  if (typeof window === "undefined") return null;

  const stored = sessionStorage.getItem(SESSION_KEY);
  if (stored === cachedRawSession) {
    return cachedParsedSession;
  }

  cachedRawSession = stored;
  if (!stored) {
    cachedParsedSession = null;
    return null;
  }

  try {
    cachedParsedSession = JSON.parse(stored) as EvaluatorSession;
    return cachedParsedSession;
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    cachedRawSession = null;
    cachedParsedSession = null;
    return null;
  }
}

export function clearEvaluatorSession(): void {
  if (typeof window === "undefined") return;

  sessionStorage.removeItem(SESSION_KEY);
  cachedRawSession = null;
  cachedParsedSession = null;
  notifySessionChange();
}

export function subscribeToEvaluatorSession(onChange: () => void) {
  if (typeof window === "undefined") return () => {};

  function handleStorage(event: StorageEvent) {
    if (event.key === SESSION_KEY) {
      onChange();
    }
  }

  window.addEventListener("storage", handleStorage);
  window.addEventListener(SESSION_CHANGE_EVENT, onChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(SESSION_CHANGE_EVENT, onChange);
  };
}

export function getServerEvaluatorSession() {
  return null;
}
