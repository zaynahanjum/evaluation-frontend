"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  FileCode2,
  Lock,
  MapPin,
  Sparkles,
  Unlock,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { teamApi } from "@/lib/team/api";
import { getTeamSession } from "@/lib/team/session";
import { useRealtimeEvents } from "@/hooks/use-realtime-events";
import type {
  TeamProfile,
  TeamSubmissionResponse,
  TeamTimelineEvent,
} from "@/lib/team/types";

export default function TeamDashboardPage() {
  const [profile, setProfile] = useState<TeamProfile | null>(null);
  const [submissionData, setSubmissionData] =
    useState<TeamSubmissionResponse | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<TeamTimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState<number | null>(null);

  const loadDashboardData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [prof, sub, timeline] = await Promise.all([
        teamApi.getProfile().catch(() => null),
        teamApi.getSubmission().catch(() => null),
        teamApi.getTimeline().catch(() => []),
      ]);
      setProfile(prof);
      setSubmissionData(sub);
      setTimelineEvents(timeline);
    } catch (err) {
      if (!silent) {
        setError(
          err instanceof Error ? err.message : "Failed to load team data.",
        );
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboardData();
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, [loadDashboardData]);

  // Real-time auto-refresh on admin updates (locks, timeline, team room, finalists)
  useRealtimeEvents(getTeamSession()?.accessToken, {
    SUBMISSION_LOCK_CHANGED: () => void loadDashboardData(true),
    TEAM_UPDATED: () => void loadDashboardData(true),
    TOP_TEAMS_UPDATED: () => void loadDashboardData(true),
    TIMELINE_CHANGED: () => void loadDashboardData(true),
    ROUND_STATUS_CHANGED: () => void loadDashboardData(true),
  });

  // Next upcoming event calculation
  // const nextEvent = useMemo(() => {
  //   if (!timelineEvents.length || now === null) return null;
  //   const future = timelineEvents
  //     .filter((e) => new Date(e.scheduledAt).getTime() >= now)
  //     .sort(
  //       (a, b) =>
  //         new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  //     );
  //   return future[0] ?? null;
  // }, [timelineEvents, now]);

  const hasPsSubmitted = Boolean(
    submissionData?.submission?.problemStatement &&
    submissionData?.submission?.solution,
  );

  const hasFinalSubmitted = Boolean(
    submissionData?.submission?.driveLink &&
    submissionData?.submission?.githubRepoLink,
  );

  const isPsLocked = Boolean(
    submissionData?.initialSubmissionLocked ?? submissionData?.submissionLocked,
  );
  const isFinalLocked = Boolean(
    submissionData?.finalSubmissionLocked ?? submissionData?.submissionLocked,
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">
              {profile?.name ?? "Team Dashboard"}
            </h1>
            {profile?.isTopTen ? (
              <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 text-xs">
                <Sparkles className="size-3" />
                Top 10 Finalist
              </Badge>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">
            Welcome to the Devhack 2026 participant portal. Manage your submissions and stay updated with the schedule.
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl bg-destructive/10 p-4 text-xs font-medium text-destructive">
          {error}
        </div>
      ) : null}

      {/* Main Action Hub Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Team Members & Room Quick View */}
        <Card className="border-border flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Users className="size-4" />
                </div>
                <CardTitle className="text-base">Team Details</CardTitle>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                {profile?.participants.length ?? 0} Members
              </Badge>
            </div>
            <CardDescription>
              Assigned hackathon room.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Assigned Room */}
            <div className="rounded-xl bg-muted/30 border border-border p-3.5 flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <MapPin className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">
                  Assigned Hackathon Room
                </p>
                <p className="text-sm font-medium">
                  {profile?.participants?.find((p) => p.roomName)?.roomName}
                </p>
              </div>
            </div>

            {/* Team Members */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Team Members
              </h4>

              <div className="space-y-1">
                {profile?.participants.slice(0, 3).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between text-sm py-2 border-b border-border/50 last:border-0"
                  >
                    <span className="font-medium text-foreground">{p.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Submissions Overview Card */}
        <Card className="border-border flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileCode2 className="size-4" />
                </div>
                <CardTitle className="text-base">Project Submissions</CardTitle>
              </div>
              {hasPsSubmitted && hasFinalSubmitted ? (
                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs">
                  All Complete
                </Badge>
              ) : null}
            </div>
            <CardDescription>
              Submit problem statement early and final deliverables at hackathon close.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3.5">
            {/* PS Status Item */}
            <div className="rounded-xl border border-border bg-card p-3.5 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">
                  Problem Statement & Solution
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {hasPsSubmitted
                    ? "Submitted"
                    : "Submission Pending"}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {isPsLocked ? (
                  <Badge variant="outline" className="text-[10px] gap-1">
                    <Lock className="size-2.5" />
                    Locked
                  </Badge>
                ) : (
                  <Badge className="bg-emerald-500/15 text-emerald-600 text-[10px] gap-1">
                    <Unlock className="size-2.5" />
                    Open
                  </Badge>
                )}
                {hasPsSubmitted ? (
                  <CheckCircle2 className="size-4 text-emerald-600" />
                ) : null}
              </div>
            </div>

            {/* Final Submission Item */}
            <div className="rounded-xl border border-border bg-card p-3.5 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">
                  Final Deliverables (PPT, Video, Code)
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {hasFinalSubmitted
                    ? "Submitted"
                    : "Submission Pending"}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {isFinalLocked ? (
                  <Badge variant="outline" className="text-[10px] gap-1">
                    <Lock className="size-2.5" />
                    Locked
                  </Badge>
                ) : (
                  <Badge className="bg-emerald-500/15 text-emerald-600 text-[10px] gap-1">
                    <Unlock className="size-2.5" />
                    Open
                  </Badge>
                )}
                {hasFinalSubmitted ? (
                  <CheckCircle2 className="size-4 text-emerald-600" />
                ) : null}
              </div>
            </div>
          </CardContent>

          <CardFooter className="pt-2 border-t border-border/60">
            <Link
              href="/team/submissions"
              className={buttonVariants({ className: "w-full rounded-xl" })}
            >
              <span>Open Submissions Hub</span>
              <ArrowRight className="ml-1.5 size-4" />
            </Link>
          </CardFooter>
        </Card>
      </div>

      {/* Schedule / Timeline Preview Banner */}
      <Card className="border-border">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Calendar className="size-4 text-primary" />
              </div>
              <span>Upcoming Hackathon Schedule</span>
            </CardTitle>
            <CardDescription>
              Key milestones, rounds, and evaluation timings.
            </CardDescription>
          </div>
          <Link
            href="/team/timeline"
            className={buttonVariants({ variant: "ghost", size: "sm", className: "rounded-xl text-xs" })}
          >
            <span>View Full Timeline</span>
            <ArrowRight className="ml-1 size-3.5" />
          </Link>
        </CardHeader>

        <CardContent>
          {timelineEvents.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              No schedule events announced yet.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {timelineEvents.slice(0, 3).map((event) => {
                const isPast =
                  now !== null && new Date(event.scheduledAt).getTime() < now;
                return (
                  <div
                    key={event.id}
                    className="rounded-xl border border-border bg-card p-3.5 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm text-foreground truncate">
                        {event.title}
                      </h4>
                    </div>
                    {event.description ? (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {event.description}
                      </p>
                    ) : null}
                    <div className="flex items-center gap-1.5 pt-1 text-[11px] text-muted-foreground font-mono">
                      <Clock className="size-3 text-primary" />
                      <span>{new Date(event.scheduledAt).toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

