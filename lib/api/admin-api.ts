import { apiRequest } from "@/lib/api/client";
import type {
  ApiMessage,
  ApiSuccess,
  CreateCriteriaPayload,
  CreateRoundPayload,
  CreateUserPayload,
  Criterion,
  DashboardData,
  EvaluationRecord,
  Panel,
  RoundResultsPayload,
  RoundSummary,
  ScoreItem,
  StaffUser,
  TeamSummary,
  UpdateCriteriaPayload,
  UpdateUserPayload,
} from "@/lib/api/types";

export async function getDashboard() {
  const payload = await apiRequest<ApiSuccess<DashboardData>>("/admin/dashboard");
  return payload.data;
}

export async function listUsers(role?: "MENTOR" | "JUDGE") {
  const query = role ? `?role=${role}` : "";
  const payload = await apiRequest<ApiSuccess<StaffUser[]>>(`/admin/users${query}`);
  return payload.data;
}

export async function createUser(body: CreateUserPayload) {
  const payload = await apiRequest<ApiSuccess<StaffUser>>("/admin/users", {
    method: "POST",
    body,
  });
  return payload.data;
}

export async function updateUser(id: string, body: UpdateUserPayload) {
  const payload = await apiRequest<ApiSuccess<StaffUser>>(`/admin/users/${id}`, {
    method: "PATCH",
    body,
  });
  return payload.data;
}

export async function deleteUser(id: string) {
  await apiRequest<ApiMessage>(`/admin/users/${id}`, { method: "DELETE" });
}

export async function listRounds() {
  const payload = await apiRequest<ApiSuccess<RoundSummary[]>>("/admin/rounds");
  return payload.data;
}

export async function createRound(body: CreateRoundPayload) {
  const payload = await apiRequest<ApiSuccess<RoundSummary>>("/admin/rounds", {
    method: "POST",
    body,
  });
  return payload.data;
}

export async function startRound(id: string) {
  const payload = await apiRequest<ApiSuccess<RoundSummary>>(
    `/admin/rounds/${id}/start`,
    { method: "PATCH" },
  );
  return payload.data;
}

export async function endRound(id: string) {
  const payload = await apiRequest<ApiSuccess<RoundSummary>>(
    `/admin/rounds/${id}/end`,
    { method: "PATCH" },
  );
  return payload.data;
}

export async function deleteRound(id: string) {
  await apiRequest<ApiMessage>(`/admin/rounds/${id}`, { method: "DELETE" });
}

export async function listCriteria(roundId: string) {
  const payload = await apiRequest<ApiSuccess<Criterion[]>>(
    `/admin/rounds/${roundId}/criteria`,
  );
  return payload.data;
}

export async function createCriteria(roundId: string, body: CreateCriteriaPayload) {
  const payload = await apiRequest<ApiSuccess<Criterion>>(
    `/admin/rounds/${roundId}/criteria`,
    { method: "POST", body },
  );
  return payload.data;
}

export async function updateCriteria(id: string, body: UpdateCriteriaPayload) {
  const payload = await apiRequest<ApiSuccess<Criterion>>(`/admin/criteria/${id}`, {
    method: "PATCH",
    body,
  });
  return payload.data;
}

export async function deleteCriteria(id: string) {
  await apiRequest<ApiMessage>(`/admin/criteria/${id}`, { method: "DELETE" });
}

export async function listPanels(roundId: string) {
  const payload = await apiRequest<ApiSuccess<Panel[]>>(
    `/admin/rounds/${roundId}/panels`,
  );
  return payload.data;
}

export async function createPanel(roundId: string, name: string) {
  const payload = await apiRequest<ApiSuccess<Panel>>(
    `/admin/rounds/${roundId}/panels`,
    { method: "POST", body: { name } },
  );
  return payload.data;
}

export async function deletePanel(panelId: string) {
  await apiRequest<ApiMessage>(`/admin/panels/${panelId}`, { method: "DELETE" });
}

export async function addPanelMember(panelId: string, userId: string) {
  const payload = await apiRequest<ApiSuccess<Panel["members"][number]>>(
    `/admin/panels/${panelId}/members`,
    { method: "POST", body: { userId } },
  );
  return payload.data;
}

export async function removePanelMember(panelId: string, userId: string) {
  await apiRequest<ApiMessage>(`/admin/panels/${panelId}/members/${userId}`, {
    method: "DELETE",
  });
}

export async function addPanelTeams(panelId: string, teamIds: string[]) {
  await apiRequest<ApiMessage>(`/admin/panels/${panelId}/teams`, {
    method: "POST",
    body: { teamIds },
  });
}

export async function removePanelTeam(panelId: string, teamId: string) {
  await apiRequest<ApiMessage>(`/admin/panels/${panelId}/teams/${teamId}`, {
    method: "DELETE",
  });
}

export async function listTeams() {
  const payload = await apiRequest<ApiSuccess<TeamSummary[]>>("/admin/teams");
  return payload.data;
}

export async function listRoundScores(roundId: string) {
  const payload = await apiRequest<ApiSuccess<EvaluationRecord[]>>(
    `/admin/rounds/${roundId}/scores`,
  );
  return payload.data;
}

export async function updateScore(scoreId: string, value: number) {
  const payload = await apiRequest<ApiSuccess<ScoreItem>>(`/admin/scores/${scoreId}`, {
    method: "PATCH",
    body: { value },
  });
  return payload.data;
}

export async function updateEvaluationNote(evaluationId: string, note: string) {
  const payload = await apiRequest<ApiSuccess<EvaluationRecord>>(
    `/admin/evaluations/${evaluationId}/note`,
    { method: "PATCH", body: { note } },
  );
  return payload.data;
}

export async function getRoundResults(roundId: string) {
  const payload = await apiRequest<ApiSuccess<RoundResultsPayload>>(
    `/admin/rounds/${roundId}/results`,
  );
  return payload.data;
}
