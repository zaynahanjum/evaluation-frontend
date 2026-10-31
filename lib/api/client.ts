import { apiBaseUrl } from "@/lib/config";
import {
  clearAdminSession,
  getAdminSession,
  updateAdminTokens,
} from "@/lib/admin-session";
import { ApiError } from "@/lib/api/errors";
import type { ApiFailure } from "@/lib/api/types";

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;
  skipRefresh?: boolean;
};

function messageFromPayload(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object" && "message" in payload) {
    const message = (payload as ApiFailure).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

async function readPayload(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

async function tryRefreshAccessToken(): Promise<boolean> {
  const session = getAdminSession();
  if (!session?.refreshToken) return false;

  const response = await fetch(`${apiBaseUrl}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: session.refreshToken }),
  });

  const payload = await readPayload(response);
  if (!response.ok) {
    clearAdminSession();
    return false;
  }

  const data = (payload as { data?: { accessToken?: string; refreshToken?: string } })
    ?.data;
  if (!data?.accessToken || !data.refreshToken) {
    clearAdminSession();
    return false;
  }

  updateAdminTokens(data.accessToken, data.refreshToken);
  return true;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, auth = true, skipRefresh = false } = options;
  const headers: Record<string, string> = {};

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (auth) {
    const session = getAdminSession();
    if (!session?.accessToken) {
      throw new ApiError(401, "You are not signed in.");
    }
    headers.Authorization = `Bearer ${session.accessToken}`;
  }

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      0,
      "The evaluation server is unavailable. Confirm it is running and try again.",
    );
  }

  if (response.status === 401 && auth && !skipRefresh) {
    const refreshed = await tryRefreshAccessToken();
    if (refreshed) {
      return apiRequest<T>(path, { ...options, skipRefresh: true });
    }
    if (typeof window !== "undefined") {
      window.location.replace("/login");
    }
    throw new ApiError(401, "Your session expired. Please sign in again.");
  }

  const payload = await readPayload(response);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      messageFromPayload(payload, `Request failed (${response.status}).`),
    );
  }

  return payload as T;
}

export async function loginRequest(username: string, password: string) {
  return apiRequest<{
    success: boolean;
    data: {
      accessToken: string;
      refreshToken: string;
      role: "ADMIN" | "MENTOR" | "JUDGE" | "TEAM";
      user?: { id: string; username: string; role: string; mustChangePassword: boolean };
      team?: { username: string };
    };
  }>("/auth/login", {
    method: "POST",
    body: { username, password },
    auth: false,
  });
}

export async function logoutRequest(refreshToken: string): Promise<void> {
  try {
    await apiRequest("/auth/logout", {
      method: "POST",
      body: { refreshToken },
      auth: false,
      skipRefresh: true,
    });
  } catch {
    // Local session is still cleared by the caller.
  }
}
