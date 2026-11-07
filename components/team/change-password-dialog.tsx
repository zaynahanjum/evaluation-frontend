"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";

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
import { teamApi } from "@/lib/team/api";

type ChangePasswordDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isForced?: boolean;
  onSuccess?: () => void;
};

export function ChangePasswordDialog({
  open,
  onOpenChange,
  isForced = false,
  onSuccess,
}: ChangePasswordDialogProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("New password must be different from current password.");
      return;
    }

    setIsSubmitting(true);
    try {
      const msg = await teamApi.changePassword(currentPassword, newPassword);
      setSuccess(msg);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onSuccess?.();
      setTimeout(() => {
        onOpenChange(false);
        setSuccess(null);
      }, 1500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to change password.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isForced && !success) return; // Prevent closing if forced first login
        onOpenChange(nextOpen);
        if (!nextOpen) {
          setError(null);
          setSuccess(null);
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div>
              <DialogTitle>
                {isForced ? "Action Required: Change Password" : "Change Team Password"}
              </DialogTitle>
              <DialogDescription>
                {isForced
                  ? "For security, you must update your default password on first login."
                  : "Update your team credentials used to access this dashboard."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error ? (
            <p
              className="rounded-xl bg-destructive/10 px-4 py-2.5 text-xs text-destructive font-medium"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          {success ? (
            <p
              className="rounded-xl bg-primary/10 px-4 py-2.5 text-xs text-primary font-medium"
              role="status"
            >
              {success}
            </p>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="current-password">Current Password</Label>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              disabled={isSubmitting || Boolean(success)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-password">New Password (min. 6 characters)</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={isSubmitting || Boolean(success)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              placeholder="Repeat new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isSubmitting || Boolean(success)}
            />
          </div>

          <DialogFooter className="pt-2">
            {!isForced ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            ) : null}
            <Button type="submit" disabled={isSubmitting || Boolean(success)}>
              {isSubmitting ? (
                <LoaderCircle className="size-4 animate-spin mr-1.5" />
              ) : null}
              {isSubmitting ? "Updating..." : "Update Password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

