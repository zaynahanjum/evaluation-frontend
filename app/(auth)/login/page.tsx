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
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { saveAdminSession } from "@/lib/admin-session";
import {
  apiBaseUrl,
  saveEvaluatorSession,
  type EvaluatorRole,
} from "@/lib/evaluator-session";

type UserRole = "ADMIN" | EvaluatorRole | "TEAM";

type LoginResponse = {
  success: boolean;
  message?: string;
  data?: {
    accessToken: string;
    refreshToken: string;
    role: UserRole;
    user?: { id: string; username: string };
    team?: { username: string };
  };
};

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function signIn(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const payload = (await response.json()) as LoginResponse;

      if (!response.ok || !payload.success || !payload.data) {
        setError(
          payload.message ??
            "We could not sign you in. Check your credentials and try again.",
        );
        return;
      }

      if (payload.data.role === "ADMIN") {
        saveAdminSession({
          accessToken: payload.data.accessToken,
          refreshToken: payload.data.refreshToken,
          username: payload.data.user?.username ?? username,
          userId: payload.data.user?.id ?? "",
        });
        router.replace("/admin");
        return;
      }

      if (payload.data.role === "MENTOR" || payload.data.role === "JUDGE") {
        saveEvaluatorSession({
          accessToken: payload.data.accessToken,
          refreshToken: payload.data.refreshToken,
          role: payload.data.role,
          username: payload.data.user?.username ?? username,
        });
        router.replace("/evaluator");
        return;
      }

      setNotice(
        "Team sign-in was successful. That portal is not available in this frontend yet.",
      );
    } catch {
      setError(
        "The Devhack server is unavailable. Confirm it is running and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-linear-to-br from-foreground/20 via-background to-primary/20 px-4 py-10 text-foreground">
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
          <div className="mb-9 flex items-center justify-between gap-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                {"</>"}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Devhack</p>
                <p className="text-xs text-muted-foreground">SOSC</p>
              </div>
            </div>
            <p className="shrink-0 text-right text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
              Devhost 2026
            </p>
          </div>
          <h1 className="mt-3 font-heading text-4xl font-semibold tracking-tight text-card-foreground">
            Login
          </h1>
        </div>

        <form className="space-y-5" onSubmit={signIn}>
          <label
            className="block space-y-2 text-sm font-semibold text-foreground"
            htmlFor="login-username"
          >
            Username
            <span className="relative block">
              <UserRound
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="login-username"
                autoComplete="username"
                placeholder="Enter your username"
                className="h-12 rounded-xl pl-10"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
              />
            </span>
          </label>

          <label
            className="block space-y-2 text-sm font-semibold text-foreground"
            htmlFor="login-password"
          >
            Password
            <span className="relative block">
              <LockKeyhole
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="login-password"
                type={isPasswordVisible ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
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
              className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive"
              role="alert"
            >
              {error}
            </p>
          ) : null}
          {notice ? (
            <p
              className="rounded-md bg-secondary px-4 py-3 text-sm text-secondary-foreground"
              role="status"
            >
              {notice}
            </p>
          ) : null}

          <Button
            className="h-12 w-full rounded-xl"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            ) : null}
            {isSubmitting ? "Signing in…" : "Sign in"}
            {!isSubmitting ? <ArrowRight aria-hidden="true" /> : null}
          </Button> 

        </form>
      </section>
    </main>
  );
}
