"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  LogOut,
  RefreshCw,
  UserRound,
  UsersRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  clearEvaluatorSession,
  getEvaluatorSession,
  getServerEvaluatorSession,
  subscribeToEvaluatorSession,
} from "@/lib/evaluator-session";
import { useEvaluatorWorkspace } from "@/lib/evaluator/workspace";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/evaluator", label: "Dashboard", icon: LayoutDashboard },
  { href: "/evaluator/teams", label: "My Teams", icon: UsersRound },
];

export function EvaluatorShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
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
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="border-b border-border bg-card lg:w-64 lg:border-r lg:border-b-0">
          <div className="flex items-center justify-between gap-3 px-5 py-5 lg:block">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <UserRound className="size-5" />
              </div>

              <div>
                <p className="text-sm font-semibold">{session?.username ?? "Evaluator"}</p>
                <p className="text-xs text-muted-foreground truncate max-w-[140px]">
                  {session?.role ? `${session.role}` : ""}
                </p>
              </div>
            </div>
            <Button
              className="lg:mt-4 lg:w-full"
              onClick={signOut}
              size="sm"
              variant="outline"
            >
              <LogOut className="size-4" />
              Sign out
            </Button>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible">
            {NAV_ITEMS.map((item) => {
              const active =
                item.href === "/evaluator"
                  ? pathname === "/evaluator"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3 py-2 text-sm whitespace-nowrap transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                  href={item.href}
                  key={item.href}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/95 px-4 backdrop-blur sm:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {currentRound
                    ? `${currentRound.roundName}`
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
                className={cn("size-3.5", isLoading && "animate-spin")}
                aria-hidden="true"
              />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </header>
          <main className="flex-1 px-4 py-6 sm:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
