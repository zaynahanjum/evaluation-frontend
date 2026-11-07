"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Lock, LockOpen } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  EmptyState,
  ErrorBanner,
  PageHeader,
  SuccessBanner,
  TableSkeleton,
} from "@/components/admin/feedback";
import { adminApi } from "@/lib/admin/data-source";
import { getAdminSession } from "@/lib/admin-session";
import { useRealtimeEvents } from "@/hooks/use-realtime-events";
import { getErrorMessage } from "@/lib/api/errors";
import type { DashboardData } from "@/lib/api/types";

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [togglingFinalLock, setTogglingFinalLock] = useState(false);
  const [togglingInitialLock, setTogglingInitialLock] = useState(false);

  const handleToggleFinalLock = async () => {
    if (!data) return;
    const currentLocked =
      data.finalSubmissionLocked ?? data.submissionLocked ?? false;
    const nextLocked = !currentLocked;
    setTogglingFinalLock(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await adminApi.setFinalSubmissionLock(nextLocked);
      setData((prev) =>
        prev
          ? {
              ...prev,
              finalSubmissionLocked: nextLocked,
              submissionLocked: nextLocked,
            }
          : null,
      );
      setSuccess(
        res.message ||
          `Final submissions are now ${nextLocked ? "closed" : "open"}.`,
      );
    } catch (err) {
      setError(
        getErrorMessage(err, "Failed to update final submission lock status."),
      );
    } finally {
      setTogglingFinalLock(false);
    }
  };

  const handleToggleInitialLock = async () => {
    if (!data) return;
    const currentLocked = data.initialSubmissionLocked ?? false;
    const nextLocked = !currentLocked;
    setTogglingInitialLock(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await adminApi.setInitialSubmissionLock(nextLocked);
      setData((prev) =>
        prev ? { ...prev, initialSubmissionLocked: nextLocked } : null,
      );
      setSuccess(
        res.message ||
          `Problem statement submissions are now ${nextLocked ? "closed" : "open"}.`,
      );
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Failed to update problem statement submission lock status.",
        ),
      );
    } finally {
      setTogglingInitialLock(false);
    }
  };

  const loadDashboard = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const dashboard = await adminApi.getDashboard();
      setData(dashboard);
    } catch (err) {
      if (!silent) {
        setError(getErrorMessage(err, "Could not load the admin dashboard."));
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  // Real-time auto-refresh on any system event
  useRealtimeEvents(getAdminSession()?.accessToken, {
    SCORES_UPDATED: () => void loadDashboard(true),
    SUBMISSION_UPDATED: () => void loadDashboard(true),
    TEAM_UPDATED: () => void loadDashboard(true),
    TOP_TEAMS_UPDATED: () => void loadDashboard(true),
    ROUND_STATUS_CHANGED: () => void loadDashboard(true),
    ROUND_CHANGED: () => void loadDashboard(true),
    SUBMISSION_LOCK_CHANGED: () => void loadDashboard(true),
  });

  return (
    <div>
      <PageHeader title="Admin dashboard" />
      {error ? <ErrorBanner message={error} /> : null}
      {success ? <SuccessBanner message={success} /> : null}
      {loading ? <TableSkeleton rows={4} /> : null}
      {!loading && !error && data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            href="/admin/users"
            label="Mentors"
            value={data.totalMentors}
          />
          <StatCard
            href="/admin/users"
            label="Judges"
            value={data.totalJudges}
          />
          <StatCard
            href="/admin/rounds"
            label="Active rounds"
            value={data.activeRounds.length}
          />
          <StatCard label="Teams" value={data.totalTeams} />
        </div>
      ) : null}
      {!loading && !error && data ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Active rounds</CardTitle>
            </CardHeader>
            <CardContent>
              {data.activeRounds.length === 0 ? (
                <EmptyState
                  detail="Start a pending round from Round Management."
                  title="No active rounds"
                />
              ) : (
                <ul className="space-y-2">
                  {data.activeRounds.map((round) => (
                    <li
                      className="flex items-center justify-between rounded-xl border border-border px-3 py-2"
                      key={round.id}
                    >
                      <span>{round.name}</span>
                      <Badge variant="secondary">{round.type}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          {(() => {
            const isFinalLocked =
              data.finalSubmissionLocked ?? data.submissionLocked ?? false;
            const isInitialLocked = data.initialSubmissionLocked ?? false;
            return (
              <>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle>Final submission gate</CardTitle>
                    {isFinalLocked ? (
                      <Badge className="bg-amber-500/10 text-amber-700 border-amber-300 dark:text-amber-300 text-xs">
                        <Lock className="size-3 mr-1" />
                        Locked (Closed)
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-300 dark:text-emerald-400 text-xs">
                        <LockOpen className="size-3 mr-1" />
                        Open (Accepting)
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Team final project submissions are currently{" "}
                      <strong>{isFinalLocked ? "closed" : "open"}</strong>.{" "}
                      {isFinalLocked
                        ? "Teams cannot edit or submit new project repository or demo links."
                        : "Teams are actively allowed to submit and update deliverables."}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        onClick={handleToggleFinalLock}
                        disabled={togglingFinalLock}
                        size="sm"
                        variant={isFinalLocked ? "default" : "outline"}
                      >
                        {isFinalLocked ? (
                          <>
                            <LockOpen className="size-3.5 mr-1.5" />
                            Open Final Submissions
                          </>
                        ) : (
                          <>
                            <Lock className="size-3.5 mr-1.5" />
                            Lock Final Submissions
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        nativeButton={false}
                        render={<Link href="/admin/submissions" />}
                      >
                        Manage Submissions
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle>Problem statement submission</CardTitle>
                    {isInitialLocked ? (
                      <Badge className="bg-amber-500/10 text-amber-700 border-amber-300 dark:text-amber-300 text-xs">
                        <Lock className="size-3 mr-1" />
                        Locked (Closed)
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-300 dark:text-emerald-400 text-xs">
                        <LockOpen className="size-3 mr-1" />
                        Open (Accepting)
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Team problem statement submissions are currently{" "}
                      <strong>{isInitialLocked ? "closed" : "open"}</strong>.{" "}
                      {isInitialLocked
                        ? "Teams cannot edit or submit problem statement."
                        : "Teams are actively allowed to submit problem statements."}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        onClick={handleToggleInitialLock}
                        disabled={togglingInitialLock}
                        size="sm"
                        variant={isInitialLocked ? "default" : "outline"}
                      >
                        {isInitialLocked ? (
                          <>
                            <LockOpen className="size-3.5 mr-1.5" />
                            Open Problem Statements
                          </>
                        ) : (
                          <>
                            <Lock className="size-3.5 mr-1.5" />
                            Lock Problem Statements
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        nativeButton={false}
                        render={<Link href="/admin/submissions" />}
                      >
                        Manage Submissions
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            );
          })()}
        </div>
      ) : null}
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href?: string;
}) {
  const content = (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-heading text-3xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}
