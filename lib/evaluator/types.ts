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
  teams: {
    id: string;
    name: string;
    problemStatement?: string | null;
    solution?: string | null;
    submission?: TeamSubmission | null;
  }[];
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
  previousRoundScores?: PreviousRoundScoreSummary[];
};

export type PreviousRoundCriterionScore = {
  criterionId: string;
  criterionName: string;
  maxScore: number;
  avgScore: number;
};

export type PreviousRoundNote = {
  evaluatorId: string;
  evaluatorName: string;
  note: string;
};

export type PreviousRoundScoreSummary = {
  roundId: string;
  roundName: string;
  roundNumber: number;
  roundType: string;
  totalAvgScore: number | null;
  maxPossibleScore: number;
  criteria: PreviousRoundCriterionScore[];
  notes: PreviousRoundNote[];
  evaluatorCount: number;
};

export type PreviousRoundMeta = {
  id: string;
  name: string;
  roundNumber: number;
  type: string;
};

export type TeamsForRoundResponse = {
  round: {
    id: string;
    name: string;
    status: string;
    criteria: EvaluationCriterion[];
  };
  panel: { id: string; name: string };
  previousRounds?: PreviousRoundMeta[];
  teams: {
    team: {
      id: string;
      name: string;
      problemStatement?: string | null;
      solution?: string | null;
      submission?: TeamSubmission | null;
    };
    evaluationStatus: EvaluationStatus;
    evaluation: Evaluation | null;
    previousRoundScores?: PreviousRoundScoreSummary[];
  }[];
};
