"use client";

import { Suspense, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ClipboardCheck,
  LayoutDashboard,
  ListChecks,
  LogOut,
  RefreshCw,
  UsersRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  clearEvaluatorSession,
  getEvaluatorSession,
  getServerEvaluatorSession,
  subscribeToEvaluatorSession,
} from "@/lib/evaluator-session";
import { useEvaluatorWorkspace } from "@/lib/evaluator/workspace";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/evaluator", label: "Dashboard", icon: LayoutDashboard },
  { href: "/evaluator/teams", label: "My Teams", icon: UsersRound },
  { href: "/evaluator/pending", label: "Pending", icon: ListChecks },
  { href: "/evaluator/completed", label: "Completed", icon: ClipboardCheck },
];

function subscribeToHydration() {
  return () => {};
}

function getClientHydrationSnapshot() {
  return true;
}

function getServerHydrationSnapshot() {
  return false;
}

function Navigation({
  close,
  orientation = "vertical",
}: {
  close?: () => void;
  orientation?: "horizontal" | "vertical";
}) {
  const pathname = usePathname();
  const { teams } = useEvaluatorWorkspace();
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  );
  const pendingCount = teams.filter(
    (team) => team.evaluationStatus !== "confirmed",
  ).length;

  return (
    <NavigationLinks
      close={close}
      orientation={orientation}
      pathname={isHydrated ? pathname : null}
      pendingCount={isHydrated ? pendingCount : 0}
    />
  );
}

function NavigationLinks({
  close,
  orientation = "vertical",
  pathname,
  pendingCount,
}: {
  close?: () => void;
  orientation?: "horizontal" | "vertical";
  pathname: string | null;
  pendingCount: number;
}) {
  return (
    <nav
      className={cn(
        "gap-1",
        orientation === "horizontal"
          ? "flex w-max min-w-full"
          : "grid",
      )}
      aria-label="Evaluator navigation"
    >
      {navigation.map((item) => {
        const isActive =
          pathname !== null &&
          (item.href === "/evaluator"
            ? pathname === item.href
            : pathname.startsWith(item.href));
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={close}
            className={cn(
              "flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
              orientation === "horizontal" && "shrink-0 whitespace-nowrap",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {item.label}
            {item.href === "/evaluator/pending" && pendingCount > 0 ? (
              <Badge className="ml-auto bg-amber-100 text-amber-900">
                {pendingCount}
              </Badge>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

function NavigationFallback({
  close,
  orientation = "vertical",
}: {
  close?: () => void;
  orientation?: "horizontal" | "vertical";
}) {
  return (
    <NavigationLinks
      close={close}
      orientation={orientation}
      pathname={null}
      pendingCount={0}
    />
  );
}

export function EvaluatorShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { rounds, isLoading, refresh } = useEvaluatorWorkspace();
  const session = useSyncExternalStore(
    subscribeToEvaluatorSession,
    getEvaluatorSession,
    getServerEvaluatorSession,
  );
  const currentRound = rounds[0];

  function signOut() {
    clearEvaluatorSession();
    router.replace("/evaluator/login");
  }

  return (
    <div className="min-h-screen bg-muted/40 text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-background p-4 lg:flex lg:flex-col">
        <div className="px-3 py-3">
          <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
            Hackathon
          </p>
          <h1 className="mt-1 font-heading text-xl font-semibold">Evaluator</h1>
        </div>
        <div className="mt-5">
          <Suspense fallback={<NavigationFallback />}>
            <Navigation />
          </Suspense>
        </div>
        <div className="mt-auto border-t pt-4">
          <p className="px-3 text-sm font-medium">
            {session?.username ?? "Evaluator"}
          </p>
          <p className="mt-1 px-3 text-xs text-muted-foreground">
            {session?.role ?? ""}
          </p>
          <Button
            variant="ghost"
            className="mt-3 w-full justify-start rounded-xl"
            onClick={signOut}
          >
            <LogOut aria-hidden="true" /> Sign out
          </Button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <div className="border-b border-border bg-background lg:hidden">
          <div className="flex items-center justify-between gap-3 px-5 py-5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                {"</>"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">Devhack Evaluator</p>
                <p className="truncate text-xs text-muted-foreground">
                  {session?.username ?? "Evaluator"}
                  {session?.role ? ` · ${session.role}` : ""}
                </p>
              </div>
            </div>
            <Button
              className="shrink-0"
              onClick={signOut}
              size="sm"
              variant="outline"
            >
              <LogOut aria-hidden="true" />
              Sign out
            </Button>
          </div>
          <div className="overflow-x-auto px-3 pb-3">
            <Suspense
              fallback={<NavigationFallback orientation="horizontal" />}
            >
              <Navigation orientation="horizontal" />
            </Suspense>
          </div>
        </div>

        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b bg-background/95 px-4 backdrop-blur sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {currentRound
                  ? `Round ${currentRound.roundNumber}: ${currentRound.roundName}`
                  : "No active round"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isLoading
                  ? "Syncing assignments..."
                  : currentRound
                    ? `Panel: ${currentRound.panelName}`
                    : "Synced with evaluation server"}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={refresh}
            disabled={isLoading}
          >
            <RefreshCw
              className={cn(isLoading && "animate-spin")}
              aria-hidden="true"
            />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </header>
        <main className="mx-auto w-full max-w-7xl p-4 sm:p-7">{children}</main>
      </div>
    </div>
  );
}
