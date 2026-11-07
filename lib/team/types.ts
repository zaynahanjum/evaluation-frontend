export type TeamParticipant = {
  id: string;
  name: string;
  hotelNo: string | null;
  roomName: string | null;
};

export type TeamProfile = {
  id: string;
  name: string;
  username: string;
  isTopTen: boolean;
  mustChangePassword: boolean;
  assignedRoom?: string | null;
  roomName?: string | null;
  participants: TeamParticipant[];
};

export type TeamDormInfo = {
  name: string;
  participants: TeamParticipant[];
};

export type TeamSubmission = {
  id: string;
  teamId?: string;
  problemStatement: string | null;
  solution: string | null;
  driveLink: string | null;
  deploymentLink: string | null;
  githubRepoLink: string | null;
  submittedAt: string;
  createdAt?: string;
  updatedAt: string;
  team?: {
    id: string;
    name: string;
  };
};

export type TeamSubmissionResponse = {
  submission: TeamSubmission | null;
  submissionLocked?: boolean;
  initialSubmissionLocked?: boolean;
  finalSubmissionLocked?: boolean;
};

export type TeamTimelineEvent = {
  id: string;
  title: string;
  description: string | null;
  scheduledAt: string;
};

export type TeamSession = {
  accessToken: string;
  refreshToken: string;
  teamId: string;
  username: string;
  name: string;
  mustChangePassword: boolean;
};

