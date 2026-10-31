export type UserRole = "ADMIN" | "MENTOR" | "JUDGE";
export type EvaluatorRole = "MENTOR" | "JUDGE";
export type RoundType = "MENTORING" | "JUDGING";
export type RoundStatus = "PENDING" | "ACTIVE" | "ENDED";

export type ApiSuccess<T> = {
  success: true;
  data: T;
  message?: string;
};

export type ApiMessage = {
  success: true;
  message: string;
};

export type ApiFailure = {
  success: false;
  message: string;
};

export type LoginResponseData = {
  accessToken: string;
  refreshToken: string;
  role: UserRole | "TEAM";
  type: "staff" | "team";
  user?: {
    id: string;
    username: string;
    role: UserRole;
    mustChangePassword: boolean;
  };
  team?: {
    id: string;
    username: string;
    name: string;
    mustChangePassword: boolean;
  };
};

export type StaffUser = {
  id: string;
  username: string;
  role: EvaluatorRole;
  isActive: boolean;
  mustChangePassword?: boolean;
  createdAt?: string;
  panelMembers?: Array<{
    panel: {
      id: string;
      name: string;
      round?: { id: string; name: string; type?: RoundType; status?: RoundStatus };
    };
  }>;
};

export type CreateUserPayload = {
  username: string;
  password: string;
  role: EvaluatorRole;
};

export type UpdateUserPayload = {
  username?: string;
  password?: string;
  isActive?: boolean;
  mustChangePassword?: boolean;
};

export type RoundSummary = {
  id: string;
  name: string;
  type: RoundType;
  roundNumber: number;
  status: RoundStatus;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    panels: number;
    criteria: number;
    evaluations: number;
  };
};

export type Criterion = {
  id: string;
  name: string;
  description: string | null;
  maxScore: number;
  roundId: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateRoundPayload = {
  name: string;
  type: RoundType;
  roundNumber: number;
};

export type CreateCriteriaPayload = {
  name: string;
  description?: string;
  maxScore: number;
};

export type UpdateCriteriaPayload = {
  name?: string;
  description?: string;
  maxScore?: number;
};

export type PanelUser = {
  id: string;
  username: string;
  role: EvaluatorRole;
};

export type PanelMember = {
  id: string;
  panelId: string;
  userId: string;
  user: PanelUser;
};

export type PanelTeamRef = {
  id: string;
  panelId: string;
  teamId: string;
  team: { id: string; name: string };
};

export type Panel = {
  id: string;
  name: string;
  roundId: string;
  createdAt: string;
  updatedAt: string;
  members: PanelMember[];
  teams: PanelTeamRef[];
};

export type TeamSummary = {
  id: string;
  name: string;
  username: string;
  isTopTen: boolean;
  isActive: boolean;
  createdAt: string;
};

export type ScoreItem = {
  id: string;
  value: number;
  criterionId: string;
  evaluationId: string;
  criterion: {
    id: string;
    name: string;
    maxScore: number;
  };
};

export type EvaluationRecord = {
  id: string;
  evaluatorId: string;
  teamId: string;
  roundId: string;
  note: string | null;
  isConfirmed: boolean;
  confirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
  evaluator: PanelUser;
  team: { id: string; name: string };
  scores: ScoreItem[];
};

export type CriterionResult = {
  criterionId: string;
  criterionName: string;
  maxScore: number;
  avgScore: number;
  confirmedCount: number;
};

export type TeamRoundResult = {
  teamId: string;
  teamName: string;
  isConfirmedByAll: boolean;
  confirmedEvaluators: number;
  totalEvaluators: number;
  criteriaResults: CriterionResult[];
  totalAvgScore: number;
};

export type RoundResultsPayload = {
  round: {
    id: string;
    name: string;
    type: RoundType;
    status: RoundStatus;
  };
  results: TeamRoundResult[];
};

export type DashboardData = {
  totalTeams: number;
  totalMentors: number;
  totalJudges: number;
  activeRounds: Array<{
    id: string;
    name: string;
    type: RoundType;
  }>;
  topTeams: Array<{ id: string; name: string }>;
  submissionLocked: boolean;
};
