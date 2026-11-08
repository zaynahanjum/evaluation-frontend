"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FileCode2,
  FolderGit2,
  Layers,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FinalDeliverablesCard,
  ProblemStatementCard,
} from "@/components/team/submission-cards";
import { teamApi } from "@/lib/team/api";
import { getTeamSession } from "@/lib/team/session";
import { useRealtimeEvents } from "@/hooks/use-realtime-events";
import type { TeamSubmissionResponse } from "@/lib/team/types";

export default function TeamSubmissionsPage() {
  const [submissionData, setSubmissionData] =
    useState<TeamSubmissionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubmission = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await teamApi.getSubmission();
      setSubmissionData(data);
    } catch (err) {
      if (!silent) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load submission details.",
        );
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSubmission();
  }, [fetchSubmission]);

  // Real-time auto-refresh on admin actions (submission lock/unlock)
  useRealtimeEvents(getTeamSession()?.accessToken, {
    SUBMISSION_LOCK_CHANGED: () => {
      void fetchSubmission(true);
    },
    TEAM_UPDATED: () => {
      void fetchSubmission(true);
    },
  });

  return (
    <div className="space-y-6">
      {/* Page Title & Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">
            Team Submissions Hub
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Submit your problem statement, solution, and final project deliverables when windows are open.
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl bg-destructive/10 p-4 text-xs font-medium text-destructive">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      ) : (
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="ps" className="text-xs">
              <FileCode2 className="size-3.5 mr-1.5" />
              1. PS & Solution
            </TabsTrigger>
            <TabsTrigger value="final" className="text-xs">
              <FolderGit2 className="size-3.5 mr-1.5" />
              2. Final Deliverables
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6 mt-0">
            <ProblemStatementCard
              submissionData={submissionData}
              onRefresh={fetchSubmission}
            />
            <FinalDeliverablesCard
              submissionData={submissionData}
              onRefresh={fetchSubmission}
            />
          </TabsContent>

          <TabsContent value="ps" className="mt-0">
            <ProblemStatementCard
              submissionData={submissionData}
              onRefresh={fetchSubmission}
            />
          </TabsContent>

          <TabsContent value="final" className="mt-0">
            <FinalDeliverablesCard
              submissionData={submissionData}
              onRefresh={fetchSubmission}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

