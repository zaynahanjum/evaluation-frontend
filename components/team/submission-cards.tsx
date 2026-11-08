"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCode2,
  FolderGit2,
  HardDrive,
  Globe,
  LoaderCircle,
  Lock,
  Pencil,
  Send,
  Unlock,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { teamApi } from "@/lib/team/api";
import type { TeamSubmission, TeamSubmissionResponse } from "@/lib/team/types";

export function ProblemStatementCard({
  submissionData,
  onRefresh,
}: {
  submissionData: TeamSubmissionResponse | null;
  onRefresh: () => Promise<void>;
}) {
  const isLocked = Boolean(
    submissionData?.initialSubmissionLocked ?? submissionData?.submissionLocked,
  );
  const currentSubmission = submissionData?.submission;

  const [problemStatement, setProblemStatement] = useState("");
  const [solution, setSolution] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (currentSubmission) {
      setProblemStatement(currentSubmission.problemStatement ?? "");
      setSolution(currentSubmission.solution ?? "");
    }
  }, [currentSubmission]);

  const hasSubmitted = Boolean(
    currentSubmission?.problemStatement && currentSubmission?.solution,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      setError("Submissions are currently locked by the administrator.");
      return;
    }

    if (!problemStatement.trim() || !solution.trim()) {
      setError("Both problem statement and solution are required.");
      return;
    }

    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      await teamApi.upsertProblemStatement({
        problemStatement: problemStatement.trim(),
        solution: solution.trim(),
      });
      setSuccess("Problem statement and solution saved successfully!");
      setIsEditing(false);
      await onRefresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save submission. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileCode2 className="size-4" />
            </div>
            <CardTitle className="text-lg">
              Problem Statement & Proposed Solution
            </CardTitle>
          </div>
          <CardDescription>
            Initial hackathon ideation submission. Required for round 1 mentoring.
          </CardDescription>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isLocked ? (
            <Badge
              variant="secondary"
              className="bg-muted text-muted-foreground border-border gap-1"
            >
              <Lock className="size-3" />
              Window Closed
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1"
            >
              <Unlock className="size-3" />
              Window Open
            </Badge>
          )}

          {hasSubmitted ? (
            <Badge className="bg-primary/15 text-primary border-primary/30 gap-1">
              <CheckCircle2 className="size-3" />
              Submitted
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground gap-1">
              <Clock className="size-3" />
              Not Submitted
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error ? (
          <div className="rounded-xl bg-destructive/10 p-3 text-xs font-medium text-destructive flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        {success ? (
          <div className="rounded-xl bg-primary/10 p-3 text-xs font-medium text-primary flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{success}</span>
          </div>
        ) : null}

        {isLocked && !isEditing ? (
          <div className="rounded-xl bg-muted/40 border border-border/80 p-3.5 text-xs text-muted-foreground flex items-center gap-2.5">
            <Lock className="size-4 text-amber-500 shrink-0" />
            <span>
              The initial submission window is currently closed by the organizers.
              You can view your submission below.
            </span>
          </div>
        ) : null}

        {!isEditing && hasSubmitted ? (
          <div className="space-y-4 pt-1">
            <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2">
              <Label className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
                Problem Statement (PS)
              </Label>
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {currentSubmission?.problemStatement}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2">
              <Label className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
                Proposed Solution
              </Label>
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {currentSubmission?.solution}
              </p>
            </div>

            {currentSubmission?.updatedAt ? (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Clock className="size-3.5" />
                <span>
                  Last updated:{" "}
                  {new Date(currentSubmission.updatedAt).toLocaleString()}
                </span>
              </p>
            ) : null}
          </div>
        ) : (
          <form id="ps-form" onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="problem-statement">
                  Problem Statement <span className="text-destructive">*</span>
                </Label>
                <span className="text-[11px] text-muted-foreground">
                  {problemStatement.length} chars
                </span>
              </div>
              <Textarea
                id="problem-statement"
                placeholder="Describe the challenge or problem your team is addressing..."
                rows={4}
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
                disabled={isLocked || isSubmitting}
                required
                className="resize-y"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="solution">
                  Proposed Solution (max 250 words)<span className="text-destructive">*</span>
                </Label>
                <span className="text-[11px] text-muted-foreground">
                  {solution.length} chars
                </span>
              </div>
              <Textarea
                id="solution"
                placeholder="Describe your solution..."
                rows={4}
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
                disabled={isLocked || isSubmitting}
                required
                className="resize-y"
              />
            </div>
          </form>
        )}
      </CardContent>

      <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        {!isEditing && hasSubmitted ? (
          <Button
            size="sm"
            variant="outline"
            disabled={isLocked}
            onClick={() => setIsEditing(true)}
            className="rounded-xl"
          >
            <Pencil className="mr-1.5 size-3.5" />
            Edit Submission
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            {hasSubmitted ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  if (currentSubmission) {
                    setProblemStatement(currentSubmission.problemStatement ?? "");
                    setSolution(currentSubmission.solution ?? "");
                  }
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            ) : null}
            <Button
              form="ps-form"
              type="submit"
              size="sm"
              disabled={isLocked || isSubmitting}
              className="rounded-xl"
            >
              {isSubmitting ? (
                <LoaderCircle className="mr-1.5 size-3.5 animate-spin" />
              ) : (
                <Send className="mr-1.5 size-3.5" />
              )}
              {isSubmitting ? "Saving..." : hasSubmitted ? "Update Submission" : "Submit PS & Solution"}
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

export function FinalDeliverablesCard({
  submissionData,
  onRefresh,
}: {
  submissionData: TeamSubmissionResponse | null;
  onRefresh: () => Promise<void>;
}) {
  const isLocked = Boolean(
    submissionData?.finalSubmissionLocked ?? submissionData?.submissionLocked,
  );
  const currentSubmission = submissionData?.submission;

  const [driveLink, setDriveLink] = useState("");
  const [githubRepoLink, setGithubRepoLink] = useState("");
  const [deploymentLink, setDeploymentLink] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (currentSubmission) {
      setDriveLink(currentSubmission.driveLink ?? "");
      setGithubRepoLink(currentSubmission.githubRepoLink ?? "");
      setDeploymentLink(currentSubmission.deploymentLink ?? "");
    }
  }, [currentSubmission]);

  const hasFinalSubmitted = Boolean(
    currentSubmission?.driveLink && currentSubmission?.githubRepoLink,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      setError("Final submissions are currently locked by the administrator.");
      return;
    }

    setError(null);
    setSuccess(null);

    if (!driveLink.trim()) {
      setError("Google Drive link is required (must contain presentation PPT & video demo).");
      return;
    }

    if (!githubRepoLink.trim()) {
      setError("GitHub repository link is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await teamApi.submitFinalDeliverables({
        driveLink: driveLink.trim(),
        githubRepoLink: githubRepoLink.trim(),
        deploymentLink: deploymentLink.trim() || undefined,
      });
      setSuccess("Final project deliverables submitted successfully!");
      setIsEditing(false);
      await onRefresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to submit deliverables. If submissions are closed by admin, please contact organizers.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FolderGit2 className="size-4" />
            </div>
            <CardTitle className="text-lg">
              Final Project Deliverables (Drive, GitHub & Demo)
            </CardTitle>
          </div>
          <CardDescription>
            Required at the end of the hackathon for final evaluation. Drive folder must contain PPT and demo video.
          </CardDescription>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isLocked ? (
            <Badge
              variant="secondary"
              className="bg-muted text-muted-foreground border-border gap-1"
            >
              <Lock className="size-3" />
              Window Closed
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1"
            >
              <Unlock className="size-3" />
              Window Open
            </Badge>
          )}

          {hasFinalSubmitted ? (
            <Badge className="bg-primary/15 text-primary border-primary/30 gap-1">
              <CheckCircle2 className="size-3" />
              Final Deliverables Submitted
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground gap-1">
              <Clock className="size-3" />
              Pending Final Submission
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error ? (
          <div className="rounded-xl bg-destructive/10 p-3 text-xs font-medium text-destructive flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        {success ? (
          <div className="rounded-xl bg-primary/10 p-3 text-xs font-medium text-primary flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{success}</span>
          </div>
        ) : null}

        {isLocked && !isEditing ? (
          <div className="rounded-xl bg-muted/40 border border-border/80 p-3.5 text-xs text-muted-foreground flex items-center gap-2.5">
            <Lock className="size-4 text-amber-500 shrink-0" />
            <span>
              The final project submission window is currently closed by the organizers.
              {hasFinalSubmitted
                ? " You can view your submitted project links below."
                : " Deliverables cannot be submitted at this time."}
            </span>
          </div>
        ) : null}

        <div className="rounded-xl bg-primary/5 border border-primary/20 p-3.5 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground flex items-center gap-1.5">
            <HardDrive className="size-3.5 text-primary" />
            Submission Guidelines:
          </p>
          <ul className="list-disc pl-5 space-y-0.5">
            <li>
              <strong className="text-foreground">Drive Link:</strong> Must contain your pitch presentation (PPT) and demo video. Verify link access is set to <em>&quot;Anyone with the link can view&quot;</em>.
            </li>
            <li>
              <strong className="text-foreground">GitHub Link:</strong> Public repository containing your source code and documentation.
            </li>
            <li>
              <strong className="text-foreground">Deployment Link (Optional):</strong> Hosted demo URL.
            </li>
          </ul>
        </div>

        {!isEditing && hasFinalSubmitted ? (
          <div className="space-y-3 pt-1">
            {/* Drive Link Display */}
            <div className="rounded-xl border border-border bg-card p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                  <HardDrive className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">Google Drive Link (PPT + Video)</p>
                  <p className="text-sm font-mono truncate text-foreground">
                    {currentSubmission?.driveLink}
                  </p>
                </div>
              </div>
              {currentSubmission?.driveLink ? (
                <a
                  href={currentSubmission.driveLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-xl border border-input bg-background h-8 px-3 text-sm font-medium shadow-xs hover:bg-accent hover:text-accent-foreground gap-1.5 shrink-0"
                >
                  <span>Open</span>
                  <ExternalLink className="size-3" />
                </a>
              ) : null}
            </div>

            {/* GitHub Repo Display */}
            <div className="rounded-xl border border-border bg-card p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-neutral-500/10 text-foreground">
                  <FolderGit2 className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">GitHub Repository</p>
                  <p className="text-sm font-mono truncate text-foreground">
                    {currentSubmission?.githubRepoLink}
                  </p>
                </div>
              </div>
              {currentSubmission?.githubRepoLink ? (
                <a
                  href={currentSubmission.githubRepoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-xl border border-input bg-background h-8 px-3 text-sm font-medium shadow-xs hover:bg-accent hover:text-accent-foreground gap-1.5 shrink-0"
                >
                  <span>Open</span>
                  <ExternalLink className="size-3" />
                </a>
              ) : null}
            </div>

            {/* Deployment Link Display */}
            {currentSubmission?.deploymentLink ? (
              <div className="rounded-xl border border-border bg-card p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                    <Globe className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground">Deployment / Live Demo</p>
                    <p className="text-sm font-mono truncate text-foreground">
                      {currentSubmission.deploymentLink}
                    </p>
                  </div>
                </div>
                <a
                  href={currentSubmission.deploymentLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-xl border border-input bg-background h-8 px-3 text-sm font-medium shadow-xs hover:bg-accent hover:text-accent-foreground gap-1.5 shrink-0"
                >
                  <span>Open</span>
                  <ExternalLink className="size-3" />
                </a>
              </div>
            ) : null}
          </div>
        ) : (
          <form id="final-form" onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="drive-link" className="flex items-center gap-1.5">
                <HardDrive className="size-3.5 text-primary" />
                <span>Google Drive Folder Link (must contain ppt and video) <span className="text-destructive">*</span></span>
              </Label>
              <Input
                id="drive-link"
                type="url"
                placeholder="https://drive.google.com/drive/folders/..."
                value={driveLink}
                onChange={(e) => setDriveLink(e.target.value)}
                disabled={isLocked || isSubmitting}
                required
                className="font-mono text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="github-link" className="flex items-center gap-1.5">
                <FolderGit2 className="size-3.5 text-primary" />
                <span>GitHub Repository URL <span className="text-destructive">*</span></span>
              </Label>
              <Input
                id="github-link"
                type="url"
                placeholder="https://github.com/organization/repo"
                value={githubRepoLink}
                onChange={(e) => setGithubRepoLink(e.target.value)}
                disabled={isLocked || isSubmitting}
                required
                className="font-mono text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="deployment-link" className="flex items-center gap-1.5">
                <Globe className="size-3.5 text-primary" />
                <span>Live Deployment URL (Optional)</span>
              </Label>
              <Input
                id="deployment-link"
                type="url"
                placeholder="https://your-demo.vercel.app"
                value={deploymentLink}
                onChange={(e) => setDeploymentLink(e.target.value)}
                disabled={isLocked || isSubmitting}
                className="font-mono text-xs"
              />
            </div>
          </form>
        )}
      </CardContent>

      <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        {!isEditing && hasFinalSubmitted ? (
          <Button
            size="sm"
            variant="outline"
            disabled={isLocked}
            onClick={() => setIsEditing(true)}
            className="rounded-xl"
          >
            <Pencil className="mr-1.5 size-3.5" />
            Update Deliverables
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            {hasFinalSubmitted ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  if (currentSubmission) {
                    setDriveLink(currentSubmission.driveLink ?? "");
                    setGithubRepoLink(currentSubmission.githubRepoLink ?? "");
                    setDeploymentLink(currentSubmission.deploymentLink ?? "");
                  }
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            ) : null}
            <Button
              form="final-form"
              type="submit"
              size="sm"
              disabled={isLocked || isSubmitting}
              className="rounded-xl"
            >
              {isSubmitting ? (
                <LoaderCircle className="mr-1.5 size-3.5 animate-spin" />
              ) : (
                <Send className="mr-1.5 size-3.5" />
              )}
              {isSubmitting ? "Submitting..." : hasFinalSubmitted ? "Update Deliverables" : "Submit Deliverables"}
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
