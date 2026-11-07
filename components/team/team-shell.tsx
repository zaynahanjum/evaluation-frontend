"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarClock,
  FileCode2,
  KeyRound,
  LayoutDashboard,
  LogOut,
  ShieldAlert,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  getTeamSession,
  subscribeToTeamSession,
  type TeamSession,
} from "@/lib/team/session";
import { teamApi } from "@/lib/team/api";
import { cn } from "@/lib/utils";
import { ChangePasswordDialog } from "./change-password-dialog";

const NAV_ITEMS = [
  { href: "/team", label: "Dashboard", icon: LayoutDashboard },
  { href: "/team/submissions", label: "Submissions", icon: FileCode2 },
  { href: "/team/timeline", label: "Timeline", icon: CalendarClock },
];

export function TeamShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [session, setSession] = useState<TeamSession | null>(null);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  useEffect(() => {
    if (pathname === "/team/login") return;

    const current = getTeamSession();
    if (!current) {
      router.replace("/team/login");
      return;
    }
    setSession(current);

    if (current.mustChangePassword) {
      setChangePasswordOpen(true);
    }

    const unsubscribe = subscribeToTeamSession(() => {
      const updated = getTeamSession();
      if (!updated) {
        router.replace("/team/login");
      } else {
        setSession(updated);
      }
    });

    return () => unsubscribe();
  }, [pathname, router]);

  if (pathname === "/team/login") {
    return <>{children}</>;
  }

  const handleSignOut = async () => {
    await teamApi.logout();
    router.replace("/team/login");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Must Change Password Alert Banner */}
      {session?.mustChangePassword ? (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-4 shrink-0 text-amber-500" />
            <span>
              Please update your default team password to secure your account.
            </span>
          </div>
          <Button
            size="xs"
            variant="outline"
            className="border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20"
            onClick={() => setChangePasswordOpen(true)}
          >
            Change Now
          </Button>
        </div>
      ) : null}

      <div className="flex min-h-screen flex-1 flex-col lg:flex-row">
        <aside className="border-b border-border bg-card lg:w-64 lg:border-r lg:border-b-0">
          <div className="flex items-center justify-between gap-3 px-5 py-5 lg:block">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <UserRound className="size-5" />
              </div>

              <div>
                <p className="text-sm font-semibold">{session?.name ?? "Team Portal"}</p>
                <p className="text-xs text-muted-foreground truncate max-w-[140px]">
                  {session?.username ?? "Team Portal"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 lg:mt-4 lg:flex-col lg:w-full">
              <Button
                className="lg:w-full"
                onClick={() => setChangePasswordOpen(true)}
                size="sm"
                variant="outline"
              >
                <KeyRound className="size-4" />
                <span className="hidden sm:inline lg:inline">Password</span>
              </Button>
              <Button
                className="lg:w-full"
                onClick={() => void handleSignOut()}
                size="sm"
                variant="outline"
              >
                <LogOut className="size-4" />
                <span className="hidden sm:inline lg:inline">Sign out</span>
              </Button>
            </div>
          </div>

          <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible">
            {NAV_ITEMS.map((item) => {
              const active =
                item.href === "/team"
                  ? pathname === "/team"
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

        <main className="flex-1 px-4 py-6 sm:px-8">{children}</main>
      </div>

      {/* Change Password Dialog */}
      <ChangePasswordDialog
        open={changePasswordOpen}
        onOpenChange={setChangePasswordOpen}
        isForced={Boolean(session?.mustChangePassword)}
        onSuccess={() => {
          if (session) {
            setSession({ ...session, mustChangePassword: false });
          }
        }}
      />
    </div>
  );
}
