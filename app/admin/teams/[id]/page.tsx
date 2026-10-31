"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  FileCode2,
  FolderGit2,
  Hotel,
  Layers,
  Link2,
  Pencil,
  RefreshCw,
  Trash2,
  Trophy,
  UserRound,
  UsersRound,
} from "lucide-react";

import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { ErrorBanner, SuccessBanner } from "@/components/admin/feedback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
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
import type { AdminSubmissionRecord, Participant, TeamDetail } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export default function TeamDetailPage() {
  const params = useParams<{ id: string }>();
  const teamId = params?.id;

  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Edit Team Modal State
  const [editTeamOpen, setEditTeamOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [savingTeam, setSavingTeam] = useState(false);
  const [teamModalError, setTeamModalError] = useState<string | null>(null);

  // Edit Participant Modal State
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [partName, setPartName] = useState("");
  const [partHotelNo, setPartHotelNo] = useState("");
  const [partRoomName, setPartRoomName] = useState("");
  const [savingPart, setSavingPart] = useState(false);
  const [partModalError, setPartModalError] = useState<string | null>(null);

  // Delete Team State
  const router = useRouter();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Dedicated Submission State (GET /admin/submissions/:teamId)
  const [submission, setSubmission] = useState<AdminSubmissionRecord | null>(null);
  const [fetchingSubmission, setFetchingSubmission] = useState(false);

  const fetchTeamSubmission = useCallback(async (id: string) => {
    setFetchingSubmission(true);
    try {
      const data = await adminApi.getTeamSubmission(id);
      setSubmission(data);
    } catch {
      // 404 indicates team has not submitted yet
      setSubmission(null);
    } finally {
      setFetchingSubmission(false);
    }
  }, []);

  const handleDeleteTeam = async () => {
    if (!team) return;
    setDeleting(true);
    try {
      await adminApi.deleteTeam(team.id);
      router.push("/admin/teams");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete team."));
      setDeleteConfirmOpen(false);
      setDeleting(false);
    }
  };

  const loadTeam = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getTeam(teamId);
      setTeam(data);
      void fetchTeamSubmission(teamId);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load team details."));
    } finally {
      setLoading(false);
    }
  }, [teamId, fetchTeamSubmission]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadTeam();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadTeam]);

  // Open Edit Team Modal
  const openEditTeam = () => {
    if (!team) return;
    setEditName(team.name);
    setEditUsername(team.username);
    setEditIsActive(team.isActive);
    setTeamModalError(null);
    setEditTeamOpen(true);
  };

  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team) return;
    if (!editName.trim()) {
      setTeamModalError("Team name cannot be empty.");
      return;
    }
    if (!editUsername.trim() || editUsername.trim().length < 3) {
      setTeamModalError("Username must be at least 3 characters.");
      return;
    }

    setSavingTeam(true);
    setTeamModalError(null);
    try {
      const updated = await adminApi.updateTeam(team.id, {
        name: editName.trim(),
        username: editUsername.trim(),
        isActive: editIsActive,
      });
      setTeam((prev) =>
        prev
          ? {
              ...prev,
              name: updated.name,
              username: updated.username,
              isActive: updated.isActive,
            }
          : null,
      );
      setSuccess(`Team "${updated.name}" updated successfully.`);
      setEditTeamOpen(false);
    } catch (err) {
      setTeamModalError(getErrorMessage(err, "Failed to update team details."));
    } finally {
      setSavingTeam(false);
    }
  };

  // Open Edit Participant Modal
  const openEditParticipant = (p: Participant) => {
    setEditingParticipant(p);
    setPartName(p.name);
    setPartHotelNo(p.hotelNo ?? "");
    setPartRoomName(p.roomName ?? "");
    setPartModalError(null);
  };

  const handleSaveParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team || !editingParticipant) return;
    if (!partName.trim()) {
      setPartModalError("Participant name is required.");
      return;
    }

    setSavingPart(true);
    setPartModalError(null);
    try {
      const updated = await adminApi.updateParticipant(team.id, editingParticipant.id, {
        name: partName.trim(),
        hotelNo: partHotelNo.trim() || undefined,
        roomName: partRoomName.trim() || undefined,
      });

      setTeam((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          participants: prev.participants.map((p) =>
            p.id === updated.id
              ? {
                  ...p,
                  name: updated.name,
                  hotelNo: updated.hotelNo,
                  roomName: updated.roomName,
                }
              : p,
          ),
        };
      });

      setSuccess(`Participant "${updated.name}" details updated.`);
      setEditingParticipant(null);
    } catch (err) {
      setPartModalError(getErrorMessage(err, "Failed to update participant."));
    } finally {
      setSavingPart(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-28 w-full" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          size="sm"
          className="rounded-xl"
          nativeButton={false}
          render={<Link href="/admin/teams" />}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span>Back to Teams</span>
        </Button>
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-destructive">Team not found</CardTitle>
            <CardDescription>{error ?? "The requested team profile could not be loaded."}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => void loadTeam()} variant="outline" className="rounded-xl">
              <RefreshCw className="size-4" aria-hidden="true" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="rounded-xl"
          nativeButton={false}
          render={<Link href="/admin/teams" />}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span>Back to Teams</span>
        </Button>
        <div className="flex items-center gap-2">
          <Button
            onClick={openEditTeam}
            size="sm"
            variant="outline"
            className="rounded-xl font-medium"
          >
            <Pencil className="size-3.5 mr-1.5" />
            Edit Team
          </Button>
          <Button
            onClick={() => setDeleteConfirmOpen(true)}
            size="sm"
            variant="outline"
            className="rounded-xl font-medium text-destructive hover:text-destructive border-destructive/20 hover:bg-destructive/10"
          >
            <Trash2 className="size-3.5 mr-1.5" />
            Delete Team
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => void loadTeam()}
            disabled={loading}
          >
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} aria-hidden="true" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {error ? <ErrorBanner message={error} /> : null}
      {success ? <SuccessBanner message={success} /> : null}

      {/* Team Header */}
      <Card>
        <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-xl font-bold text-primary">
              <UsersRound className="size-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-heading text-2xl font-semibold tracking-tight">
                  {team.name}
                </h1>
                {team.isTopTen ? (
                  <Badge className="bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300">
                    <Trophy className="size-3 mr-1" />
                    Top 10 Finalist
                  </Badge>
                ) : null}
                <Badge variant={team.isActive ? "default" : "secondary"}>
                  {team.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                Username: @{team.username} • ID: {team.id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="size-4" aria-hidden="true" />
            <span>
              Registered{" "}
              {new Date(team.createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Participants & Room Assignments */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading text-lg">
              <UserRound className="size-5 text-primary" aria-hidden="true" />
              Participants & Room Assignments ({team.participants.length})
            </CardTitle>
            <CardDescription>
              Registered team members, accommodation hotel, and assigned dorm rooms.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {team.participants.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Participant Name</TableHead>
                    <TableHead>Hotel / Accommodation</TableHead>
                    <TableHead>Room Name / No.</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {team.participants.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                            {p.name.charAt(0).toUpperCase()}
                          </div>
                          <span>{p.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {p.hotelNo ? (
                          <div className="flex items-center gap-1.5 text-xs">
                            <Hotel className="size-3.5 text-muted-foreground" aria-hidden="true" />
                            <span>{p.hotelNo}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {p.roomName ? (
                          <Badge variant="outline" className="font-mono text-xs">
                            {p.roomName}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          onClick={() => openEditParticipant(p)}
                          size="xs"
                          variant="ghost"
                          className="h-7 px-2 text-xs"
                          title="Edit participant details"
                        >
                          <Pencil className="size-3.5 mr-1" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-6 text-center text-xs text-muted-foreground">
                No participants registered for this team yet.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assigned Panels & Rounds */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading text-lg">
              <Layers className="size-5 text-primary" aria-hidden="true" />
              Evaluation Panels
            </CardTitle>
            <CardDescription>Panels assigned to review this team</CardDescription>
          </CardHeader>
          <CardContent>
            {team.panelTeams && team.panelTeams.length > 0 ? (
              <div className="space-y-3">
                {team.panelTeams.map((pt, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border bg-muted/30 p-3.5 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{pt.panel.name}</p>
                      <Badge variant="outline" className="text-[10px]">
                        {pt.panel.round.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Round: <span className="font-medium text-foreground">{pt.panel.round.name}</span> ({pt.panel.round.type})
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-muted-foreground">
                This team has not been scheduled into any evaluation panels yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Project Submission Card */}
      {(() => {
        const activeSubmission = submission ?? team.submission;
        return (
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 font-heading text-lg">
                  <FileCode2 className="size-5 text-primary" aria-hidden="true" />
                  Hackathon Submission
                </CardTitle>
                <CardDescription>
                  Project statement, solution pitch, and code/deployment links submitted by this team.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => void fetchTeamSubmission(team.id)}
                  disabled={fetchingSubmission}
                  size="sm"
                  variant="outline"
                  className="rounded-xl h-8 text-xs font-medium"
                >
                  <RefreshCw className={cn("size-3.5 mr-1.5", fetchingSubmission && "animate-spin")} />
                  <span>Refresh Submission</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl h-8 text-xs font-medium"
                  nativeButton={false}
                  render={<Link href="/admin/submissions" />}
                >
                  <span>All Submissions</span>
                  <ExternalLink className="size-3 ml-1 text-muted-foreground" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {activeSubmission ? (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Problem Statement
                    </h2>
                    <p className="mt-1 text-sm text-foreground whitespace-pre-wrap bg-muted/20 p-3 rounded-xl border border-border/50">
                      {activeSubmission.problemStatement ?? "No problem statement provided."}
                    </p>
                  </div>

                  <div>
                    <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Proposed Solution
                    </h2>
                    <p className="mt-1 text-sm text-foreground whitespace-pre-wrap bg-muted/20 p-3 rounded-xl border border-border/50">
                      {activeSubmission.solution ?? "No solution description provided."}
                    </p>
                  </div>

                  <div className="border-t pt-3 flex flex-wrap gap-3">
                    {activeSubmission.githubRepoLink ? (
                      <a
                        href={activeSubmission.githubRepoLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                      >
                        <FolderGit2 className="size-3.5 text-primary" aria-hidden="true" />
                        <span>GitHub Repository</span>
                        <ExternalLink className="size-3 text-muted-foreground" />
                      </a>
                    ) : null}

                    {activeSubmission.deploymentLink ? (
                      <a
                        href={activeSubmission.deploymentLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                      >
                        <Link2 className="size-3.5 text-primary" aria-hidden="true" />
                        <span>Live Deployment</span>
                        <ExternalLink className="size-3 text-muted-foreground" />
                      </a>
                    ) : null}

                    {activeSubmission.driveLink ? (
                      <a
                        href={activeSubmission.driveLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                      >
                        <Link2 className="size-3.5 text-primary" aria-hidden="true" />
                        <span>Drive / Presentation Link</span>
                        <ExternalLink className="size-3 text-muted-foreground" />
                      </a>
                    ) : null}
                  </div>

                  <div className="border-t pt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>
                      Submitted on: {new Date(activeSubmission.submittedAt).toLocaleString()}
                    </span>
                    {"id" in activeSubmission && activeSubmission.id ? (
                      <span className="font-mono text-[11px]">
                        Submission ID: {activeSubmission.id}
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  <p>No final submission recorded for this team yet.</p>
                  <Button
                    onClick={() => void fetchTeamSubmission(team.id)}
                    disabled={fetchingSubmission}
                    size="sm"
                    variant="ghost"
                    className="mt-2 text-xs"
                  >
                    <RefreshCw className={cn("size-3 mr-1", fetchingSubmission && "animate-spin")} />
                    Check for submission
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })()}

      {/* Edit Team Dialog */}
      <Dialog onOpenChange={setEditTeamOpen} open={editTeamOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Pencil className="size-5 text-primary" />
              <DialogTitle>Update Team Details</DialogTitle>
            </div>
            <DialogDescription>
              Modify the team name, username handle, or account active status.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4 pt-2" onSubmit={handleSaveTeam}>
            {teamModalError ? <ErrorBanner message={teamModalError} /> : null}

            <div className="space-y-1.5">
              <Label htmlFor="edit-team-name">Team Name *</Label>
              <Input
                id="edit-team-name"
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Team name"
                required
                value={editName}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-team-username">Username * (min. 3 characters)</Label>
              <Input
                id="edit-team-username"
                onChange={(e) => setEditUsername(e.target.value)}
                placeholder="Username handle"
                required
                value={editUsername}
              />
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <Checkbox
                checked={editIsActive}
                id="edit-team-active"
                onCheckedChange={(checked) => setEditIsActive(Boolean(checked))}
              />
              <Label
                className="text-sm font-normal cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                htmlFor="edit-team-active"
              >
                Team is active and eligible for evaluations
              </Label>
            </div>

            <DialogFooter className="pt-2">
              <Button onClick={() => setEditTeamOpen(false)} type="button" variant="outline">
                Cancel
              </Button>
              <Button disabled={savingTeam} type="submit">
                {savingTeam ? "Saving…" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Participant Dialog */}
      <Dialog
        onOpenChange={(open) => !open && setEditingParticipant(null)}
        open={Boolean(editingParticipant)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Pencil className="size-5 text-primary" />
              <DialogTitle>Update Participant Details</DialogTitle>
            </div>
            <DialogDescription>
              Edit participant name, hotel accommodation, and assigned room.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4 pt-2" onSubmit={handleSaveParticipant}>
            {partModalError ? <ErrorBanner message={partModalError} /> : null}

            <div className="space-y-1.5">
              <Label htmlFor="part-name">Participant Name *</Label>
              <Input
                id="part-name"
                onChange={(e) => setPartName(e.target.value)}
                placeholder="Full name"
                required
                value={partName}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="part-hotel">Hotel / Accommodation (optional)</Label>
              <Input
                id="part-hotel"
                onChange={(e) => setPartHotelNo(e.target.value)}
                placeholder="e.g. Hotel Grand Palace"
                value={partHotelNo}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="part-room">Room Name / No. (optional)</Label>
              <Input
                id="part-room"
                onChange={(e) => setPartRoomName(e.target.value)}
                placeholder="e.g. Room 205"
                value={partRoomName}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                onClick={() => setEditingParticipant(null)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button disabled={savingPart} type="submit">
                {savingPart ? "Saving…" : "Save Details"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Team Confirmation Dialog */}
      <ConfirmDialog
        confirmLabel="Delete Team"
        description={
          team
            ? `Are you sure you want to permanently delete "${team.name}"? This action cannot be undone and will cascade delete all associated participants, panel assignments, and submissions.`
            : ""
        }
        onConfirm={handleDeleteTeam}
        onOpenChange={setDeleteConfirmOpen}
        open={deleteConfirmOpen}
        pending={deleting}
        title="Delete Team"
      />
    </div>
  );
}
