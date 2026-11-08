"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CalendarClock,
  CheckCircle2,
  Clock,
  Filter,
  Hourglass,
  Search,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { TeamTimelineEvent } from "@/lib/team/types";

function formatEventDate(iso: string): { dateStr: string; timeStr: string } {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return { dateStr: "TBD", timeStr: "" };
    return {
      dateStr: d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
      timeStr: d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  } catch {
    return { dateStr: "TBD", timeStr: "" };
  }
}

function getRelativeTime(eventTimeMs: number, nowMs: number): string {
  const diffMs = eventTimeMs - nowMs;
  const isPast = diffMs < 0;
  const absDiff = Math.abs(diffMs);

  const mins = Math.floor(absDiff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (isPast) {
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return "Just finished";
  }

  if (days > 0) return `in ${days}d ${hours % 24}h`;
  if (hours > 0) return `in ${hours}h ${mins % 60}m`;
  if (mins > 0) return `in ${mins}m`;
  return "Starting soon";
}

type TimelineFilter = "ALL" | "UPCOMING" | "PAST";

export function TimelineView({
  events,
  onRefresh,
  loading = false,
}: {
  events: TeamTimelineEvent[];
  onRefresh?: () => Promise<void>;
  loading?: boolean;
}) {
  const [filter, setFilter] = useState<TimelineFilter>("ALL");
  const [search, setSearch] = useState("");
  const [currentTime, setCurrentTime] = useState<number | null>(null);

  // Compute current client time safely in an effect to avoid Next.js 16 SSR time mismatches
  useEffect(() => {
    setCurrentTime(Date.now());
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 30000); // refresh relative timers every 30s
    return () => clearInterval(interval);
  }, []);

  const sortedEvents = useMemo(() => {
    return [...events].sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    );
  }, [events]);

  const filteredEvents = useMemo(() => {
    return sortedEvents.filter((event) => {
      const eventTime = new Date(event.scheduledAt).getTime();
      const now = currentTime ?? 0;

      if (currentTime !== null) {
        if (filter === "UPCOMING" && eventTime < now) return false;
        if (filter === "PAST" && eventTime >= now) return false;
      }

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        event.title.toLowerCase().includes(q) ||
        (event.description ? event.description.toLowerCase().includes(q) : false)
      );
    });
  }, [sortedEvents, filter, search, currentTime]);

  const upcomingCount =
    currentTime !== null
      ? sortedEvents.filter((e) => new Date(e.scheduledAt).getTime() >= currentTime)
        .length
      : 0;

  const pastCount =
    currentTime !== null
      ? sortedEvents.filter((e) => new Date(e.scheduledAt).getTime() < currentTime)
        .length
      : 0;

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search timeline milestones..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 rounded-xl"
          />
        </div>

      </div>

      {/* Timeline Events List */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CalendarClock className="size-4" />
            </div>
            <div>
              <CardTitle className="text-lg">Hackathon Schedule & Milestones</CardTitle>
              <CardDescription>
                Track upcoming deadlines, mentoring sessions, and round schedules.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredEvents.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {search
                ? "No timeline events matched your search query."
                : "No schedule events found for this filter."}
            </div>
          ) : (
            <div className="relative space-y-4 before:absolute before:bottom-3 before:left-4 before:top-4 before:hidden before:w-0.5 before:bg-border/80 sm:before:block">
              {filteredEvents.map((event) => {
                const eventTime = new Date(event.scheduledAt).getTime();
                const now = currentTime ?? 0;
                const isPast = currentTime !== null && eventTime < now;
                const { dateStr, timeStr } = formatEventDate(event.scheduledAt);
                const relativeStr =
                  currentTime !== null ? getRelativeTime(eventTime, now) : "";

                return (
                  <div
                    key={event.id}
                    className="relative transition-all sm:pl-10"
                  >
                    {/* Visual Timeline Dot */}
                    <div
                      className={`absolute left-4 top-4 hidden size-3 -translate-x-1/2 rounded-full border-2 bg-background sm:block ${isPast
                        ? "border-muted-foreground bg-muted"
                        : "border-primary bg-primary ring-4 ring-primary/10"
                        }`}
                    />

                    {/* Milestone Card */}
                    <div
                      className={`rounded-2xl border p-4.5 transition-colors ${isPast
                        ? "border-border/60 bg-muted/20 opacity-80"
                        : "border-border bg-card shadow-xs hover:border-primary/40"
                        }`}
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-base text-foreground">
                              {event.title}
                            </h3>
                            {isPast ? (
                              <Badge
                                variant="secondary"
                                className="text-[10px] bg-muted text-muted-foreground"
                              >
                                Completed
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-medium"
                              >
                                Upcoming
                              </Badge>
                            )}
                          </div>

                          {event.description ? (
                            <p className="text-xs text-muted-foreground leading-relaxed pt-0.5">
                              {event.description}
                            </p>
                          ) : null}
                        </div>

                        {/* Date and Timing Badges */}
                        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
                          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-2.5 py-1 text-xs">
                            <Calendar className="size-3 text-muted-foreground" />
                            <span className="font-medium text-foreground">{dateStr}</span>
                            <span className="text-muted-foreground">•</span>
                            <Clock className="size-3 text-muted-foreground" />
                            <span className="font-medium text-foreground">{timeStr}</span>
                          </div>

                          {relativeStr ? (
                            <Badge
                              variant="secondary"
                              className={`text-[11px] font-mono ${isPast
                                ? "text-muted-foreground"
                                : "bg-primary/10 text-primary font-semibold"
                                }`}
                            >
                              {relativeStr}
                            </Badge>
                          ) : null}
                        </div>
                      </div>
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
