import type { TeamSession } from "./types";
export type { TeamSession };

const SESSION_KEY = "devhack_team_session";
const SESSION_CHANGE_EVENT = "team:session-change";

let cachedRawSession: string | null = null;
let cachedParsedSession: TeamSession | null = null;

function notifySessionChange(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SESSION_CHANGE_EVENT));
  }
}

export function saveTeamSession(session: TeamSession): void {
  if (typeof window === "undefined") return;

  const raw = JSON.stringify(session);
  sessionStorage.setItem(SESSION_KEY, raw);
  cachedRawSession = raw;
  cachedParsedSession = session;
  notifySessionChange();
}

export function getTeamSession(): TeamSession | null {
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
    cachedParsedSession = JSON.parse(stored) as TeamSession;
    return cachedParsedSession;
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    cachedRawSession = null;
    cachedParsedSession = null;
    return null;
  }
}

export function updateTeamTokens(
  accessToken: string,
  refreshToken: string,
): void {
  const current = getTeamSession();
  if (!current) return;
  saveTeamSession({
    ...current,
    accessToken,
    refreshToken,
  });
}

export function updateTeamMustChangePassword(mustChangePassword: boolean): void {
  const current = getTeamSession();
  if (!current) return;
  saveTeamSession({
    ...current,
    mustChangePassword,
  });
}

export function clearTeamSession(): void {
  if (typeof window === "undefined") return;

  sessionStorage.removeItem(SESSION_KEY);
  cachedRawSession = null;
  cachedParsedSession = null;
  notifySessionChange();
}

export function subscribeToTeamSession(onChange: () => void): () => void {
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

