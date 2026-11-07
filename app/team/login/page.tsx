"use client";

import { useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  UserRound,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { teamApi } from "@/lib/team/api";

export default function TeamLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSignIn(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await teamApi.login(username, password);
      router.replace("/team");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "We could not sign your team in. Check credentials and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-linear-to-br from-foreground/20 via-background to-primary/20 px-4 py-10 text-foreground">
      {/* Background Decorative Mesh & Glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[48px_48px] opacity-30 mask-[radial-gradient(ellipse_at_center,black_10%,transparent_75%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 z-0 size-128 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 -bottom-48 z-0 size-120 rounded-full bg-muted/70 blur-3xl"
      />

      <section className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-card p-8 shadow-2xl shadow-foreground/10 sm:p-10">
        <div className="mb-8">
          <div className="mb-8 flex items-center justify-between gap-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                {"</>"}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Devhack</p>
                <p className="text-xs text-muted-foreground">SOSC</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-semibold text-muted-foreground">
              <Users className="size-3.5 text-primary" />
              <span>Team Portal</span>
            </div>
          </div>
          <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-card-foreground sm:text-4xl">
            Team Sign in
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Sign in with your team username and credentials to access your submissions, rooms, and schedule.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSignIn}>
          <label
            className="block space-y-2 text-sm font-semibold text-foreground"
            htmlFor="team-username"
          >
            Team Username
            <span className="relative block">
              <UserRound
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="team-username"
                autoComplete="username"
                placeholder="e.g. team_alpha"
                className="h-12 rounded-xl pl-10"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
              />
            </span>
          </label>

          <label
            className="block space-y-2 text-sm font-semibold text-foreground"
            htmlFor="team-password"
          >
            Password
            <span className="relative block">
              <LockKeyhole
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="team-password"
                type={isPasswordVisible ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter team password"
                className="h-12 rounded-xl pr-12 pl-10"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                aria-label={
                  isPasswordVisible ? "Hide password" : "Show password"
                }
                aria-pressed={isPasswordVisible}
                className="absolute top-1/2 right-3 -translate-y-1/2 rounded-sm p-1 text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                onClick={() => setIsPasswordVisible((visible) => !visible)}
                type="button"
              >
                {isPasswordVisible ? (
                  <EyeOff className="size-4" aria-hidden="true" />
                ) : (
                  <Eye className="size-4" aria-hidden="true" />
                )}
              </button>
            </span>
          </label>

          {error ? (
            <p
              className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <Button
            className="h-12 w-full rounded-xl text-sm font-semibold"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? (
              <LoaderCircle className="animate-spin mr-2 size-4" aria-hidden="true" />
            ) : null}
            {isSubmitting ? "Signing in…" : "Sign in to Dashboard"}
            {!isSubmitting ? <ArrowRight className="ml-2 size-4" aria-hidden="true" /> : null}
          </Button>

          <p className="text-center text-xs text-muted-foreground pt-2">
            First time logging in? You will be prompted to update your password immediately after sign in.
          </p>
        </form>
      </section>
    </main>
  );
}

