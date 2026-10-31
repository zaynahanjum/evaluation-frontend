"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Check,
  ExternalLink,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Trophy,
  UserCheck,
  UserPlus,
  UsersRound,
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
import type { ParticipantInput, TeamSummary } from "@/lib/api/types";

type Filter = "ALL" | "TOP10" | "ACTIVE";

export default function TeamsPage() {
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");

  // Create Team Dialog State
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createUsername, setCreateUsername] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [participants, setParticipants] = useState<ParticipantInput[]>([
    { name: "", hotelNo: "", roomName: "" },
  ]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Top 10 Selection Dialog State
  const [top10Open, setTop10Open] = useState(false);
  const [selectedTop10Ids, setSelectedTop10Ids] = useState<string[]>([]);
  const [modalSearch, setModalSearch] = useState("");
  const [savingTop10, setSavingTop10] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Delete Team State
  const [deleteTeamModal, setDeleteTeamModal] = useState<TeamSummary | null>(null);
  const [deletingTeam, setDeletingTeam] = useState(false);

  const handleDeleteTeam = async () => {
    if (!deleteTeamModal) return;
    setDeletingTeam(true);
    try {
      const res = await adminApi.deleteTeam(deleteTeamModal.id);
      setSuccess(res.message || `Team "${deleteTeamModal.name}" deleted.`);
      setDeleteTeamModal(null);
      await loadTeams();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete team."));
      setDeleteTeamModal(null);
    } finally {
      setDeletingTeam(false);
    }
  };

  const loadTeams = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.listTeams();
      setTeams(data);
    } catch (err) {
      setTeams([]);
      setError(getErrorMessage(err, "Could not load teams."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadTeams();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadTeams]);

  // Create Team handlers
  const openCreateModal = () => {
    setCreateName("");
    setCreateUsername("");
    setCreatePassword("");
    setParticipants([{ name: "", hotelNo: "", roomName: "" }]);
    setCreateError(null);
    setCreateOpen(true);
  };

  const addParticipantRow = () => {
    setParticipants((prev) => [...prev, { name: "", hotelNo: "", roomName: "" }]);
  };

  const updateParticipantRow = (
    index: number,
    field: keyof ParticipantInput,
    value: string,
  ) => {
    setParticipants((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeParticipantRow = (index: number) => {
    if (participants.length <= 1) return;
    setParticipants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) {
      setCreateError("Team name is required.");
      return;
    }
    if (!createUsername.trim() || createUsername.trim().length < 3) {
      setCreateError("Username must be at least 3 characters.");
      return;
    }
    if (!createPassword || createPassword.length < 6) {
      setCreateError("Password must be at least 6 characters.");
      return;
    }
    const validParticipants = participants.map((p) => ({
      name: p.name.trim(),
      hotelNo: p.hotelNo?.trim() || undefined,
      roomName: p.roomName?.trim() || undefined,
    }));
    if (validParticipants.some((p) => !p.name)) {
      setCreateError("All participant rows must have a valid name.");
      return;
    }
    if (validParticipants.length === 0) {
      setCreateError("At least one participant is required.");
      return;
    }

    setCreating(true);
    setCreateError(null);
    try {
      const newTeam = await adminApi.createTeam({
        name: createName.trim(),
        username: createUsername.trim(),
        password: createPassword,
        participants: validParticipants,
      });
      setSuccess(
        `Team "${newTeam.name}" registered successfully with ${newTeam.participants.length} participant(s).`,
      );
      setCreateOpen(false);
      await loadTeams();
    } catch (err) {
      setCreateError(getErrorMessage(err, "Failed to register team."));
    } finally {
      setCreating(false);
    }
  };

  // Top 10 handlers
  const openTop10Modal = () => {
    const currentTop10 = teams.filter((t) => t.isTopTen).map((t) => t.id);
    setSelectedTop10Ids(currentTop10);
    setModalSearch("");
    setModalError(null);
    setTop10Open(true);
  };

  const toggleTeamSelection = (teamId: string) => {
    setSelectedTop10Ids((prev) => {
      if (prev.includes(teamId)) {
        return prev.filter((id) => id !== teamId);
      }
      if (prev.length >= 10) {
        setModalError("You can select at most 10 finalist teams.");
        return prev;
      }
      setModalError(null);
      return [...prev, teamId];
    });
  };

  const handleSaveTop10 = async () => {
    if (selectedTop10Ids.length === 0) {
      setModalError("Please select at least 1 team (up to 10).");
      return;
    }
    if (selectedTop10Ids.length > 10) {
      setModalError("You can select at most 10 teams.");
      return;
    }
    setSavingTop10(true);
    setModalError(null);
    try {
      const res = await adminApi.setTop10Teams(selectedTop10Ids);
      setSuccess(res.message || `${selectedTop10Ids.length} team(s) marked as top 10 finalists.`);
      setTop10Open(false);
      await loadTeams();
    } catch (err) {
      setModalError(getErrorMessage(err, "Failed to update top 10 teams."));
    } finally {
      setSavingTop10(false);
    }
  };

  const visibleTeams = useMemo(() => {
    return teams.filter((t) => {
      if (filter === "TOP10" && !t.isTopTen) return false;
      if (filter === "ACTIVE" && !t.isActive) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        t.name.toLowerCase().includes(q) ||
        t.username.toLowerCase().includes(q)
      );
    });
  }, [teams, filter, search]);

  const modalFilteredTeams = useMemo(() => {
    if (!modalSearch.trim()) return teams;
    const q = modalSearch.toLowerCase();
    return teams.filter(
      (t) => t.name.toLowerCase().includes(q) || t.username.toLowerCase().includes(q),
    );
  }, [teams, modalSearch]);

  return (
    <div className="space-y-4">
      <PageHeader
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={openCreateModal}
              size="sm"
              className="font-medium shadow-xs"
            >
              <Plus className="size-4 mr-1.5" />
              Register Team
            </Button>
            <Button
              onClick={openTop10Modal}
              size="sm"
              variant="outline"
              className="border-amber-400 text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950/40 font-medium"
            >
              <Trophy className="size-4 mr-1.5 text-amber-500" />
              Set Top 10 Finalists
            </Button>
          </div>
        }
        description="Register teams, manage participants, room assignments, and finalist qualifications."
        title="Teams & Participants"
      />

      {error ? <ErrorBanner message={error} /> : null}
      {success ? <SuccessBanner message={success} /> : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setFilter("ALL")}
            size="sm"
            variant={filter === "ALL" ? "default" : "outline"}
          >
            All ({teams.length})
          </Button>
          <Button
            onClick={() => setFilter("TOP10")}
            size="sm"
            variant={filter === "TOP10" ? "default" : "outline"}
          >
            <Trophy className="size-3.5 mr-1" />
            Top 10 ({teams.filter((t) => t.isTopTen).length})
          </Button>
          <Button
            onClick={() => setFilter("ACTIVE")}
            size="sm"
            variant={filter === "ACTIVE" ? "default" : "outline"}
          >
            <UserCheck className="size-3.5 mr-1" />
            Active ({teams.filter((t) => t.isActive).length})
          </Button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search team or username…"
            value={search}
          />
        </div>
      </div>

      {loading ? <TableSkeleton rows={5} /> : null}

      {!loading && visibleTeams.length === 0 ? (
        <EmptyState
          detail="No teams match the current search or filters."
          title="No teams found"
        />
      ) : null}

      {!loading && visibleTeams.length > 0 ? (
        <div className="rounded-2xl ring-1 ring-foreground/10 overflow-hidden bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Leaderboard</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleTeams.map((team) => (
                <TableRow key={team.id}>
                  <TableCell className="font-semibold">
                    <Link
                      href={`/admin/teams/${team.id}`}
                      className="hover:underline text-foreground hover:text-primary transition-colors flex items-center gap-2"
                    >
                      <UsersRound className="size-4 text-muted-foreground" />
                      <span>{team.name}</span>
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    @{team.username}
                  </TableCell>
                  <TableCell>
                    <Badge variant={team.isActive ? "default" : "secondary"}>
                      {team.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {team.isTopTen ? (
                      <Badge className="bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300">
                        <Trophy className="size-3 mr-1" />
                        Top 10 Finalist
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="size-3" />
                      {new Date(team.createdAt).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl"
                        nativeButton={false}
                        render={<Link href={`/admin/teams/${team.id}`} />}
                      >
                        <span>View Profile</span>
                        <ExternalLink className="size-3 ml-1 text-muted-foreground" />
                      </Button>
                      <Button
                        onClick={() => setDeleteTeamModal(team)}
                        size="sm"
                        variant="ghost"
                        className="rounded-xl h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        title="Delete Team"
                      >
                        <Trash2 className="size-3.5" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}

      {/* Register Team Dialog */}
      <Dialog onOpenChange={setCreateOpen} open={createOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <UserPlus className="size-5 text-primary" />
              <DialogTitle>Register New Team</DialogTitle>
            </div>
            <DialogDescription>
              Create a team login account and assign initial participant roster with accommodation details.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4 pt-2" onSubmit={handleCreateTeam}>
            {createError ? <ErrorBanner message={createError} /> : null}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="team-name">Team Name *</Label>
                <Input
                  id="team-name"
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. Team Alpha"
                  required
                  value={createName}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="team-username">Username * (min. 3 chars)</Label>
                <Input
                  id="team-username"
                  onChange={(e) => setCreateUsername(e.target.value)}
                  placeholder="e.g. team_alpha"
                  required
                  value={createUsername}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="team-password">Initial Password * (min. 6 chars)</Label>
              <Input
                id="team-password"
                onChange={(e) => setCreatePassword(e.target.value)}
                placeholder="••••••••"
                required
                type="password"
                value={createPassword}
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-semibold">Team Participants *</Label>
                  <p className="text-xs text-muted-foreground">
                    At least one participant is required. Accommodation details are optional.
                  </p>
                </div>
                <Button
                  onClick={addParticipantRow}
                  size="sm"
                  type="button"
                  variant="outline"
                  className="h-8 text-xs"
                >
                  <Plus className="size-3.5 mr-1" />
                  Add Participant
                </Button>
              </div>

              <div className="space-y-3 pt-1">
                {participants.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 rounded-xl border border-border bg-muted/20"
                  >
                    <div className="flex-1 w-full space-y-1">
                      <Label className="text-[11px] text-muted-foreground">
                        Participant #{idx + 1} Name *
                      </Label>
                      <Input
                        className="h-8 text-xs"
                        onChange={(e) => updateParticipantRow(idx, "name", e.target.value)}
                        placeholder="e.g. Alice Smith"
                        required
                        value={p.name}
                      />
                    </div>

                    <div className="w-full sm:w-36 space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Hotel (optional)</Label>
                      <Input
                        className="h-8 text-xs"
                        onChange={(e) => updateParticipantRow(idx, "hotelNo", e.target.value)}
                        placeholder="e.g. Hotel Grand"
                        value={p.hotelNo ?? ""}
                      />
                    </div>

                    <div className="w-full sm:w-28 space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Room (optional)</Label>
                      <Input
                        className="h-8 text-xs"
                        onChange={(e) => updateParticipantRow(idx, "roomName", e.target.value)}
                        placeholder="e.g. Room 101"
                        value={p.roomName ?? ""}
                      />
                    </div>

                    <div className="self-end sm:self-center sm:pt-4">
                      <Button
                        disabled={participants.length <= 1}
                        onClick={() => removeParticipantRow(idx)}
                        size="sm"
                        type="button"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        title="Remove participant"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button onClick={() => setCreateOpen(false)} type="button" variant="outline">
                Cancel
              </Button>
              <Button disabled={creating} type="submit">
                {creating ? "Registering…" : "Register Team"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Set Top 10 Finalists Dialog */}
      <Dialog onOpenChange={setTop10Open} open={top10Open}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Trophy className="size-5 text-amber-500" />
              <DialogTitle>Set Top 10 Finalists</DialogTitle>
            </div>
            <DialogDescription>
              Select up to 10 finalist teams to advance to final round judging. Saving updates the official finalists list.
            </DialogDescription>
          </DialogHeader>

          {modalError ? <ErrorBanner message={modalError} /> : null}

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <Badge
                className={
                  selectedTop10Ids.length === 10
                    ? "bg-amber-500/15 text-amber-700 border-amber-400 dark:text-amber-300"
                    : ""
                }
                variant="outline"
              >
                {selectedTop10Ids.length} of 10 teams selected
              </Badge>

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    const topActive = teams.filter((t) => t.isActive).slice(0, 10).map((t) => t.id);
                    setSelectedTop10Ids(topActive);
                    setModalError(null);
                  }}
                  size="sm"
                  type="button"
                  variant="ghost"
                  className="text-xs h-7"
                >
                  <Sparkles className="size-3 mr-1" />
                  Select First 10 Active
                </Button>
                <Button
                  onClick={() => {
                    setSelectedTop10Ids([]);
                    setModalError(null);
                  }}
                  size="sm"
                  type="button"
                  variant="ghost"
                  className="text-xs h-7 text-muted-foreground"
                >
                  Clear All
                </Button>
              </div>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-8 text-xs h-8"
                onChange={(e) => setModalSearch(e.target.value)}
                placeholder="Filter teams list…"
                value={modalSearch}
              />
            </div>

            <div className="max-h-64 overflow-y-auto space-y-1 rounded-xl border border-border p-2 bg-muted/20">
              {modalFilteredTeams.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No matching teams found.
                </p>
              ) : (
                modalFilteredTeams.map((team) => {
                  const isSelected = selectedTop10Ids.includes(team.id);
                  const isMaxReached = selectedTop10Ids.length >= 10 && !isSelected;

                  return (
                    <div
                      key={team.id}
                      onClick={() => !isMaxReached && toggleTeamSelection(team.id)}
                      className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-sm transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-amber-500/10 border border-amber-500/30 dark:bg-amber-500/15"
                          : isMaxReached
                          ? "opacity-40 cursor-not-allowed"
                          : "hover:bg-accent/60"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Checkbox
                          checked={isSelected}
                          disabled={isMaxReached}
                          id={`team-${team.id}`}
                          onCheckedChange={() => toggleTeamSelection(team.id)}
                        />
                        <Label
                          className="cursor-pointer font-medium text-xs leading-none"
                          htmlFor={`team-${team.id}`}
                        >
                          {team.name}
                          <span className="ml-1.5 font-mono text-[11px] text-muted-foreground font-normal">
                            @{team.username}
                          </span>
                        </Label>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {team.isTopTen ? (
                          <Badge className="text-[10px] h-4.5 px-1.5 bg-amber-500/10 text-amber-700 dark:text-amber-300" variant="outline">
                            Current Finalist
                          </Badge>
                        ) : null}
                        {isSelected && (
                          <Check className="size-3.5 text-amber-600 dark:text-amber-400" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              onClick={() => setTop10Open(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={savingTop10 || selectedTop10Ids.length === 0}
              onClick={handleSaveTop10}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {savingTop10
                ? "Saving…"
                : `Save Top 10 Finalists (${selectedTop10Ids.length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Team Confirmation Dialog */}
      <ConfirmDialog
        confirmLabel="Delete Team"
        description={
          deleteTeamModal
            ? `Are you sure you want to permanently delete "${deleteTeamModal.name}"? This action cannot be undone and will cascade delete all participants, panel assignments, and submissions.`
            : ""
        }
        onConfirm={handleDeleteTeam}
        onOpenChange={(open) => !open && setDeleteTeamModal(null)}
        open={Boolean(deleteTeamModal)}
        pending={deletingTeam}
        title="Delete Team"
      />
    </div>
  );
}
