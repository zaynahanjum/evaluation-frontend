"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import {
  EmptyState,
  ErrorBanner,
  PageHeader,
  SuccessBanner,
  TableSkeleton,
} from "@/components/admin/feedback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { adminApi } from "@/lib/admin/data-source";
import { getErrorMessage } from "@/lib/api/errors";
import type { TimelineEvent } from "@/lib/api/types";

type Filter = "ALL" | "UPCOMING" | "PAST" | "PUBLIC";

function toDatetimeLocal(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch {
    return "";
  }
}

function formatEventDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}

export default function TimelinePage() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [search, setSearch] = useState("");

  // Create / Edit modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledAtLocal, setScheduledAtLocal] = useState("");
  const [visibleToTeams, setVisibleToTeams] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Delete modal state
  const [deleteEvent, setDeleteEvent] = useState<TimelineEvent | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadTimeline = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.listTimeline();
      setEvents(data);
    } catch (err) {
      setEvents([]);
      setError(getErrorMessage(err, "Could not load timeline events."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadTimeline();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadTimeline]);

  const openCreateModal = () => {
    setEditingEvent(null);
    setTitle("");
    setDescription("");
    // Default scheduled time: next full hour
    const now = new Date();
    now.setHours(now.getHours() + 1, 0, 0, 0);
    setScheduledAtLocal(toDatetimeLocal(now.toISOString()));
    setVisibleToTeams(true);
    setModalError(null);
    setModalOpen(true);
  };

  const openEditModal = (event: TimelineEvent) => {
    setEditingEvent(event);
    setTitle(event.title);
    setDescription(event.description ?? "");
    setScheduledAtLocal(toDatetimeLocal(event.scheduledAt));
    setVisibleToTeams(event.visibleToTeams);
    setModalError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setModalError("Title is required.");
      return;
    }
    if (!scheduledAtLocal) {
      setModalError("Scheduled date and time are required.");
      return;
    }

    let isoDate: string;
    try {
      const parsed = new Date(scheduledAtLocal);
      if (isNaN(parsed.getTime())) {
        throw new Error("Invalid date");
      }
      isoDate = parsed.toISOString();
    } catch {
      setModalError("Please provide a valid date and time.");
      return;
    }

    setSubmitting(true);
    setModalError(null);
    try {
      if (editingEvent) {
        await adminApi.updateTimeline(editingEvent.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          scheduledAt: isoDate,
          visibleToTeams,
        });
        setSuccess(`Updated event "${title.trim()}".`);
      } else {
        await adminApi.createTimeline({
          title: title.trim(),
          description: description.trim() || undefined,
          scheduledAt: isoDate,
          visibleToTeams,
        });
        setSuccess(`Created event "${title.trim()}".`);
      }
      setModalOpen(false);
      await loadTimeline();
    } catch (err) {
      setModalError(getErrorMessage(err, "Failed to save timeline event."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteEvent) return;
    setDeleting(true);
    try {
      await adminApi.deleteTimeline(deleteEvent.id);
      setSuccess(`Deleted event "${deleteEvent.title}".`);
      setDeleteEvent(null);
      await loadTimeline();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete timeline event."));
    } finally {
      setDeleting(false);
    }
  };

  const handleQuickToggleVisibility = async (event: TimelineEvent) => {
    try {
      const nextVisible = !event.visibleToTeams;
      await adminApi.updateTimeline(event.id, { visibleToTeams: nextVisible });
      setEvents((prev) =>
        prev.map((e) => (e.id === event.id ? { ...e, visibleToTeams: nextVisible } : e)),
      );
      setSuccess(
        `Event "${event.title}" is now ${nextVisible ? "visible to teams" : "hidden (admin only)"}.`,
      );
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update event visibility."));
    }
  };

  const filteredEvents = useMemo(() => {
    const now = new Date().getTime();
    return events.filter((ev) => {
      const evTime = new Date(ev.scheduledAt).getTime();
      if (filter === "UPCOMING" && evTime < now) return false;
      if (filter === "PAST" && evTime >= now) return false;
      if (filter === "PUBLIC" && !ev.visibleToTeams) return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        ev.title.toLowerCase().includes(q) ||
        (ev.description ? ev.description.toLowerCase().includes(q) : false)
      );
    });
  }, [events, filter, search]);

  const now = new Date().getTime();
  const upcomingCount = events.filter((e) => new Date(e.scheduledAt).getTime() >= now).length;
  const pastCount = events.filter((e) => new Date(e.scheduledAt).getTime() < now).length;
  const publicCount = events.filter((e) => e.visibleToTeams).length;

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button onClick={openCreateModal} size="sm">
            <Plus className="mr-1.5 size-4" />
            Add Event
          </Button>
        }
        description="Schedule milestones, presentations, and announcements for teams and administrators."
        title="Hackathon Timeline"
      />

      {error ? <ErrorBanner message={error} /> : null}
      {success ? <SuccessBanner message={success} /> : null}

      {/* Filter and search bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setFilter("ALL")}
            size="sm"
            variant={filter === "ALL" ? "default" : "outline"}
          >
            All ({events.length})
          </Button>
          <Button
            onClick={() => setFilter("UPCOMING")}
            size="sm"
            variant={filter === "UPCOMING" ? "default" : "outline"}
          >
            <Clock className="mr-1 size-3.5" />
            Upcoming ({upcomingCount})
          </Button>
          <Button
            onClick={() => setFilter("PAST")}
            size="sm"
            variant={filter === "PAST" ? "default" : "outline"}
          >
            Past ({pastCount})
          </Button>
          <Button
            onClick={() => setFilter("PUBLIC")}
            size="sm"
            variant={filter === "PUBLIC" ? "default" : "outline"}
          >
            <Eye className="mr-1 size-3.5" />
            Public to Teams ({publicCount})
          </Button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8 text-sm"
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events…"
            value={search}
          />
        </div>
      </div>

      {/* Events list */}
      {loading ? (
        <TableSkeleton rows={4} />
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          detail={
            search || filter !== "ALL"
              ? "No events match the selected filters."
              : "No timeline events created yet. Click 'Add Event' to build your schedule."
          }
          title="No timeline events"
        />
      ) : (
        <div className="relative space-y-4 before:absolute before:bottom-0 before:left-5 before:top-4 before:hidden before:w-0.5 before:bg-border sm:before:block">
          {filteredEvents.map((event) => {
            const isPast = new Date(event.scheduledAt).getTime() < now;
            return (
              <div className="relative sm:pl-12" key={event.id}>
                {/* Visual timeline dot indicator on sm screens */}
                <div
                  className={`absolute left-3.5 top-5 hidden size-3 -translate-x-1/2 rounded-full border-2 bg-background sm:block ${
                    isPast ? "border-muted-foreground/50 bg-muted" : "border-primary bg-primary"
                  }`}
                />

                <Card
                  className={`transition-all hover:border-foreground/25 ${
                    isPast ? "opacity-75" : ""
                  }`}
                >
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-heading text-lg font-semibold tracking-tight">
                            {event.title}
                          </h3>
                          {event.visibleToTeams ? (
                            <Badge
                              onClick={() => void handleQuickToggleVisibility(event)}
                              className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400 cursor-pointer select-none transition-colors"
                              variant="outline"
                              title="Click to hide from teams (make Admin Only)"
                            >
                              <Eye className="mr-1 size-3" />
                              Public to Teams
                            </Badge>
                          ) : (
                            <Badge
                              onClick={() => void handleQuickToggleVisibility(event)}
                              variant="secondary"
                              className="cursor-pointer select-none hover:bg-muted-foreground/20 transition-colors"
                              title="Click to publish to teams (make Public)"
                            >
                              <EyeOff className="mr-1 size-3" />
                              Admin Only
                            </Badge>
                          )}
                          {isPast && (
                            <Badge variant="outline" className="text-muted-foreground">
                              Past
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                          <CalendarDays className="size-3.5 text-primary" />
                          <span>{formatEventDate(event.scheduledAt)}</span>
                        </div>

                        {event.description ? (
                          <p className="pt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                            {event.description}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-start">
                        <Button
                          onClick={() => openEditModal(event)}
                          size="sm"
                          variant="ghost"
                          title="Edit Event"
                        >
                          <Pencil className="size-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          onClick={() => setDeleteEvent(event)}
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          title="Delete Event"
                        >
                          <Trash2 className="size-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog onOpenChange={setModalOpen} open={modalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? "Edit Timeline Event" : "Create Timeline Event"}
            </DialogTitle>
            <DialogDescription>
              {editingEvent
                ? "Update details or schedule for this milestone."
                : "Schedule a new event or announcement for the hackathon."}
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4 pt-2" onSubmit={handleSave}>
            {modalError ? <ErrorBanner message={modalError} /> : null}

            <div className="space-y-1.5">
              <Label htmlFor="event-title">Event Title *</Label>
              <Input
                id="event-title"
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Hackathon Kickoff, Mentoring Session 1"
                required
                value={title}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="event-scheduled">Scheduled Date & Time *</Label>
              <Input
                id="event-scheduled"
                onChange={(e) => setScheduledAtLocal(e.target.value)}
                required
                type="datetime-local"
                value={scheduledAtLocal}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="event-description">Description (optional)</Label>
              <Textarea
                id="event-description"
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details, location, meeting link, or instructions for teams..."
                rows={3}
                value={description}
              />
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <Checkbox
                checked={visibleToTeams}
                id="event-visible"
                onCheckedChange={(checked) => setVisibleToTeams(Boolean(checked))}
              />
              <Label
                className="text-sm font-normal cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                htmlFor="event-visible"
              >
                Visible to participating teams on their dashboard
              </Label>
            </div>

            <DialogFooter className="pt-2">
              <Button
                onClick={() => setModalOpen(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button disabled={submitting} type="submit">
                {submitting ? "Saving…" : editingEvent ? "Save Changes" : "Create Event"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        confirmLabel="Delete Event"
        description={
          deleteEvent
            ? `Are you sure you want to delete "${deleteEvent.title}"? This cannot be undone.`
            : ""
        }
        onConfirm={handleDelete}
        onOpenChange={(open) => !open && setDeleteEvent(null)}
        open={Boolean(deleteEvent)}
        pending={deleting}
        title="Delete Timeline Event"
      />
    </div>
  );
}
