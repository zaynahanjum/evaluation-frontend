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
import {
  validatePassword,
  validateRole,
  validateUsername,
} from "@/lib/admin/validation";
import { getErrorMessage } from "@/lib/api/errors";
import type { EvaluatorRole, StaffUser } from "@/lib/api/types";

type RoleFilter = "ALL" | EvaluatorRole;
type UserFormMode = "create" | "edit" | "password";

export default function UsersPage() {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [pending, setPending] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<UserFormMode>("create");
  const [selected, setSelected] = useState<StaffUser | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<EvaluatorRole>("MENTOR");
  const [formError, setFormError] = useState<string | null>(null);

  const [confirm, setConfirm] = useState<{
    user: StaffUser;
    action: "delete" | "deactivate" | "activate";
  } | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.listUsers(
        roleFilter === "ALL" ? undefined : roleFilter,
      );
      setUsers(data);
    } catch (err) {
      setUsers([]);
      setError(getErrorMessage(err, "Could not load mentors and judges."));
    } finally {
      setLoading(false);
    }
  }, [roleFilter]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const visibleUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) => user.username.toLowerCase().includes(query));
  }, [users, search]);

  function openCreate() {
    setFormMode("create");
    setSelected(null);
    setUsername("");
    setPassword("");
    setRole("MENTOR");
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(user: StaffUser) {
    setFormMode("edit");
    setSelected(user);
    setUsername(user.username);
    setPassword("");
    setRole(user.role);
    setFormError(null);
    setFormOpen(true);
  }

  function openPassword(user: StaffUser) {
    setFormMode("password");
    setSelected(user);
    setUsername(user.username);
    setPassword("");
    setFormError(null);
    setFormOpen(true);
  }

  async function submitForm() {
    setFormError(null);
    if (formMode === "create") {
      const usernameError = validateUsername(username);
      const passwordError = validatePassword(password, true);
      if (usernameError || passwordError || !validateRole(role)) {
        setFormError(usernameError ?? passwordError ?? "Role must be MENTOR or JUDGE.");
        return;
      }
      setPending(true);
      try {
        await adminApi.createUser({
          username: username.trim(),
          password,
          role,
        });
        setSuccess(`${role === "MENTOR" ? "Mentor" : "Judge"} account created.`);
        setFormOpen(false);
        await loadUsers();
      } catch (err) {
        setFormError(getErrorMessage(err, "Could not create the account."));
      } finally {
        setPending(false);
      }
      return;
    }

    if (!selected) return;

    if (formMode === "edit") {
      const usernameError = validateUsername(username);
      if (usernameError) {
        setFormError(usernameError);
        return;
      }
      setPending(true);
      try {
        await adminApi.updateUser(selected.id, { username: username.trim() });
        setSuccess("Account details updated.");
        setFormOpen(false);
        await loadUsers();
      } catch (err) {
        setFormError(getErrorMessage(err, "Could not update the account."));
      } finally {
        setPending(false);
      }
      return;
    }

    const passwordError = validatePassword(password, true);
    if (passwordError) {
      setFormError(passwordError);
      return;
    }
    setPending(true);
    try {
      await adminApi.updateUser(selected.id, {
        password,
        mustChangePassword: true,
      });
      setSuccess("Password reset. The user must change it on next login if required.");
      setFormOpen(false);
      await loadUsers();
    } catch (err) {
      setFormError(getErrorMessage(err, "Could not reset the password."));
    } finally {
      setPending(false);
    }
  }

  async function confirmAction() {
    if (!confirm) return;
    setPending(true);
    setError(null);
    try {
      if (confirm.action === "delete") {
        await adminApi.deleteUser(confirm.user.id);
        setSuccess("Account deleted.");
      } else {
        const isActive = confirm.action === "activate";
        await adminApi.updateUser(confirm.user.id, { isActive });
        setSuccess(isActive ? "Account activated." : "Account deactivated.");
      }
      setConfirm(null);
      await loadUsers();
    } catch (err) {
      setError(getErrorMessage(err, "The account action could not be completed."));
      setConfirm(null);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        actions={<Button onClick={openCreate}>Add mentor or judge</Button>}
        description="Accounts are loaded from GET /admin/users. Role can be MENTOR or JUDGE. Role cannot be changed after creation."
        title="Mentors & judges"
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          className="sm:max-w-xs"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by username"
          value={search}
        />
        <select
          className="h-9 rounded-4xl border border-input bg-input/30 px-3 text-sm"
          onChange={(event) => setRoleFilter(event.target.value as RoleFilter)}
          value={roleFilter}
        >
          <option value="ALL">All roles</option>
          <option value="MENTOR">Mentors</option>
          <option value="JUDGE">Judges</option>
        </select>
        <Button onClick={() => void loadUsers()} type="button" variant="outline">
          Refresh
        </Button>
      </div>

      {success ? <SuccessBanner message={success} /> : null}
      {error ? <ErrorBanner message={error} /> : null}
      {loading ? <TableSkeleton /> : null}

      {!loading && !error && visibleUsers.length === 0 ? (
        <EmptyState
          detail="Create a mentor or judge, or clear the current search and role filters."
          title="No accounts found"
        />
      ) : null}

      {!loading && visibleUsers.length > 0 ? (
        <div className="rounded-2xl ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Password</TableHead>
                <TableHead>Panels</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === "JUDGE" ? "default" : "secondary"}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? "outline" : "destructive"}>
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.mustChangePassword ? "Must change" : "Set"}
                  </TableCell>
                  <TableCell>
                    {user.panelMembers?.length
                      ? user.panelMembers
                          .map((member) => member.panel.name)
                          .join(", ")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => openEdit(user)} size="sm" variant="outline">
                        Edit
                      </Button>
                      <Button onClick={() => openPassword(user)} size="sm" variant="outline">
                        Reset password
                      </Button>
                      <Button
                        onClick={() =>
                          setConfirm({
                            user,
                            action: user.isActive ? "deactivate" : "activate",
                          })
                        }
                        size="sm"
                        variant="outline"
                      >
                        {user.isActive ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        onClick={() => setConfirm({ user, action: "delete" })}
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

      <Dialog onOpenChange={setFormOpen} open={formOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {formMode === "create"
                ? "Add mentor or judge"
                : formMode === "edit"
                  ? "Edit account"
                  : "Reset password"}
            </DialogTitle>
            <DialogDescription>
              {formMode === "create"
                ? "Username 3–50 characters. Password at least 6 characters. Role is MENTOR or JUDGE."
                : formMode === "edit"
                  ? "The backend does not allow changing role after creation."
                  : "Sets a new password (minimum 6 characters) and requires a password change."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {formMode !== "password" ? (
              <div className="space-y-2">
                <Label htmlFor="user-username">Username</Label>
                <Input
                  id="user-username"
                  onChange={(event) => setUsername(event.target.value)}
                  value={username}
                />
              </div>
            ) : null}
            {formMode === "create" || formMode === "password" ? (
              <div className="space-y-2">
                <Label htmlFor="user-password">Password</Label>
                <Input
                  id="user-password"
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  value={password}
                />
              </div>
            ) : null}
            {formMode === "create" ? (
              <div className="space-y-2">
                <Label htmlFor="user-role">Role</Label>
                <select
                  className="h-9 w-full rounded-4xl border border-input bg-input/30 px-3 text-sm"
                  id="user-role"
                  onChange={(event) => setRole(event.target.value as EvaluatorRole)}
                  value={role}
                >
                  <option value="MENTOR">MENTOR</option>
                  <option value="JUDGE">JUDGE</option>
                </select>
              </div>
            ) : null}
            {formError ? <ErrorBanner message={formError} /> : null}
          </div>
          <DialogFooter>
            <Button onClick={() => setFormOpen(false)} type="button" variant="outline">
              Cancel
            </Button>
            <Button disabled={pending} onClick={() => void submitForm()} type="button">
              {pending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        confirmLabel={
          confirm?.action === "delete"
            ? "Delete"
            : confirm?.action === "deactivate"
              ? "Deactivate"
              : "Activate"
        }
        description={
          confirm
            ? confirm.action === "delete"
              ? `Delete ${confirm.user.username}? This cannot be undone.`
              : `${confirm.action === "deactivate" ? "Deactivate" : "Activate"} ${confirm.user.username}?`
            : ""
        }
        onConfirm={() => void confirmAction()}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
        open={Boolean(confirm)}
        pending={pending}
        title="Confirm account action"
      />
    </div>
  );
}
