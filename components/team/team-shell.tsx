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
  Menu,
  ShieldAlert,
  UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  clearTeamSession,
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  const navContent = (closeMenu?: () => void) => (
    <nav className="flex flex-col gap-1.5 p-3">
      {NAV_ITEMS.map((item) => {
        const active =
          item.href === "/team"
            ? pathname === "/team"
            : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={closeMenu}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

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

      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-border lg:bg-card">
          <div className="flex items-center gap-3 p-5 border-b border-border">

            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <UserRound className="size-5" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {session?.name ?? "Team Portal"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                @{session?.username ?? "team"}
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            {navContent()}
          </div>

          {/* Footer controls */}
          <div className="p-4 border-t border-border flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start rounded-xl text-xs"
              onClick={() => setChangePasswordOpen(true)}
            >
              <KeyRound className="mr-2 size-3.5" />
              Change Password
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start rounded-xl text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => void handleSignOut()}
            >
              <LogOut className="mr-2 size-3.5" />
              Sign Out
            </Button>
          </div>
        </aside>

        {/* Mobile Top Header */}
        <header className="lg:hidden flex items-center justify-between border-b border-border bg-card px-4 py-3">
          <div className="flex items-center gap-2.5">

            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <UserRound className="size-5" />
            </div>

            <div>
              <p className="truncate max-w-[150px] text-sm font-semibold text-foreground sm:max-w-xs">
                {session?.name ?? "Team Portal"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                @{session?.username}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={() => setChangePasswordOpen(true)}
              title="Change Password"
            >
              <KeyRound className="size-4" />
            </Button>
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <Menu className="size-4" />
                    <span className="sr-only">Toggle navigation</span>
                  </Button>
                }
              />
              <SheetContent side="left" className="w-72 p-0 flex flex-col">
                <SheetHeader className="p-5 border-b border-border text-left">
                  <div className="flex items-center gap-2.5">

                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <UserRound className="size-5" />
                    </div>

                    <div>
                      <SheetTitle className="text-base font-semibold">
                        {session?.name ?? "Team Portal"}
                      </SheetTitle>
                      <p className="text-xs text-muted-foreground">
                        @{session?.username} • Team
                      </p>
                    </div>
                  </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto py-2">
                  {navContent(() => setIsMobileMenuOpen(false))}
                </div>

                <div className="p-4 border-t border-border flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start rounded-xl text-xs"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setChangePasswordOpen(true);
                    }}
                  >
                    <KeyRound className="mr-2 size-3.5" />
                    Change Password
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start rounded-xl text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      void handleSignOut();
                    }}
                  >
                    <LogOut className="mr-2 size-3.5" />
                    Sign Out
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </header>

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
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