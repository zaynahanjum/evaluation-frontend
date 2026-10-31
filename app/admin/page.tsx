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
import { getErrorMessage } from "@/lib/api/errors";
import type { DashboardData } from "@/lib/api/types";

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [togglingLock, setTogglingLock] = useState(false);

  const handleToggleLock = async () => {
    if (!data) return;
    const nextLocked = !data.submissionLocked;
    setTogglingLock(true);
    setError(null);
    setSuccess(null);
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

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const dashboard = await adminApi.getDashboard();
        if (!cancelled) setData(dashboard);
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, "Could not load the admin dashboard."));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <PageHeader
        description="Overview from GET /admin/dashboard. Use the modules in the sidebar to manage evaluators, rounds, panels, and scores."
        title="Admin dashboard"
      />
      {error ? <ErrorBanner message={error} /> : null}
      {success ? <SuccessBanner message={success} /> : null}
      {loading ? <TableSkeleton rows={4} /> : null}
      {!loading && !error && data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard href="/admin/users" label="Mentors" value={data.totalMentors} />
          <StatCard href="/admin/users" label="Judges" value={data.totalJudges} />
          <StatCard href="/admin/rounds" label="Active rounds" value={data.activeRounds.length} />
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Final submission gate</CardTitle>
              {data.submissionLocked ? (
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
                <strong>{data.submissionLocked ? "closed" : "open"}</strong>.{" "}
                {data.submissionLocked
                  ? "Teams cannot edit or submit new project repository or demo links."
                  : "Teams are actively allowed to submit and update deliverables."}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <Button
                  onClick={handleToggleLock}
                  disabled={togglingLock}
                  size="sm"
                  variant={data.submissionLocked ? "default" : "outline"}
                >
                  {data.submissionLocked ? (
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