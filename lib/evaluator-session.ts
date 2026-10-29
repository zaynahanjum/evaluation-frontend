export type EvaluatorRole = "MENTOR" | "JUDGE";

export type EvaluatorSession = {
  accessToken: string;
  refreshToken: string;
  role: EvaluatorRole;
  username: string;
};

const SESSION_KEY = "hackathon-evaluation.evaluator-session";
const SESSION_CHANGE_EVENT = "hackathon-evaluation:evaluator-session";

let cachedStoredSession: string | null | undefined;
let cachedSession: EvaluatorSession | null = null;

function updateCachedSession(storedSession: string | null) {
  if (storedSession === cachedStoredSession) {
    return cachedSession;
  }

  cachedStoredSession = storedSession;

  if (!storedSession) {
    cachedSession = null;
    return cachedSession;
  }

  try {
    cachedSession = JSON.parse(storedSession) as EvaluatorSession;
  } catch {
    window.localStorage.removeItem(SESSION_KEY);
    cachedStoredSession = null;
    cachedSession = null;
  }

  return cachedSession;
}

function notifySessionChange() {
  window.dispatchEvent(new Event(SESSION_CHANGE_EVENT));
}

export function saveEvaluatorSession(session: EvaluatorSession) {
  if (typeof window === "undefined") return;
  const storedSession = JSON.stringify(session);
  window.localStorage.setItem(SESSION_KEY, storedSession);
  updateCachedSession(storedSession);
  notifySessionChange();
}

export function getEvaluatorSession(): EvaluatorSession | null {
  if (typeof window === "undefined") return null;
  return updateCachedSession(window.localStorage.getItem(SESSION_KEY));
}

export function clearEvaluatorSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
  updateCachedSession(null);
  notifySessionChange();
}

export function subscribeToEvaluatorSession(onChange: () => void) {
  if (typeof window === "undefined") return () => {};

  function handleStorageChange(event: StorageEvent) {
    if (event.key === SESSION_KEY) {
      onChange();
    }
  }

  window.addEventListener(SESSION_CHANGE_EVENT, onChange);
  window.addEventListener("storage", handleStorageChange);

  return () => {
    window.removeEventListener(SESSION_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", handleStorageChange);
  };
}

export function getServerEvaluatorSession() {
  return null;
}

export const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
