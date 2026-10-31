"use client";

import { useCallback, useEffect, useState } from "react";

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminApi } from "@/lib/admin/data-source";
import {
  validateCriterionName,
  validateMaxScore,
  validateRoundName,
  validateRoundNumber,
  validateRoundType,
} from "@/lib/admin/validation";
import { getErrorMessage } from "@/lib/api/errors";
import type { Criterion, RoundSummary, RoundType } from "@/lib/api/types";

function statusVariant(status: RoundSummary["status"]) {
  if (status === "ACTIVE") return "default" as const;
  if (status === "ENDED") return "secondary" as const;
  return "outline" as const;
}

export default function RoundsPage() {
  const [rounds, setRounds] = useState<RoundSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<RoundType>("MENTORING");
  const [roundNumber, setRoundNumber] = useState("1");
  const [formError, setFormError] = useState<string | null>(null);

  const [criteriaRound, setCriteriaRound] = useState<RoundSummary | null>(null);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [criteriaLoading, setCriteriaLoading] = useState(false);
  const [criterionName, setCriterionName] = useState("");
  const [criterionDescription, setCriterionDescription] = useState("");
  const [criterionMax, setCriterionMax] = useState("10");
  const [editingCriterion, setEditingCriterion] = useState<Criterion | null>(null);

  const [confirm, setConfirm] = useState<{
    round: RoundSummary;
    action: "start" | "end" | "delete";
  } | null>(null);
  const [deleteCriterion, setDeleteCriterion] = useState<Criterion | null>(null);

  const loadRounds = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRounds(await adminApi.listRounds());
    } catch (err) {
      setRounds([]);
      setError(getErrorMessage(err, "Could not load rounds."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRounds();
  }, [loadRounds]);

  async function loadCriteria(round: RoundSummary) {
    setCriteriaRound(round);
    setCriteriaLoading(true);
    setFormError(null);
    try {
      setCriteria(await adminApi.listCriteria(round.id));
    } catch (err) {
      setFormError(getErrorMessage(err, "Could not load criteria."));
      setCriteria([]);
    } finally {
      setCriteriaLoading(false);
    }
  }

  async function submitRound() {
    setFormError(null);
    const nameError = validateRoundName(name);
    const numberError = validateRoundNumber(roundNumber);
    if (nameError || numberError || !validateRoundType(type)) {
      setFormError(nameError ?? numberError ?? "Type must be MENTORING or JUDGING.");
      return;
    }
    setPending(true);
    try {
      await adminApi.createRound({
        name: name.trim(),
        type,
        roundNumber: Number(roundNumber),
      });
      setSuccess("Round created.");
      setCreateOpen(false);
      setName("");
      setRoundNumber("1");
      await loadRounds();
    } catch (err) {
      setFormError(getErrorMessage(err, "Could not create the round."));
    } finally {
      setPending(false);
    }
  }

  async function confirmRoundAction() {
    if (!confirm) return;
    setPending(true);
    setError(null);
    try {
      if (confirm.action === "start") await adminApi.startRound(confirm.round.id);
      if (confirm.action === "end") await adminApi.endRound(confirm.round.id);
      if (confirm.action === "delete") await adminApi.deleteRound(confirm.round.id);
      setSuccess(
        confirm.action === "start"
          ? "Round started."
          : confirm.action === "end"
            ? "Round ended."
            : "Round deleted.",
      );
      setConfirm(null);
      await loadRounds();
    } catch (err) {
      setError(getErrorMessage(err, "The round action could not be completed."));
      setConfirm(null);
    } finally {
      setPending(false);
    }
  }

  async function saveCriterion() {
    if (!criteriaRound) return;
    const nameError = validateCriterionName(criterionName);
    const maxError = validateMaxScore(criterionMax);
    if (nameError || maxError) {
      setFormError(nameError ?? maxError);
      return;
    }
    setPending(true);
    setFormError(null);
    try {
      const payload = {
        name: criterionName.trim(),
        description: criterionDescription.trim() || undefined,
        maxScore: Number(criterionMax),
      };
      if (editingCriterion) {
        await adminApi.updateCriteria(editingCriterion.id, payload);
        setSuccess("Criterion updated.");
      } else {
        await adminApi.createCriteria(criteriaRound.id, payload);
        setSuccess("Criterion added.");
      }
      setCriterionName("");
      setCriterionDescription("");
      setCriterionMax("10");
      setEditingCriterion(null);
      await loadCriteria(criteriaRound);
      await loadRounds();
    } catch (err) {
      setFormError(getErrorMessage(err, "Could not save the criterion."));
    } finally {
      setPending(false);
    }
  }

  async function confirmDeleteCriterion() {
    if (!deleteCriterion || !criteriaRound) return;
    setPending(true);
    try {
      await adminApi.deleteCriteria(deleteCriterion.id);
      setSuccess("Criterion deleted.");
      setDeleteCriterion(null);
      await loadCriteria(criteriaRound);
      await loadRounds();
    } catch (err) {
      setFormError(getErrorMessage(err, "Could not delete the criterion."));
      setDeleteCriterion(null);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        actions={<Button onClick={() => setCreateOpen(true)}>Create round</Button>}
        description="Rounds are loaded from GET /admin/rounds. There is no update-round endpoint, so name and type cannot be edited after creation. Criteria are managed per round."
        title="Rounds"
      />

      {success ? <SuccessBanner message={success} /> : null}
      {error ? <ErrorBanner message={error} /> : null}
      {loading ? <TableSkeleton /> : null}

      {!loading && !error && rounds.length === 0 ? (
        <EmptyState
          detail="Create a MENTORING or JUDGING round to get started."
          title="No rounds yet"
        />
      ) : null}

      {!loading && rounds.length > 0 ? (
        <div className="rounded-2xl ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>#</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Panels</TableHead>
                <TableHead>Criteria</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rounds.map((round) => (
                <TableRow key={round.id}>
                  <TableCell className="font-medium">{round.name}</TableCell>
                  <TableCell>{round.roundNumber}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{round.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(round.status)}>{round.status}</Badge>
                  </TableCell>
                  <TableCell>{round._count?.panels ?? 0}</TableCell>
                  <TableCell>{round._count?.criteria ?? 0}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => void loadCriteria(round)}
                        size="sm"
                        variant="outline"
                      >
                        Criteria
                      </Button>
                      {round.status === "PENDING" ? (
                        <Button
                          onClick={() => setConfirm({ round, action: "start" })}
                          size="sm"
                        >
                          Start
                        </Button>
                      ) : null}
                      {round.status === "ACTIVE" ? (
                        <Button
                          onClick={() => setConfirm({ round, action: "end" })}
                          size="sm"
                          variant="outline"
                        >
                          End
                        </Button>
                      ) : null}
                      <Button
                        onClick={() => setConfirm({ round, action: "delete" })}
                        size="sm"
                        variant="destructive"
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}

      <Dialog onOpenChange={setCreateOpen} open={createOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create round</DialogTitle>
            <DialogDescription>
              Required fields: name, type (MENTORING or JUDGING), and a positive round
              number. New rounds start as PENDING.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="round-name">Name</Label>
              <Input
                id="round-name"
                onChange={(event) => setName(event.target.value)}
                value={name}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="round-type">Type</Label>
              <select
                className="h-9 w-full rounded-4xl border border-input bg-input/30 px-3 text-sm"
                id="round-type"
                onChange={(event) => setType(event.target.value as RoundType)}
                value={type}
              >
                <option value="MENTORING">MENTORING</option>
                <option value="JUDGING">JUDGING</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="round-number">Round number</Label>
              <Input
                id="round-number"
                min={1}
                onChange={(event) => setRoundNumber(event.target.value)}
                type="number"
                value={roundNumber}
              />
            </div>
            {formError ? <ErrorBanner message={formError} /> : null}
          </div>
          <DialogFooter>
            <Button onClick={() => setCreateOpen(false)} type="button" variant="outline">
              Cancel
            </Button>
            <Button disabled={pending} onClick={() => void submitRound()} type="button">
              {pending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setCriteriaRound(null);
            setEditingCriterion(null);
            setFormError(null);
          }
        }}
        open={Boolean(criteriaRound)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Criteria for {criteriaRound?.name}</DialogTitle>
            <DialogDescription>
              Each criterion has its own max score. Rankings later use the backend
              average-per-criterion formula, not equal weights unless max scores match.
            </DialogDescription>
          </DialogHeader>
          {criteriaLoading ? <TableSkeleton rows={3} /> : null}
          {formError ? <ErrorBanner message={formError} /> : null}
          {!criteriaLoading && criteria.length === 0 ? (
            <EmptyState
              detail="Add at least one criterion before evaluators can score this round."
              title="No criteria"
            />
          ) : null}
          <ul className="space-y-2">
            {criteria.map((item) => (
              <li
                className="flex items-start justify-between gap-3 rounded-xl border border-border px-3 py-2"
                key={item.id}
              >
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Max {item.maxScore}
                    {item.description ? ` · ${item.description}` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setEditingCriterion(item);
                      setCriterionName(item.name);
                      setCriterionDescription(item.description ?? "");
                      setCriterionMax(String(item.maxScore));
                    }}
                    size="xs"
                    variant="outline"
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={() => setDeleteCriterion(item)}
                    size="xs"
                    variant="destructive"
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          <div className="space-y-2 border-t border-border pt-4">
            <Label>{editingCriterion ? "Edit criterion" : "Add criterion"}</Label>
            <Input
              onChange={(event) => setCriterionName(event.target.value)}
              placeholder="Name"
              value={criterionName}
            />
            <Textarea
              onChange={(event) => setCriterionDescription(event.target.value)}
              placeholder="Description (optional)"
              value={criterionDescription}
            />
            <Input
              min={0.01}
              onChange={(event) => setCriterionMax(event.target.value)}
              placeholder="Max score"
              step="0.01"
              type="number"
              value={criterionMax}
            />
            <div className="flex gap-2">
              <Button disabled={pending} onClick={() => void saveCriterion()} type="button">
                {pending ? "Saving…" : editingCriterion ? "Update" : "Add"}
              </Button>
              {editingCriterion ? (
                <Button
                  onClick={() => {
                    setEditingCriterion(null);
                    setCriterionName("");
                    setCriterionDescription("");
                    setCriterionMax("10");
                  }}
                  type="button"
                  variant="outline"
                >
                  Cancel edit
                </Button>
              ) : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        confirmLabel={
          confirm?.action === "delete"
            ? "Delete"
            : confirm?.action === "start"
              ? "Start round"
              : "End round"
        }
        description={
          confirm
            ? `${confirm.action === "start" ? "Start" : confirm.action === "end" ? "End" : "Delete"} ${confirm.round.name}?`
            : ""
        }
        onConfirm={() => void confirmRoundAction()}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
        open={Boolean(confirm)}
        pending={pending}
        title="Confirm round action"
      />

      <ConfirmDialog
        confirmLabel="Delete"
        description={
          deleteCriterion
            ? `Delete criterion “${deleteCriterion.name}”? Existing scores for it will be removed by the database cascade.`
            : ""
        }
        onConfirm={() => void confirmDeleteCriterion()}
        onOpenChange={(open) => {
          if (!open) setDeleteCriterion(null);
        }}
        open={Boolean(deleteCriterion)}
        pending={pending}
        title="Delete criterion"
      />
    </div>
  );
}
