export type EvaluationStatus = "not-started" | "in-progress" | "confirmed";

export type CriterionScore = {
  id: string;
  value: number;
  criterionId: string;
  criterion: {
    id: string;
    name: string;
    description: string | null;
    maxScore: number;
  };
};

export type EvaluationCriterion = {
  id: string;
  name: string;
  description: string | null;
  maxScore: number;
};

export type TeamSubmission = {
  problemStatement: string | null;
  solution: string | null;
};

export type Evaluation = {
  id: string;
  note: string | null;
  isConfirmed: boolean;
  scores: CriterionScore[];
};

export type ActiveRound = {
  roundId: string;
  roundName: string;
  roundType: string;
  roundNumber: number;
  panelId: string;
  panelName: string;
  teams: { id: string; name: string }[];
};

export type AssignedTeam = {
  id: string;
  name: string;
  roundId: string;
  roundName: string;
  roundNumber: number;
  panelId: string;
  panelName: string;
  criteria: EvaluationCriterion[];
  submission: TeamSubmission | null;
  evaluationStatus: EvaluationStatus;
  evaluation: Evaluation | null;
};

export type TeamsForRoundResponse = {
  round: {
    id: string;
    name: string;
    status: string;
    criteria: EvaluationCriterion[];
  };
  panel: { id: string; name: string };
  teams: {
    team: { id: string; name: string; submission: TeamSubmission | null };
    evaluationStatus: EvaluationStatus;
    evaluation: Evaluation | null;
  }[];
};
