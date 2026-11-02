export type AdminSession = {
  accessToken: string;
  refreshToken: string;
  username: string;
  userId: string;
};

const SESSION_KEY = "admin_session";

export function saveAdminSession(session: AdminSession): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getAdminSession(): AdminSession | null {
  if (typeof window === "undefined") return null;

  const stored = sessionStorage.getItem(SESSION_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as AdminSession;
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function clearAdminSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SESSION_KEY);
}

export function updateAdminTokens(
  accessToken: string,
  refreshToken: string,
): void {
  const session = getAdminSession();
  if (!session) return;
  saveAdminSession({ ...session, accessToken, refreshToken });
}
