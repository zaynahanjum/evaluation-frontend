"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TimelineView } from "@/components/team/timeline-view";
import { teamApi } from "@/lib/team/api";
import { getTeamSession } from "@/lib/team/session";
import { useRealtimeEvents } from "@/hooks/use-realtime-events";
import type { TeamTimelineEvent } from "@/lib/team/types";

export default function TeamTimelinePage() {
  const [events, setEvents] = useState<TeamTimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTimeline = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await teamApi.getTimeline();
      setEvents(data);
    } catch (err) {
      if (!silent) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load hackathon timeline.",
        );
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTimeline();
  }, [fetchTimeline]);

  // Real-time auto-refresh when admin modifies timeline events
  useRealtimeEvents(getTeamSession()?.accessToken, {
    TIMELINE_CHANGED: () => {
      void fetchTimeline(true);
    },
  });

  return (
    <div className="space-y-6">
      {/* Page Title & Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">
            Hackathon Timeline
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Keep track of scheduled rounds, evaluation windows, and important milestones.
          </p>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center justify-between rounded-xl bg-destructive/10 p-4 text-xs font-medium text-destructive">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchTimeline()}
            className="h-7 text-xs"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && events.length === 0 ? (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24 rounded-md" />
            <Skeleton className="h-9 w-28 rounded-md" />
            <Skeleton className="h-9 w-24 rounded-md" />
          </div>
          <Skeleton className="h-10 w-full rounded-md" />
          <div className="space-y-3 pt-2">
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        </div>
      ) : (
        <TimelineView
          events={events}
          onRefresh={fetchTimeline}
          loading={loading}
        />
      )}
    </div>
  );
}
