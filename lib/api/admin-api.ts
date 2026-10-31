import { apiRequest } from "@/lib/api/client";
import type {
  AdminSubmissionRecord,
  ApiMessage,
  ApiSuccess,
  CreateCriteriaPayload,
  CreateRoundPayload,
  CreateTeamPayload,
  CreateTimelinePayload,
  CreateUserPayload,
  Criterion,
  DashboardData,
  EvaluationRecord,
  Panel,
  Participant,
  RoundResultsPayload,
  RoundDetail,
  RoundSummary,
  ScoreItem,
  StaffUser,
  SubmissionsPayload,
  TeamDetail,
  TeamSummary,
  TimelineEvent,
  UpdateCriteriaPayload,
  UpdateParticipantPayload,
  UpdateTeamPayload,
  UpdateTimelinePayload,
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

export async function getRound(roundId: string) {
  const payload = await apiRequest<ApiSuccess<RoundDetail>>(`/admin/rounds/${roundId}`);
  return payload.data;
}

export async function createRound(body: CreateRoundPayload) {
  const payload = await apiRequest<ApiSuccess<RoundSummary>>("/admin/rounds", {
    method: "POST",
    body,
  });
  return payload.data;
}

export async function startRound(roundId: string) {
  const payload = await apiRequest<ApiSuccess<RoundSummary>>(
    `/admin/rounds/${roundId}/start`,
    { method: "PATCH" },
  );
  return payload.data;
}

export async function endRound(roundId: string) {
  const payload = await apiRequest<ApiSuccess<RoundSummary>>(
    `/admin/rounds/${roundId}/end`,
    { method: "PATCH" },
  );
  return payload.data;
}

export async function deleteRound(roundId: string) {
  await apiRequest<ApiMessage>(`/admin/rounds/${roundId}`, { method: "DELETE" });
}

export async function listCriteria(roundId: string) {
  const payload = await apiRequest<ApiSuccess<Criterion[]>>(
    `/admin/rounds/${roundId}/criteria`,
  );
  return payload.data;
}

export async function createCriterion(roundId: string, body: CreateCriteriaPayload) {
  const payload = await apiRequest<ApiSuccess<Criterion>>(
    `/admin/rounds/${roundId}/criteria`,
    { method: "POST", body },
  );
  return payload.data;
}
export const createCriteria = createCriterion;

export async function updateCriterion(criterionId: string, body: UpdateCriteriaPayload) {
  const payload = await apiRequest<ApiSuccess<Criterion>>(
    `/admin/criteria/${criterionId}`,
    { method: "PATCH", body },
  );
  return payload.data;
}
export const updateCriteria = updateCriterion;

export async function deleteCriterion(criterionId: string) {
  await apiRequest<ApiMessage>(`/admin/criteria/${criterionId}`, {
    method: "DELETE",
  });
}
export const deleteCriteria = deleteCriterion;

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
  await apiRequest<ApiMessage>(`/admin/panels/${panelId}/members`, {
    method: "POST",
    body: { userId },
  });
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

export async function createTeam(body: CreateTeamPayload) {
  const payload = await apiRequest<ApiSuccess<TeamDetail>>("/admin/teams", {
    method: "POST",
    body,
  });
  return payload.data;
}

export async function getTeam(teamId: string) {
  const payload = await apiRequest<ApiSuccess<TeamDetail>>(`/admin/teams/${teamId}`);
  return payload.data;
}

export async function updateTeam(teamId: string, body: UpdateTeamPayload) {
  const payload = await apiRequest<
    ApiSuccess<{ id: string; name: string; username: string; isActive: boolean }>
  >(`/admin/teams/${teamId}`, {
    method: "PATCH",
    body,
  });
  return payload.data;
}

export async function deleteTeam(teamId: string) {
  const payload = await apiRequest<ApiMessage>(`/admin/teams/${teamId}`, {
    method: "DELETE",
  });
  return payload;
}

export async function updateParticipant(
  teamId: string,
  participantId: string,
  body: UpdateParticipantPayload,
) {
  const payload = await apiRequest<ApiSuccess<Participant>>(
    `/admin/teams/${teamId}/participants/${participantId}`,
    {
      method: "PATCH",
      body,
    },
  );
  return payload.data;
}

export async function setTop10Teams(teamIds: string[]) {
  const payload = await apiRequest<ApiMessage>("/admin/teams/top10", {
    method: "POST",
    body: { teamIds },
  });
  return payload;
}

export async function listRoundScores(roundId: string) {
  const payload = await apiRequest<ApiSuccess<EvaluationRecord[]>>(
    `/admin/rounds/${roundId}/scores`,
  );
  return payload.data;
}

export async function updateScore(scoreId: string, value: number) {
  const payload = await apiRequest<ApiSuccess<ScoreItem>>(
    `/admin/scores/${scoreId}`,
    { method: "PATCH", body: { value } },
  );
  return payload.data;
}

export async function updateEvaluationNote(evaluationId: string, note: string) {
  await apiRequest<ApiMessage>(`/admin/evaluations/${evaluationId}/note`, {
    method: "PATCH",
    body: { note },
  });
}

export async function getRoundResults(roundId: string) {
  const payload = await apiRequest<ApiSuccess<RoundResultsPayload>>(
    `/admin/rounds/${roundId}/results`,
  );
  return payload.data;
}

export async function listTimeline() {
  const payload = await apiRequest<ApiSuccess<TimelineEvent[]>>("/admin/timeline");
  return payload.data;
}

export async function createTimeline(body: CreateTimelinePayload) {
  const payload = await apiRequest<ApiSuccess<TimelineEvent>>("/admin/timeline", {
    method: "POST",
    body,
  });
  return payload.data;
}

export async function updateTimeline(id: string, body: UpdateTimelinePayload) {
  const payload = await apiRequest<ApiSuccess<TimelineEvent>>(
    `/admin/timeline/${id}`,
    { method: "PATCH", body },
  );
  return payload.data;
}

export async function deleteTimeline(id: string) {
  await apiRequest<ApiMessage>(`/admin/timeline/${id}`, { method: "DELETE" });
}

export async function listSubmissions() {
  const payload = await apiRequest<ApiSuccess<SubmissionsPayload>>("/admin/submissions");
  return payload.data;
}

export async function getTeamSubmission(teamId: string) {
  const payload = await apiRequest<ApiSuccess<AdminSubmissionRecord>>(
    `/admin/submissions/${teamId}`,
  );
  return payload.data;
}

export async function setSubmissionLock(locked: boolean) {
  const payload = await apiRequest<ApiMessage>("/admin/submissions/lock", {
    method: "PATCH",
    body: { locked },
  });
  return payload;
}
