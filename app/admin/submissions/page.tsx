"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ExternalLink,
  FileCode2,
  FolderGit2,
  Globe,
  Link2,
  Lock,
  LockOpen,
  RefreshCw,
  Search,
  UsersRound,
} from "lucide-react";

import {
  EmptyState,
  ErrorBanner,
  PageHeader,
  SuccessBanner,
  TableSkeleton,
} from "@/components/admin/feedback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminApi } from "@/lib/admin/data-source";
import { getErrorMessage } from "@/lib/api/errors";
import type { AdminSubmissionRecord, SubmissionsPayload } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export default function SubmissionsPage() {
  const [data, setData] = useState<SubmissionsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [togglingLock, setTogglingLock] = useState(false);
  const [search, setSearch] = useState("");

  // Detailed View Modal & Dynamic GET /admin/submissions/:teamId
  const [viewSubmission, setViewSubmission] = useState<AdminSubmissionRecord | null>(null);
  const [loadingTeamId, setLoadingTeamId] = useState<string | null>(null);
  const [lookupTeamId, setLookupTeamId] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const handleOpenSubmission = async (teamId: string) => {
    setLoadingTeamId(teamId);
    setError(null);
    try {
      const record = await adminApi.getTeamSubmission(teamId);
      setViewSubmission(record);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load team submission."));
    } finally {
      setLoadingTeamId(null);
    }
  };

  const handleDirectLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = lookupTeamId.trim();
    if (!id) return;
    setLookingUp(true);
    setLookupError(null);
    try {
      const record = await adminApi.getTeamSubmission(id);
      setViewSubmission(record);
      setLookupTeamId("");
    } catch (err) {
      setLookupError(getErrorMessage(err, `No submission found for team ID "${id}".`));
    } finally {
      setLookingUp(false);
    }
  };

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminApi.listSubmissions();
      setData(result);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load project submissions."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadSubmissions();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadSubmissions]);

  const handleToggleLock = async () => {
    if (!data) return;
    const nextLocked = !data.submissionLocked;
    setTogglingLock(true);
    setError(null);
    try {
      const res = await adminApi.setSubmissionLock(nextLocked);
      setData((prev) => (prev ? { ...prev, submissionLocked: nextLocked } : null));
      setSuccess(res.message || `Final submissions are now ${nextLocked ? "closed" : "open"}.`);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update submission lock status."));
    } finally {
      setTogglingLock(false);
    }
  };

  const submissions = data?.submissions;
  const filteredSubmissions = useMemo(() => {
    if (!submissions) return [];
    if (!search.trim()) return submissions;
    const q = search.toLowerCase();
    return submissions.filter((s) => {
      return (
        s.team.name.toLowerCase().includes(q) ||
        (s.problemStatement && s.problemStatement.toLowerCase().includes(q)) ||
        (s.solution && s.solution.toLowerCase().includes(q))
      );
    });
  }, [submissions, search]);

  const submissionsCount = data?.submissions.length ?? 0;
  const isLocked = data?.submissionLocked ?? false;

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button
            disabled={togglingLock || loading}
            onClick={handleToggleLock}
            size="sm"
            variant="outline"
            className={
              isLocked
                ? "border-emerald-500/50 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30 font-medium"
                : "border-amber-500/50 text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/30 font-medium"
            }
          >
            {isLocked ? (
              <>
                <LockOpen className="size-4 mr-1.5" />
                Unlock Submissions
              </>
            ) : (
              <>
                <Lock className="size-4 mr-1.5" />
                Lock Submissions
              </>
            )}
          </Button>
        }
        description="Inspect submitted problem statements, solutions, repository links, and manage final submission lock."
        title="Project Submissions"
      />

      {error ? <ErrorBanner message={error} /> : null}
      {success ? <SuccessBanner message={success} /> : null}

      {/* Lock Status & Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider">
              Final Submission Gate
            </CardDescription>
            <div className="flex items-center gap-2 pt-1">
              {isLocked ? (
                <Badge className="bg-amber-500/10 text-amber-700 border-amber-300 dark:text-amber-300 text-xs py-1">
                  <Lock className="size-3.5 mr-1" />
                  Locked (Submissions Closed)
                </Badge>
              ) : (
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-300 dark:text-emerald-400 text-xs py-1">
                  <LockOpen className="size-3.5 mr-1" />
                  Open (Accepting Submissions)
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-muted-foreground">
            <p>
              {isLocked
                ? "Teams can no longer edit or submit their final project deliverables."
                : "Participating teams can submit and update their final repository and demo links."}
            </p>
            <div>
              <Button
                disabled={togglingLock || loading}
                onClick={handleToggleLock}
                size="sm"
                variant={isLocked ? "default" : "outline"}
                className="h-8 text-xs font-medium"
              >
                {isLocked ? (
                  <>
                    <LockOpen className="size-3.5 mr-1.5" />
                    Open Final Submissions
                  </>
                ) : (
                  <>
                    <Lock className="size-3.5 mr-1.5" />
                    Close / Lock Submissions
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider">
              Total Submissions
            </CardDescription>
            <CardTitle className="text-2xl font-bold">{submissionsCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Teams with recorded final deliverables ready for evaluation
          </CardContent>
        </Card>
      </div>

      {/* Search Bar & Direct Team Lookup */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by team, statement, or solution…"
            value={search}
          />
        </div>

        <form onSubmit={handleDirectLookup} className="flex items-center gap-2 w-full sm:w-auto">
          <Input
            className="h-9 w-full sm:w-64 font-mono text-xs"
            onChange={(e) => setLookupTeamId(e.target.value)}
            placeholder="Lookup by team_id…"
            value={lookupTeamId}
          />
          <Button
            type="submit"
            size="sm"
            variant="secondary"
            disabled={lookingUp || !lookupTeamId.trim()}
            className="h-9 whitespace-nowrap text-xs font-medium"
          >
            {lookingUp ? <RefreshCw className="size-3.5 mr-1.5 animate-spin" /> : null}
            Fetch Submission
          </Button>
        </form>
      </div>

      {lookupError ? <ErrorBanner message={lookupError} /> : null}

      {/* Submissions Table */}
      {loading ? (
        <TableSkeleton rows={5} />
      ) : filteredSubmissions.length === 0 ? (
        <EmptyState
          detail={
            search
              ? "No submissions matched your search query."
              : "No team submissions recorded yet."
          }
          title="No Submissions Found"
        />
      ) : (
        <div className="rounded-2xl ring-1 ring-foreground/10 overflow-hidden bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team</TableHead>
                <TableHead>Problem Statement</TableHead>
                <TableHead>Links</TableHead>
                <TableHead>Submitted At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubmissions.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell className="font-semibold align-top">
                    <Link
                      href={`/admin/teams/${sub.teamId}`}
                      className="hover:underline text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                    >
                      <UsersRound className="size-4 text-muted-foreground" />
                      <span>{sub.team.name}</span>
                    </Link>
                    <div className="font-mono text-[10px] text-muted-foreground mt-0.5">
                      {sub.teamId}
                    </div>
                  </TableCell>

                  <TableCell className="max-w-md text-xs align-top">
                    <p className="line-clamp-2 font-medium text-foreground">
                      {sub.problemStatement ?? "No problem statement provided."}
                    </p>
                    {sub.solution ? (
                      <p className="line-clamp-1 text-muted-foreground pt-0.5">
                        Solution: {sub.solution}
                      </p>
                    ) : null}
                  </TableCell>

                  <TableCell className="align-top">
                    <div className="flex flex-wrap gap-1.5">
                      {sub.githubRepoLink ? (
                        <a
                          href={sub.githubRepoLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-medium hover:bg-muted transition-colors"
                          title="GitHub Repository"
                        >
                          <FolderGit2 className="size-3" />
                          <span>Code</span>
                        </a>
                      ) : null}

                      {sub.deploymentLink ? (
                        <a
                          href={sub.deploymentLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-medium hover:bg-muted transition-colors"
                          title="Live Deployment"
                        >
                          <Globe className="size-3" />
                          <span>Demo</span>
                        </a>
                      ) : null}

                      {sub.driveLink ? (
                        <a
                          href={sub.driveLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-medium hover:bg-muted transition-colors"
                          title="Presentation / Drive"
                        >
                          <Link2 className="size-3" />
                          <span>Drive</span>
                        </a>
                      ) : null}

                      {!sub.githubRepoLink && !sub.deploymentLink && !sub.driveLink ? (
                        <span className="text-xs text-muted-foreground italic">—</span>
                      ) : null}
                    </div>
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground align-top whitespace-nowrap">
                    {new Date(sub.submittedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>

                  <TableCell className="text-right align-top">
                    <Button
                      onClick={() => void handleOpenSubmission(sub.teamId)}
                      disabled={loadingTeamId === sub.teamId}
                      size="sm"
                      variant="outline"
                      className="rounded-xl h-8 text-xs font-medium"
                    >
                      {loadingTeamId === sub.teamId ? (
                        <RefreshCw className="size-3 mr-1 animate-spin" />
                      ) : null}
                      <span>View Full Pitch</span>
                      <ExternalLink className="size-3 ml-1 text-muted-foreground" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Full Submission Pitch Modal */}
      <Dialog
        onOpenChange={(open) => !open && setViewSubmission(null)}
        open={Boolean(viewSubmission)}
      >
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between gap-2 pr-6">
              <div className="flex items-center gap-2">
                <FileCode2 className="size-5 text-primary" />
                <DialogTitle>{viewSubmission?.team.name} — Submission</DialogTitle>
              </div>
            </div>
            <DialogDescription>
              Submitted on{" "}
              {viewSubmission
                ? new Date(viewSubmission.submittedAt).toLocaleString()
                : ""}
            </DialogDescription>
          </DialogHeader>

          {viewSubmission ? (
            <div className="space-y-4 pt-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="font-mono text-[11px]">
                  Team ID: {viewSubmission.teamId}
                </Badge>
                <Badge variant="outline" className="font-mono text-[11px]">
                  Submission ID: {viewSubmission.id}
                </Badge>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Problem Statement
                </h4>
                <p className="mt-1.5 text-sm text-foreground whitespace-pre-wrap leading-relaxed bg-muted/20 p-3 rounded-xl border border-border/50">
                  {viewSubmission.problemStatement ?? "No problem statement provided."}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Proposed Solution
                </h4>
                <p className="mt-1.5 text-sm text-foreground whitespace-pre-wrap leading-relaxed bg-muted/20 p-3 rounded-xl border border-border/50">
                  {viewSubmission.solution ?? "No solution provided."}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Project Deliverable Links
                </h4>
                <div className="flex flex-wrap gap-2">
                  {viewSubmission.githubRepoLink ? (
                    <a
                      href={viewSubmission.githubRepoLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                    >
                      <FolderGit2 className="size-3.5 text-primary" />
                      <span>GitHub Repository</span>
                      <ExternalLink className="size-3 text-muted-foreground" />
                    </a>
                  ) : null}

                  {viewSubmission.deploymentLink ? (
                    <a
                      href={viewSubmission.deploymentLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                    >
                      <Globe className="size-3.5 text-primary" />
                      <span>Live Deployment</span>
                      <ExternalLink className="size-3 text-muted-foreground" />
                    </a>
                  ) : null}

                  {viewSubmission.driveLink ? (
                    <a
                      href={viewSubmission.driveLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                    >
                      <Link2 className="size-3.5 text-primary" />
                      <span>Drive / Presentation</span>
                      <ExternalLink className="size-3 text-muted-foreground" />
                    </a>
                  ) : null}

                  {!viewSubmission.githubRepoLink &&
                  !viewSubmission.deploymentLink &&
                  !viewSubmission.driveLink ? (
                    <span className="text-xs text-muted-foreground italic">
                      No external deliverable links provided.
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 pt-2">
            {viewSubmission ? (
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => void handleOpenSubmission(viewSubmission.teamId)}
                  disabled={loadingTeamId === viewSubmission.teamId}
                  size="sm"
                  variant="outline"
                  className="rounded-xl text-xs"
                >
                  <RefreshCw
                    className={cn(
                      "size-3 mr-1.5",
                      loadingTeamId === viewSubmission.teamId && "animate-spin",
                    )}
                  />
                  <span>Refresh</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-xl text-xs"
                  nativeButton={false}
                  render={<Link href={`/admin/teams/${viewSubmission.teamId}`} />}
                >
                  <UsersRound className="size-3 mr-1" />
                  <span>Team Profile</span>
                </Button>
              </div>
            ) : <div />}

            <Button
              onClick={() => setViewSubmission(null)}
              type="button"
              variant="outline"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
