"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { adminApi } from "@/lib/admin/data-source";
import { validatePanelName } from "@/lib/admin/validation";
import { getErrorMessage } from "@/lib/api/errors";
import type { Panel, RoundSummary, StaffUser, TeamSummary } from "@/lib/api/types";

export default function PanelsPage() {
  const [rounds, setRounds] = useState<RoundSummary[]>([]);
  const [roundId, setRoundId] = useState("");
  const [panels, setPanels] = useState<Panel[]>([]);
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [panelName, setPanelName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const [assignPanel, setAssignPanel] = useState<Panel | null>(null);
  const [assignType, setAssignType] = useState<"members" | "teams">("members");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);

  const [removeTarget, setRemoveTarget] = useState<{
    panel: Panel;
    kind: "member" | "team" | "panel";
    id: string;
    label: string;
  } | null>(null);

  const loadBase = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [roundList, userList, teamList] = await Promise.all([
        adminApi.listRounds(),
        adminApi.listUsers(),
        adminApi.listTeams(),
      ]);
      setRounds(roundList);
      setUsers(userList);
      setTeams(teamList);
      setRoundId((current) => current || roundList[0]?.id || "");
    } catch (err) {
      setError(getErrorMessage(err, "Could not load rounds, evaluators, or teams."));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPanels = useCallback(async (id: string) => {
    if (!id) {
      setPanels([]);
      return;
    }
    setError(null);
    try {
      setPanels(await adminApi.listPanels(id));
    } catch (err) {
      setPanels([]);
      setError(getErrorMessage(err, "Could not load panels for this round."));
    }
  }, []);

  useEffect(() => {
    void loadBase();
  }, [loadBase]);

  useEffect(() => {
    if (roundId) void loadPanels(roundId);
  }, [roundId, loadPanels]);

  const selectedRound = rounds.find((round) => round.id === roundId);

  const assignedUserIds = useMemo(() => {
    const ids = new Set<string>();
    for (const panel of panels) {
      for (const member of panel.members) ids.add(member.userId);
    }
    return ids;
  }, [panels]);

  async function createPanel() {
    const nameError = validatePanelName(panelName);
    if (nameError) {
      setFormError(nameError);
      return;
    }
    if (!roundId) {
      setFormError("Select a round first.");
      return;
    }
    setPending(true);
    setFormError(null);
    try {
      await adminApi.createPanel(roundId, panelName.trim());
      setSuccess("Panel created.");
      setCreateOpen(false);
      setPanelName("");
      await loadPanels(roundId);
    } catch (err) {
      setFormError(getErrorMessage(err, "Could not create the panel."));
    } finally {
      setPending(false);
    }
  }

  async function assignMembers() {
    if (!assignPanel || !selectedUserId) {
      setFormError("Choose an evaluator to assign.");
      return;
    }
    if (assignPanel.members.some((member) => member.userId === selectedUserId)) {
      setFormError("That evaluator is already on this panel.");
      return;
    }
    setPending(true);
    setFormError(null);
    try {
      await adminApi.addPanelMember(assignPanel.id, selectedUserId);
      setSuccess("Evaluator assigned to the panel.");
      setAssignPanel(null);
      setSelectedUserId("");
      await loadPanels(roundId);
    } catch (err) {
      setFormError(getErrorMessage(err, "Could not assign the evaluator."));
    } finally {
      setPending(false);
    }
  }

  async function assignTeams() {
    if (!assignPanel || selectedTeamIds.length === 0) {
      setFormError("Select at least one team.");
      return;
    }
    setPending(true);
    setFormError(null);
    try {
      await adminApi.addPanelTeams(assignPanel.id, selectedTeamIds);
      setSuccess("Team(s) assigned to the panel.");
      setAssignPanel(null);
      setSelectedTeamIds([]);
      await loadPanels(roundId);
    } catch (err) {
      setFormError(getErrorMessage(err, "Could not assign teams."));
    } finally {
      setPending(false);
    }
  }

  async function confirmRemove() {
    if (!removeTarget) return;
    setPending(true);
    setError(null);
    try {
      if (removeTarget.kind === "panel") {
        await adminApi.deletePanel(removeTarget.panel.id);
        setSuccess("Panel deleted.");
      } else if (removeTarget.kind === "member") {
        await adminApi.removePanelMember(removeTarget.panel.id, removeTarget.id);
        setSuccess("Evaluator removed from the panel.");
      } else {
        await adminApi.removePanelTeam(removeTarget.panel.id, removeTarget.id);
        setSuccess("Team removed from the panel.");
      }
      setRemoveTarget(null);
      await loadPanels(roundId);
    } catch (err) {
      setError(getErrorMessage(err, "The panel change could not be completed."));
      setRemoveTarget(null);
    } finally {
      setPending(false);
    }
  }

  const availableUsers = users.filter((user) => {
    if (!assignPanel) return true;
    return !assignPanel.members.some((member) => member.userId === user.id);
  });

  const availableTeams = teams.filter((team) => {
    if (!assignPanel) return true;
    return !assignPanel.teams.some((item) => item.teamId === team.id);
  });

  return (
    <div className="space-y-4">
      <PageHeader
        actions={
          <Button disabled={!roundId} onClick={() => setCreateOpen(true)}>
            Create panel
          </Button>
        }
        description="Panels belong to a round. Assign mentors or judges and teams using the real panel endpoints. Duplicate member assignments are blocked."
        title="Panels"
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Label className="sm:w-28" htmlFor="panel-round">
          Round
        </Label>
        <select
          className="h-9 w-full max-w-md rounded-4xl border border-input bg-input/30 px-3 text-sm"
          id="panel-round"
          onChange={(event) => setRoundId(event.target.value)}
          value={roundId}
        >
          {rounds.length === 0 ? <option value="">No rounds available</option> : null}
          {rounds.map((round) => (
            <option key={round.id} value={round.id}>
              {round.name} ({round.type}, {round.status})
            </option>
          ))}
        </select>
        <Button onClick={() => void loadPanels(roundId)} type="button" variant="outline">
          Refresh
        </Button>
      </div>

      {selectedRound ? (
        <p className="text-sm text-muted-foreground">
          Suggested evaluator role for this round type:{" "}
          {selectedRound.type === "JUDGING" ? "JUDGE" : "MENTOR"}. The API accepts
          either MENTOR or JUDGE on any panel.
        </p>
      ) : null}

      {success ? <SuccessBanner message={success} /> : null}
      {error ? <ErrorBanner message={error} /> : null}
      {loading ? <TableSkeleton /> : null}

      {!loading && !error && rounds.length === 0 ? (
        <EmptyState
          detail="Create a round first in Round Management."
          title="No rounds to attach panels to"
        />
      ) : null}

      {!loading && roundId && panels.length === 0 && !error ? (
        <EmptyState
          detail="Create a panel, then assign evaluators and teams."
          title="No panels in this round"
        />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {panels.map((panel) => (
          <Card key={panel.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle>{panel.name}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {panel.members.length} evaluator(s) · {panel.teams.length} team(s)
                </p>
              </div>
              <Button
                onClick={() =>
                  setRemoveTarget({
                    panel,
                    kind: "panel",
                    id: panel.id,
                    label: panel.name,
                  })
                }
                size="sm"
                variant="destructive"
              >
                Delete
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <section>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-medium">Evaluators</h3>
                  <Button
                    onClick={() => {
                      setAssignPanel(panel);
                      setAssignType("members");
                      setSelectedUserId("");
                      setFormError(null);
                    }}
                    size="xs"
                    variant="outline"
                  >
                    Assign
                  </Button>
                </div>
                {panel.members.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No evaluators assigned.</p>
                ) : (
                  <ul className="space-y-2">
                    {panel.members.map((member) => (
                      <li
                        className="flex items-center justify-between gap-2 rounded-xl border border-border px-3 py-2"
                        key={member.id}
                      >
                        <span>
                          {member.user.username}{" "}
                          <Badge variant="secondary">{member.user.role}</Badge>
                        </span>
                        <Button
                          onClick={() =>
                            setRemoveTarget({
                              panel,
                              kind: "member",
                              id: member.userId,
                              label: member.user.username,
                            })
                          }
                          size="xs"
                          variant="outline"
                        >
                          Remove
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              <section>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-medium">Teams</h3>
                  <Button
                    onClick={() => {
                      setAssignPanel(panel);
                      setAssignType("teams");
                      setSelectedTeamIds([]);
                      setFormError(null);
                    }}
                    size="xs"
                    variant="outline"
                  >
                    Assign
                  </Button>
                </div>
                {panel.teams.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No teams assigned.</p>
                ) : (
                  <ul className="space-y-2">
                    {panel.teams.map((item) => (
                      <li
                        className="flex items-center justify-between gap-2 rounded-xl border border-border px-3 py-2"
                        key={item.id}
                      >
                        <span>{item.team.name}</span>
                        <Button
                          onClick={() =>
                            setRemoveTarget({
                              panel,
                              kind: "team",
                              id: item.teamId,
                              label: item.team.name,
                            })
                          }
                          size="xs"
                          variant="outline"
                        >
                          Remove
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog onOpenChange={setCreateOpen} open={createOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create panel</DialogTitle>
            <DialogDescription>
              The panel is created for the selected round. Assign evaluators and teams
              afterwards.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="panel-name">Panel name</Label>
            <Input
              id="panel-name"
              onChange={(event) => setPanelName(event.target.value)}
              value={panelName}
            />
            {formError ? <ErrorBanner message={formError} /> : null}
          </div>
          <DialogFooter>
            <Button onClick={() => setCreateOpen(false)} type="button" variant="outline">
              Cancel
            </Button>
            <Button disabled={pending} onClick={() => void createPanel()} type="button">
              {pending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setAssignPanel(null);
            setFormError(null);
          }
        }}
        open={Boolean(assignPanel)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {assignType === "members" ? "Assign evaluator" : "Assign teams"} to{" "}
              {assignPanel?.name}
            </DialogTitle>
            <DialogDescription>
              {assignType === "members"
                ? "Only evaluators who are not already on this panel are listed."
                : "Already-assigned teams are hidden. The API also skips duplicates."}
            </DialogDescription>
          </DialogHeader>
          {assignType === "members" ? (
            <div className="space-y-2">
              <Label htmlFor="assign-user">Evaluator</Label>
              <select
                className="h-9 w-full rounded-4xl border border-input bg-input/30 px-3 text-sm"
                id="assign-user"
                onChange={(event) => setSelectedUserId(event.target.value)}
                value={selectedUserId}
              >
                <option value="">Select an evaluator</option>
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.username} ({user.role}
                    {assignedUserIds.has(user.id) ? ", on another panel" : ""})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {availableTeams.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  All teams are already assigned to this panel, or no teams exist.
                </p>
              ) : (
                availableTeams.map((team) => {
                  const checked = selectedTeamIds.includes(team.id);
                  return (
                    <label className="flex items-center gap-2 text-sm" key={team.id}>
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) => {
                          setSelectedTeamIds((current) =>
                            value === true
                              ? [...current, team.id]
                              : current.filter((id) => id !== team.id),
                          );
                        }}
                      />
                      {team.name}
                      {team.isTopTen ? " (top 10)" : ""}
                    </label>
                  );
                })
              )}
            </div>
          )}
          {formError ? <ErrorBanner message={formError} /> : null}
          <DialogFooter>
            <Button onClick={() => setAssignPanel(null)} type="button" variant="outline">
              Cancel
            </Button>
            <Button
              disabled={pending}
              onClick={() =>
                void (assignType === "members" ? assignMembers() : assignTeams())
              }
              type="button"
            >
              {pending ? "Saving…" : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        confirmLabel="Remove"
        description={
          removeTarget
            ? `Remove ${removeTarget.label} from ${removeTarget.kind === "panel" ? "this round" : removeTarget.panel.name}?`
            : ""
        }
        onConfirm={() => void confirmRemove()}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null);
        }}
        open={Boolean(removeTarget)}
        pending={pending}
        title="Confirm panel change"
      />
    </div>
  );
}
