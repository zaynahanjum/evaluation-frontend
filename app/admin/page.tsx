"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  EmptyState,
  ErrorBanner,
  PageHeader,
  TableSkeleton,
} from "@/components/admin/feedback";
import { adminApi } from "@/lib/admin/data-source";
import { getErrorMessage } from "@/lib/api/errors";
import type { DashboardData } from "@/lib/api/types";

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
            <CardHeader>
              <CardTitle>Submission lock</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Team submissions are currently{" "}
                <strong>{data.submissionLocked ? "locked" : "unlocked"}</strong>.
                Timeline, teams, submissions, and top-10 selection are owned by
                another module.
              </p>
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
