import { apiBaseUrl } from "@/lib/config";
import {
  clearTeamSession,
  getTeamSession,
  saveTeamSession,
  updateTeamMustChangePassword,
  updateTeamTokens,
} from "./session";
import type {
  TeamDormInfo,
  TeamProfile,
  TeamSubmission,
  TeamSubmissionResponse,
  TeamTimelineEvent,
} from "./types";

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

type LoginResponseData = {
  accessToken: string;
  refreshToken: string;
  role: string;
  type: string;
  team?: {
    id: string;
    username: string;
    name: string;
    mustChangePassword: boolean;
  };
};

async function readPayload<T>(response: Response): Promise<ApiResponse<T>> {
  const text = await response.text();
  if (!text) {
    return { success: response.ok };
  }
  try {
    return JSON.parse(text) as ApiResponse<T>;
  } catch {
    return {
      success: false,
      message: `Failed to parse response (${response.status})`,
    };
  }
}

async function tryRefreshTeamToken(): Promise<boolean> {
  const session = getTeamSession();
  if (!session?.refreshToken) return false;

  try {
    const res = await fetch(`${apiBaseUrl}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    });

    const payload = (await res.json()) as {
      success: boolean;
      data?: { accessToken?: string; refreshToken?: string };
    };

    if (!res.ok || !payload.success || !payload.data?.accessToken) {
      clearTeamSession();
      return false;
    }

    updateTeamTokens(
      payload.data.accessToken,
      payload.data.refreshToken ?? session.refreshToken,
    );
    return true;
  } catch {
    clearTeamSession();
    return false;
  }
}

async function request<T>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    body?: unknown;
    auth?: boolean;
    skipRefresh?: boolean;
  } = {},
): Promise<T> {
  const { method = "GET", body, auth = true, skipRefresh = false } = options;
  const headers: Record<string, string> = {};

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (auth) {
    const session = getTeamSession();
    if (!session?.accessToken) {
      throw new Error("You are not signed in as a team.");
    }
    headers.Authorization = `Bearer ${session.accessToken}`;
  }

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error(
      "The server is unreachable. Please verify your connection.",
    );
  }

  if (response.status === 401 && auth && !skipRefresh) {
    const refreshed = await tryRefreshTeamToken();
    if (refreshed) {
      return request<T>(path, { ...options, skipRefresh: true });
    }
    clearTeamSession();
    if (typeof window !== "undefined") {
      window.location.replace("/team/login");
    }
    throw new Error("Your session expired. Please sign in again.");
  }

  const payload = await readPayload<T>(response);

  if (!response.ok || !payload.success) {
    throw new Error(payload.message ?? `Request failed with status ${response.status}`);
  }

  return (payload.data !== undefined ? payload.data : (payload as unknown)) as T;
}

export const teamApi = {
  async login(username: string, password: string): Promise<LoginResponseData> {
    const payload = await request<LoginResponseData>("/auth/login", {
      method: "POST",
      body: { username, password },
      auth: false,
    });

    if (payload.role !== "TEAM" || !payload.team) {
      throw new Error(
        "Access denied. This portal is only accessible to participating teams.",
      );
    }

    saveTeamSession({
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
      teamId: payload.team.id,
      username: payload.team.username,
      name: payload.team.name,
      mustChangePassword: Boolean(payload.team.mustChangePassword),
    });

    return payload;
  },

  async logout(): Promise<void> {
    const session = getTeamSession();
    if (session?.refreshToken) {
      try {
        await request("/auth/logout", {
          method: "POST",
          body: { refreshToken: session.refreshToken },
          auth: false,
          skipRefresh: true,
        });
      } catch {
        // ignore logout network errors
      }
    }
    clearTeamSession();
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<string> {
    const res = await request<{ message?: string }>(
      "/team/auth/change-password",
      {
        method: "POST",
        body: { currentPassword, newPassword },
      },
    );
    updateTeamMustChangePassword(false);
    return res.message ?? "Password changed successfully.";
  },

  async getProfile(): Promise<TeamProfile> {
    return request<TeamProfile>("/team/me");
  },

  async getDorms(): Promise<TeamDormInfo> {
    return request<TeamDormInfo>("/team/dorms");
  },

  async getSubmission(): Promise<TeamSubmissionResponse> {
    return request<TeamSubmissionResponse>("/team/submission");
  },

  async upsertProblemStatement(payload: {
    problemStatement: string;
    solution: string;
  }): Promise<TeamSubmission> {
    return request<TeamSubmission>("/team/submission", {
      method: "POST",
      body: payload,
    });
  },

  async submitFinalDeliverables(payload: {
    driveLink: string;
    githubRepoLink: string;
    deploymentLink?: string;
  }): Promise<TeamSubmission> {
    return request<TeamSubmission>("/team/submission/final", {
      method: "POST",
      body: payload,
    });
  },

  async getTimeline(): Promise<TeamTimelineEvent[]> {
    return request<TeamTimelineEvent[]>("/team/timeline");
  },
};

